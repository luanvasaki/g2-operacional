import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { WhatsAppIcon } from './icons/WhatsAppIcon'
import { getMonthInfo } from '../utils/brazilianCalendar'
import { buildMonthOptions, getCurrentMonthKey } from '../utils/months'

export function Dashboard({
  setActiveTab,
  onOpenNewGuardModal,
  onOpenFastEdit,
  onOpenQuickHub,
  onOpenMultiDay,
  onOpenWhatsApp,
}) {
  const {
    selectedMonth,
    setSelectedMonth,
    guards,
    posts,
    shifts,
    defaultHourlyRate,
    setDefaultHourlyRate,
    budgetCeiling,
    setBudgetCeiling,
    getGuardCalculations,
    getPaymentStatus,
    togglePaymentStatus,
  } = useApp()

  const [activeQuinzena, setActiveQuinzena] = useState(1) // 1 or 2
  const [showRateModal, setShowRateModal] = useState(false)
  const [tempRate, setTempRate] = useState(defaultHourlyRate)
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [tempBudget, setTempBudget] = useState(budgetCeiling || 12000)

  const activeGuards = guards.filter(
    (g) => g.active && g.id !== 'g-folguista' && g.name?.toLowerCase() !== 'folguista'
  )

  // Calculations for active quinzena
  let totalHours = 0
  let totalAmount = 0
  let paidAmount = 0
  let pendingAmount = 0
  let pendingGuardsCount = 0

  const activeQKey = activeQuinzena === 1 ? 'q1' : 'q2'
  activeGuards.forEach((g) => {
    const calc = getGuardCalculations(g.id)
    const amount = activeQuinzena === 1 ? calc.q1Total : calc.q2Total
    const hours = activeQuinzena === 1 ? calc.q1Hours : calc.q2Hours
    totalHours += hours
    totalAmount += amount
    const payStatus = getPaymentStatus(g.id, activeQKey)
    if (payStatus.status === 'PAID') {
      paidAmount += amount
    } else if (amount > 0) {
      pendingAmount += amount
      pendingGuardsCount++
    }
  })

  totalHours = Math.round(totalHours * 100) / 100
  totalAmount = Math.round(totalAmount * 100) / 100
  paidAmount = Math.round(paidAmount * 100) / 100
  pendingAmount = Math.round(pendingAmount * 100) / 100

  // Budget ceiling calculation
  const [year, month] = selectedMonth.split('-').map(Number)
  const monthInfo = getMonthInfo(year, month)
  const totalDaysInMonth = monthInfo.totalDays
  const currentBudgetCeiling = Number(budgetCeiling) || 12000
  const budgetPercent = Math.min(100, (totalAmount / currentBudgetCeiling) * 100)
  const budgetRemaining = Math.max(0, currentBudgetCeiling - totalAmount)

  const monthOptions = buildMonthOptions({ selected: selectedMonth })

  const sampleTodayGuards = activeGuards.slice(0, 4)

  const handleSaveRate = (e) => {
    e.preventDefault()
    setDefaultHourlyRate(Number(tempRate))
    setShowRateModal(false)
  }

  const handleSaveBudget = (e) => {
    e.preventDefault()
    setBudgetCeiling(Number(tempBudget) || 12000)
    setShowBudgetModal(false)
  }

  return (
    <div className="flex flex-col w-full gap-5 pb-8 max-w-[1920px] 2xl:max-w-full mx-auto">
      {/* Central de Facilidades G2 - Banner de Ações em 1 Toque */}
      <div className="bg-gradient-to-r from-navy via-navy-soft to-brand text-white p-4 rounded-3xl shadow-lg border border-white/10 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-mint animate-ping"></span>
            <span className="font-mono text-[11px] text-mint uppercase font-bold tracking-wider">
              Facilidades Operacionais
            </span>
          </div>
          <span className="font-mono text-[10px] text-white/70 bg-white/10 px-2 py-0.5 rounded-full">
            1 Toque
          </span>
        </div>

        <h3 className="text-sm font-bold mb-3 relative z-10">
          O que você deseja fazer agora?
        </h3>

        {/* 2 atalhos principais (grandes, fáceis de tocar no celular) */}
        <div className="grid grid-cols-2 gap-3 relative z-10">
          <button
            type="button"
            onClick={() => setActiveTab('quinzena-horas')}
            className="flex flex-col items-center justify-center gap-1.5 min-h-[120px] p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all border border-white/10 active:scale-95 text-center cursor-pointer"
            title="Acessar a tela de Escala e Horas (Grade do Mês)"
          >
            <span className="material-symbols-outlined text-[36px] text-warn-light">
              calendar_month
            </span>
            <span className="text-base font-bold leading-tight text-white">Escala & Horas</span>
            <span className="text-xs text-white/70">Grade do Mês</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenQuickHub && onOpenQuickHub('pagamento')}
            className="flex flex-col items-center justify-center gap-1.5 min-h-[120px] p-4 rounded-2xl bg-brand hover:bg-brand-hover transition-all border border-mint/40 active:scale-95 text-center shadow-xs cursor-pointer"
            title="Calcular e liquidar pagamentos por quinzena"
          >
            <span className="material-symbols-outlined text-[36px] text-mint">
              payments
            </span>
            <span className="text-base font-bold leading-tight text-white">Pagar PIX</span>
            <span className="text-xs text-on-navy">Quinzena</span>
          </button>
        </div>
      </div>

      {/* Cycle Switcher Bar */}
      <div className="flex flex-col gap-2 bg-white p-3.5 rounded-2xl shadow-xs border border-line">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-brand text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              calendar_today
            </span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-bold text-xs text-ink outline-none cursor-pointer capitalize"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setActiveTab('quinzena-horas')}
            className="flex items-center gap-1 text-ink-soft hover:text-ink text-xs font-semibold px-2 py-1 rounded transition-colors"
          >
            <span>Ver Grade</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>

        {/* Toggle Segmented Buttons */}
        <div className="grid grid-cols-2 p-1 bg-field rounded-xl gap-1">
          <button
            onClick={() => setActiveQuinzena(1)}
            className={`flex items-center justify-center py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              activeQuinzena === 1
                ? 'bg-white shadow-xs text-ink'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
              1ª Quinzena (01-15)
            </span>
          </button>

          <button
            onClick={() => setActiveQuinzena(2)}
            className={`flex items-center justify-center py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              activeQuinzena === 2
                ? 'bg-white shadow-xs text-ink'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
              2ª Quinzena (16-{totalDaysInMonth})
            </span>
          </button>
        </div>
      </div>

      {/* Alerta de Faltas de Pagamento */}
      {pendingGuardsCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-400 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs font-black">
              <span className="material-symbols-outlined text-[24px]">notification_important</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-2xs">
                  Alerta Financeiro
                </span>
                <span className="text-xs font-black text-warn-ink">
                  {pendingGuardsCount} {pendingGuardsCount === 1 ? 'prestador aguardando pagamento' : 'prestadores aguardando pagamento'}
                </span>
              </div>
              <p className="text-xs text-warn-strong mt-1 font-medium">
                Faltam liquidar <strong>R$ {pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> na {activeQuinzena === 1 ? '1ª Quinzena' : '2ª Quinzena'} ({monthInfo.formattedMonth}).
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('pagamentos')}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">payments</span>
            <span>Ver Faltas & Pagar</span>
          </button>
        </div>
      )}

      {/* 2-Column Responsive Layout for PC (Master Bento & Efetivo on Left, Postos & Atalhos on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Financial Bento & Guards List */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
          {/* Cartão escuro de previsão de pagamento */}
          <div className="flex flex-col bg-navy text-white rounded-2xl p-5 shadow-md relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-brand/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-center justify-between mb-2 z-10 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-on-navy font-semibold">
              Previsão de Pagamento
            </span>
            <span className="px-2 py-0.5 rounded-md bg-mint/20 text-mint border border-mint/40 font-mono text-[10px] font-black uppercase">
              📅 {monthInfo.formattedMonth.toUpperCase()}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 bg-brand text-white px-2 py-0.5 rounded-full font-mono text-[10px] font-bold">
            <span className="material-symbols-outlined text-[12px]">verified</span>
            {activeQuinzena === 1 ? '1ª Quinzena' : '2ª Quinzena'}
          </span>
        </div>

        {/* Main Value Hero */}
        <div className="flex flex-col mb-3 z-10">
          <span className="text-xs text-on-navy">
            Total Previsto da {activeQuinzena === 1 ? '1ª Quinzena' : '2ª Quinzena'} • <strong className="text-white font-bold">{monthInfo.formattedMonth}</strong>
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-mono text-3xl font-bold tracking-tight text-white">
              R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Differentiated Paid vs Still To Pay Split */}
        <div className="grid grid-cols-2 gap-2 mb-3 z-10">
          <div className="p-3 rounded-xl bg-brand/40 border border-mint/40 flex flex-col">
            <span className="text-[11px] font-bold text-mint flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">check_circle</span>
              Valor Já Pago
            </span>
            <span className="font-mono text-lg font-black text-mint mt-0.5">
              R$ {paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-on-navy mt-0.5">
              {totalAmount > 0 ? ((paidAmount / totalAmount) * 100).toFixed(0) : 0}% liquidado
            </span>
          </div>

          <div className="p-3 rounded-xl bg-warn-soft/15 border border-warn-soft/30 flex flex-col">
            <span className="text-[11px] font-bold text-warn-soft flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">schedule</span>
              Ainda a Pagar
            </span>
            <span className="font-mono text-lg font-black text-warn-soft mt-0.5">
              R$ {pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-on-navy mt-0.5">
              {totalAmount > 0 ? ((pendingAmount / totalAmount) * 100).toFixed(0) : 0}% em aberto
            </span>
          </div>
        </div>

        {/* Metrics Split Row */}
        <div className="grid grid-cols-2 gap-2 pt-1 z-10">
          <div className="flex flex-col p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/5">
            <div className="flex items-center gap-1 text-on-navy mb-1">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              <span className="text-xs">Horas Totais</span>
            </div>
            <span className="font-mono text-base font-bold text-white">
              {totalHours}h 00m
            </span>
          </div>

          <div className="flex flex-col justify-between p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-on-navy">
                <span className="material-symbols-outlined text-[16px]">payments</span>
                <span className="text-xs">Taxa Padrão</span>
              </div>
              <button
                onClick={() => {
                  setTempRate(defaultHourlyRate)
                  setShowRateModal(true)
                }}
                className="w-5 h-5 rounded flex items-center justify-center text-mint hover:bg-white/20 transition"
                title="Editar taxa padrão"
              >
                <span className="material-symbols-outlined text-[14px]">edit</span>
              </button>
            </div>
            <span className="font-mono text-base font-bold text-white">
              R$ {defaultHourlyRate.toFixed(2).replace('.', ',')}/h
            </span>
          </div>
        </div>

        {/* Budget Progress Bar */}
        <div className="flex flex-col gap-1.5 mt-4 pt-2 z-10">
          <div className="flex justify-between items-center text-on-navy text-xs">
            <div className="flex items-center gap-1.5">
              <span>
                Teto Orçado: <strong className="text-white font-mono">R$ {currentBudgetCeiling.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setTempBudget(currentBudgetCeiling)
                  setShowBudgetModal(true)
                }}
                className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-mint text-[10px] font-bold flex items-center gap-1 transition active:scale-95"
                title="Clique para editar o teto orçado"
              >
                <span className="material-symbols-outlined text-[12px]">edit</span>
                <span>Editar Teto</span>
              </button>
            </div>
            <span className="font-mono font-bold text-mint">
              {budgetPercent.toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full bg-mint rounded-full transition-all duration-500"
              style={{ width: `${budgetPercent}%` }}
            ></div>
          </div>
          <span className="font-mono text-[11px] text-on-navy/80">
            Saldo disponível: R$ {budgetRemaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} no período
          </span>
        </div>
      </div>

      {/* Resumo Operacional */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h2 className="text-sm font-bold text-ink">Resumo do Efetivo</h2>
            <span className="bg-field-strong px-2 py-0.5 rounded-full font-mono text-[10px] text-ink-muted font-semibold">
              {activeGuards.length} Colaboradores
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-field text-brand font-bold border border-line">
              Ref: {monthInfo.formattedMonth}
            </span>
          </div>
          <span className="font-mono text-xs text-brand font-bold">
            {totalHours}h acumuladas
          </span>
        </div>

        {/* Active List */}
        <div className="flex flex-col gap-2">
          {sampleTodayGuards.map((guard) => {
            const post = posts.find((p) => p.id === guard.postId)
            const calc = getGuardCalculations(guard.id)
            const shiftHours = activeQuinzena === 1 ? calc.q1Hours : calc.q2Hours
            const shiftAmount = activeQuinzena === 1 ? calc.q1Total : calc.q2Total
            const qKey = activeQuinzena === 1 ? 'q1' : 'q2'
            const payment = getPaymentStatus(guard.id, qKey)
            const isPaid = payment.status === 'PAID'

            return (
              <div
                key={guard.id}
                className="flex items-center justify-between p-3.5 bg-white rounded-2xl shadow-xs border border-line hover:bg-field transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-line flex items-center justify-center text-ink font-bold text-xs shrink-0">
                    {guard.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm text-ink truncate">
                      {guard.name}
                    </span>
                    <span className="text-xs text-ink-muted truncate">
                      Colaborador
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-xs font-bold text-brand">
                      R$ {shiftAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="font-mono text-[9px] text-ink-muted">
                      {shiftHours}h • ({monthInfo.monthName.slice(0, 3)}/{year})
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      togglePaymentStatus(guard.id, qKey)
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-xs ${
                      isPaid
                        ? 'bg-brand hover:bg-brand-hover text-white border border-mint'
                        : 'bg-brand hover:bg-brand-hover text-white'
                    }`}
                    title={
                      isPaid
                        ? `Pagamento de ${guard.name} marcado como PAGO. Clique novamente para retirar o pagamento e reabrir.`
                        : `Clique para pagar ${guard.name} (${monthInfo.monthName.slice(0, 3)}/${year})`
                    }
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {isPaid ? 'check_circle' : 'payments'}
                    </span>
                    <span>{isPaid ? '✓ Pago' : 'Pagar'}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('pagamentos')}
                    className="text-ink-muted hover:text-ink p-1"
                    title="Ir para Pagamentos & PIX"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Footer Action */}
        <button
          onClick={() => setActiveTab('prestadores')}
          className="w-full py-3 rounded-2xl bg-field-strong hover:bg-line text-ink font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-98"
        >
          <span>Ver todos os {activeGuards.length} colaboradores ativos</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </div>
    </div>

    {/* Right Column: Escala & Horas e Atalhos */}
    <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
      {/* Card da Escala & Horas do Mês */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-line flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-field">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-brand text-[20px]">calendar_month</span>
            <h3 className="text-sm font-bold text-ink">Escala & Horas</h3>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('quinzena-horas')}
            className="text-[11px] text-brand font-bold hover:underline cursor-pointer flex items-center gap-0.5"
          >
            <span>Ver Grade</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {/* Resumo do Mês Selecionado */}
          <div className="p-3 rounded-xl bg-field/60 border border-line/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-brand border border-line shadow-2xs shrink-0">
                <span className="material-symbols-outlined text-[18px]">event</span>
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-ink block truncate">
                  {monthInfo.formattedMonth}
                </span>
                <span className="text-[10px] text-ink-muted">
                  {activeQuinzena === 1 ? '1ª Quinzena (Dias 01 a 15)' : `2ª Quinzena (Dias 16 a ${totalDaysInMonth})`}
                </span>
              </div>
            </div>
            <span className="font-mono text-xs font-bold text-brand bg-white px-2.5 py-1 rounded-lg border border-line shadow-2xs shrink-0">
              {totalHours}h
            </span>
          </div>

          {/* Plantão de Hoje */}
          {(() => {
            // "Hoje" é sempre o dia real, no mês real (independe do mês selecionado)
            const todayDay = new Date().getDate()
            const todayMonth = getCurrentMonthKey()
            const todayPlantao = activeGuards
              .map((g) => ({
                guard: g,
                hours: shifts?.[todayMonth]?.[g.id]?.[todayDay] || 0,
              }))
              .filter((x) => x.hours > 0)

            return (
              <div className="p-3 rounded-xl bg-white border border-line flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-ink flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand" />
                    <span>Plantão de Hoje (Dia {todayDay})</span>
                  </span>
                  <span className="font-mono text-[10px] text-ink-muted font-semibold">
                    {todayPlantao.length} {todayPlantao.length === 1 ? 'colaborador' : 'colaboradores'}
                  </span>
                </div>

                {todayPlantao.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {todayPlantao.map(({ guard, hours }) => (
                      <span
                        key={guard.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-field text-ink text-xs font-bold border border-line"
                      >
                        <span>{guard.name}</span>
                        <span className="font-mono text-[10px] text-brand font-black">({hours}h)</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[11px] text-ink-muted italic">
                    Nenhum colaborador com horas lançadas hoje.
                  </span>
                )}
              </div>
            )
          })()}

          {/* Botão Acessar Tela da Escala e Horas */}
          <button
            type="button"
            onClick={() => setActiveTab('quinzena-horas')}
            className="w-full py-2.5 px-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer active:scale-98"
          >
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            <span>Acessar Grade Completa (Escala & Horas)</span>
          </button>
        </div>
      </div>

      {/* Atalhos Rápidos da Gestão */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-line flex flex-col gap-3">
        <div className="flex items-center gap-2 pb-2 border-b border-field">
          <span className="material-symbols-outlined text-brand text-[20px]">bolt</span>
          <h3 className="text-sm font-bold text-ink">Atalhos da Gestão</h3>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onOpenWhatsApp && onOpenWhatsApp()}
            className="w-full py-2.5 px-3 rounded-xl bg-whatsapp/15 hover:bg-whatsapp/25 text-whatsapp-dark font-bold text-xs flex items-center justify-between border border-whatsapp/30 transition cursor-pointer active:scale-98"
          >
            <div className="flex items-center gap-2">
              <WhatsAppIcon className="w-4 h-4 fill-whatsapp" />
              <span>Importar Escala do WhatsApp</span>
            </div>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pagamentos')}
            className="w-full py-2.5 px-3 rounded-xl bg-navy hover:bg-navy-soft text-white font-bold text-xs flex items-center justify-between shadow-xs transition cursor-pointer active:scale-98"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-mint">payments</span>
              <span>Extrato & Pagamentos PIX</span>
            </div>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  </div>

      {/* Hourly Rate Modal */}
      {showRateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 shadow-2xl border border-line">
            <h3 className="text-sm font-bold text-ink mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand">payments</span>
              <span>Ajustar Taxa Padrão</span>
            </h3>
            <form onSubmit={handleSaveRate} className="space-y-3">
              <div>
                <label className="text-xs text-ink-muted block mb-1">Valor da Hora (R$)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs text-ink-muted font-bold">R$</span>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={tempRate}
                    onChange={(e) => setTempRate(e.target.value)}
                    className="w-full h-11 pl-9 pr-3 bg-field text-ink font-mono font-bold text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRateModal(false)}
                  className="px-3 py-1.5 text-xs text-ink-muted hover:text-ink"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-black text-white text-xs font-bold rounded-lg"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Teto Orçado */}
      {showBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-line space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-field pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-mint/30 flex items-center justify-center text-brand">
                  <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">Editar Teto Orçado</h3>
                  <p className="text-[10px] text-ink-muted">Limite máximo de gastos para a quinzena</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBudgetModal(false)}
                className="w-8 h-8 rounded-full bg-field flex items-center justify-center text-ink-soft hover:bg-line"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-ink block mb-1.5">
                  Valor do Teto Orçado (R$):
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 font-mono font-bold text-xs text-ink-muted">
                    R$
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={tempBudget}
                    onChange={(e) => setTempBudget(Number(e.target.value) || 0)}
                    className="w-full h-11 pl-10 pr-3 rounded-xl bg-field text-ink font-mono font-bold text-base border border-line focus:outline-none focus:ring-2 focus:ring-brand"
                    autoFocus
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <span className="text-[10px] font-bold text-ink-muted block mb-1">
                  Valores Rápidos:
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[8000, 10000, 12000, 15000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTempBudget(val)}
                      className={`py-1.5 rounded-xl text-xs font-mono font-bold transition border ${
                        tempBudget === val
                          ? 'bg-brand text-white border-brand'
                          : 'bg-field text-ink border-line hover:bg-line'
                      }`}
                    >
                      {val >= 1000 ? `${val / 1000}k` : val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-field">
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-line text-xs font-bold text-ink-soft hover:bg-field transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow-md transition active:scale-95"
                >
                  Salvar Teto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
