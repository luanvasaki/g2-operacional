import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { WhatsAppIcon } from './icons/WhatsAppIcon'
import { getMonthInfo } from '../utils/brazilianCalendar'

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

  const activeGuards = guards.filter((g) => g.active)

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

  // Budget ceiling calculation
  const [year, month] = selectedMonth.split('-').map(Number)
  const monthInfo = getMonthInfo(year, month)
  const totalDaysInMonth = monthInfo.totalDays
  const currentBudgetCeiling = Number(budgetCeiling) || 12000
  const budgetPercent = Math.min(100, (totalAmount / currentBudgetCeiling) * 100)
  const budgetRemaining = Math.max(0, currentBudgetCeiling - totalAmount)

  const monthOptions = [
    { value: '2026-08', label: 'Agosto 2026' },
    { value: '2026-09', label: 'Setembro 2026' },
    { value: '2026-10', label: 'Outubro 2026' },
    { value: '2026-11', label: 'Novembro 2026' },
    { value: '2026-12', label: 'Dezembro 2026' },
  ]

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
    <div className="flex flex-col w-full gap-4 pb-8 max-w-xl mx-auto">
      {/* Central de Facilidades G2 - Banner de Ações em 1 Toque */}
      <div className="bg-gradient-to-r from-[#131b2e] via-[#1a243b] to-[#006c49] text-white p-4 rounded-3xl shadow-lg border border-white/10 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#6cf8bb] animate-ping"></span>
            <span className="font-mono text-[11px] text-[#6cf8bb] uppercase font-bold tracking-wider">
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

        {/* 5 Easy Shortcut Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 relative z-10">
          <button
            type="button"
            onClick={() => onOpenWhatsApp && onOpenWhatsApp()}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-[#25D366]/20 hover:bg-[#25D366]/30 transition-all border border-[#25D366]/40 active:scale-95 text-center shadow-xs"
            title="Importar lista de escala copiada do WhatsApp"
          >
            <WhatsAppIcon className="w-5 h-5 fill-[#25D366] mb-1" />
            <span className="text-[11px] font-bold leading-tight text-white">Colar WhatsApp</span>
            <span className="text-[9px] text-[#6cf8bb] font-mono">Importar Lista</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenQuickHub && onOpenQuickHub('escala')}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 transition-all border border-white/10 active:scale-95 text-center"
            title="Gerar escala automática por dias pares, ímpares ou 12x36"
          >
            <span className="material-symbols-outlined text-[22px] text-[#38bdf8] mb-1">
              auto_fix_high
            </span>
            <span className="text-[11px] font-bold leading-tight">Auto Escala</span>
            <span className="text-[9px] text-white/70 font-mono">Pares / Ímpares</span>
          </button>

          <button
            type="button"
            onClick={() => (onOpenMultiDay ? onOpenMultiDay() : onOpenQuickHub && onOpenQuickHub('escala'))}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 transition-all border border-white/10 active:scale-95 text-center"
            title="Lançar múltiplos dias no calendário manual"
          >
            <span className="material-symbols-outlined text-[22px] text-[#ffb95f] mb-1">
              calendar_add_on
            </span>
            <span className="text-[11px] font-bold leading-tight text-white">Vários Dias</span>
            <span className="text-[9px] text-white/70 font-mono">Grade Manual</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenQuickHub && onOpenQuickHub('cadastro')}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 transition-all border border-white/10 active:scale-95 text-center"
            title="Cadastrar novo colaborador em 10s"
          >
            <span className="material-symbols-outlined text-[22px] text-[#6cf8bb] mb-1">
              person_add
            </span>
            <span className="text-[11px] font-bold leading-tight">Novo Bico</span>
            <span className="text-[9px] text-white/70 font-mono">Cadastrar</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenQuickHub && onOpenQuickHub('pagamento')}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-[#006c49] hover:bg-[#005236] transition-all border border-[#6cf8bb]/40 active:scale-95 text-center col-span-2 sm:col-span-1 shadow-xs"
            title="Calcular e liquidar pagamentos por quinzena"
          >
            <span className="material-symbols-outlined text-[22px] text-[#6cf8bb] mb-1">
              payments
            </span>
            <span className="text-[11px] font-bold leading-tight text-white">Pagar PIX</span>
            <span className="text-[9px] text-[#bec6e0] font-mono">Quinzena</span>
          </button>
        </div>
      </div>

      {/* Cycle Switcher Bar */}
      <div className="flex flex-col gap-2 bg-white p-3.5 rounded-2xl shadow-xs border border-[#dde9ff]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-[#006c49] text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              calendar_today
            </span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-bold text-xs text-[#0d1c2f] outline-none cursor-pointer capitalize"
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
            className="flex items-center gap-1 text-[#45464d] hover:text-[#0d1c2f] text-xs font-semibold px-2 py-1 rounded transition-colors"
          >
            <span>Ver Grade</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>

        {/* Toggle Segmented Buttons */}
        <div className="grid grid-cols-2 p-1 bg-[#eff4ff] rounded-xl gap-1">
          <button
            onClick={() => setActiveQuinzena(1)}
            className={`flex items-center justify-center py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              activeQuinzena === 1
                ? 'bg-white shadow-xs text-[#0d1c2f]'
                : 'text-[#45464d] hover:text-[#0d1c2f]'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#006c49]"></span>
              1ª Quinzena (01-15)
            </span>
          </button>

          <button
            onClick={() => setActiveQuinzena(2)}
            className={`flex items-center justify-center py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              activeQuinzena === 2
                ? 'bg-white shadow-xs text-[#0d1c2f]'
                : 'text-[#45464d] hover:text-[#0d1c2f]'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#006c49]"></span>
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
                <span className="text-xs font-black text-[#78350f]">
                  {pendingGuardsCount} {pendingGuardsCount === 1 ? 'prestador aguardando pagamento' : 'prestadores aguardando pagamento'}
                </span>
              </div>
              <p className="text-xs text-[#92400e] mt-1 font-medium">
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

      {/* Financial Master Bento Card (Stitch Dark Theme #131b2e) */}
      <div className="flex flex-col bg-[#131b2e] text-white rounded-2xl p-5 shadow-md relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-[#006c49]/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-center justify-between mb-2 z-10 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#bec6e0] font-semibold">
              Previsão de Pagamento
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#6cf8bb]/20 text-[#6cf8bb] border border-[#6cf8bb]/40 font-mono text-[10px] font-black uppercase">
              📅 {monthInfo.formattedMonth.toUpperCase()}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 bg-[#006c49] text-white px-2 py-0.5 rounded-full font-mono text-[10px] font-bold">
            <span className="material-symbols-outlined text-[12px]">verified</span>
            {activeQuinzena === 1 ? '1ª Quinzena' : '2ª Quinzena'}
          </span>
        </div>

        {/* Main Value Hero */}
        <div className="flex flex-col mb-3 z-10">
          <span className="text-xs text-[#bec6e0]">
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
          <div className="p-3 rounded-xl bg-[#006c49]/40 border border-[#6cf8bb]/40 flex flex-col">
            <span className="text-[11px] font-bold text-[#6cf8bb] flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">check_circle</span>
              Valor Já Pago
            </span>
            <span className="font-mono text-lg font-black text-[#6cf8bb] mt-0.5">
              R$ {paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-[#bec6e0] mt-0.5">
              {totalAmount > 0 ? ((paidAmount / totalAmount) * 100).toFixed(0) : 0}% liquidado
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#ffddb8]/15 border border-[#ffddb8]/30 flex flex-col">
            <span className="text-[11px] font-bold text-[#ffddb8] flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">schedule</span>
              Ainda a Pagar
            </span>
            <span className="font-mono text-lg font-black text-[#ffddb8] mt-0.5">
              R$ {pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-[#bec6e0] mt-0.5">
              {totalAmount > 0 ? ((pendingAmount / totalAmount) * 100).toFixed(0) : 0}% em aberto
            </span>
          </div>
        </div>

        {/* Metrics Split Row */}
        <div className="grid grid-cols-2 gap-2 pt-1 z-10">
          <div className="flex flex-col p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/5">
            <div className="flex items-center gap-1 text-[#bec6e0] mb-1">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              <span className="text-xs">Horas Totais</span>
            </div>
            <span className="font-mono text-base font-bold text-white">
              {totalHours}h 00m
            </span>
          </div>

          <div className="flex flex-col justify-between p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-[#bec6e0]">
                <span className="material-symbols-outlined text-[16px]">payments</span>
                <span className="text-xs">Taxa Padrão</span>
              </div>
              <button
                onClick={() => {
                  setTempRate(defaultHourlyRate)
                  setShowRateModal(true)
                }}
                className="w-5 h-5 rounded flex items-center justify-center text-[#6cf8bb] hover:bg-white/20 transition"
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
          <div className="flex justify-between items-center text-[#bec6e0] text-xs">
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
                className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#6cf8bb] text-[10px] font-bold flex items-center gap-1 transition active:scale-95"
                title="Clique para editar o teto orçado"
              >
                <span className="material-symbols-outlined text-[12px]">edit</span>
                <span>Editar Teto</span>
              </button>
            </div>
            <span className="font-mono font-bold text-[#6cf8bb]">
              {budgetPercent.toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full bg-[#6cf8bb] rounded-full transition-all duration-500"
              style={{ width: `${budgetPercent}%` }}
            ></div>
          </div>
          <span className="font-mono text-[11px] text-[#bec6e0]/80">
            Saldo disponível: R$ {budgetRemaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} no período
          </span>
        </div>
      </div>

      {/* Resumo Operacional */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h2 className="text-sm font-bold text-[#0d1c2f]">Resumo do Efetivo</h2>
            <span className="bg-[#e6eeff] px-2 py-0.5 rounded-full font-mono text-[10px] text-[#76777d] font-semibold">
              {activeGuards.length} Colaboradores
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-[#eff4ff] text-[#006c49] font-bold border border-[#dde9ff]">
              Ref: {monthInfo.formattedMonth}
            </span>
          </div>
          <span className="font-mono text-xs text-[#006c49] font-bold">
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
                className="flex items-center justify-between p-3.5 bg-white rounded-2xl shadow-xs border border-[#dde9ff] hover:bg-[#eff4ff] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#dde9ff] flex items-center justify-center text-[#0d1c2f] font-bold text-xs shrink-0">
                    {guard.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm text-[#0d1c2f] truncate">
                      {guard.name}
                    </span>
                    <span className="text-xs text-[#76777d] truncate">
                      📍 {post?.name || 'Posto Geral'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-xs font-bold text-[#006c49]">
                      R$ {shiftAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="font-mono text-[9px] text-[#76777d]">
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
                        ? 'bg-[#006c49] hover:bg-[#005236] text-white border border-[#6cf8bb]'
                        : 'bg-[#006c49] hover:bg-[#005236] text-white'
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
                    className="text-[#76777d] hover:text-[#0d1c2f] p-1"
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
          className="w-full py-3 rounded-2xl bg-[#e6eeff] hover:bg-[#dde9ff] text-[#0d1c2f] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-98"
        >
          <span>Ver todos os {activeGuards.length} colaboradores ativos</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </div>

      {/* Hourly Rate Modal */}
      {showRateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 shadow-2xl border border-[#dde9ff]">
            <h3 className="text-sm font-bold text-[#0d1c2f] mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006c49]">payments</span>
              <span>Ajustar Taxa Padrão</span>
            </h3>
            <form onSubmit={handleSaveRate} className="space-y-3">
              <div>
                <label className="text-xs text-[#76777d] block mb-1">Valor da Hora (R$)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs text-[#76777d] font-bold">R$</span>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={tempRate}
                    onChange={(e) => setTempRate(e.target.value)}
                    className="w-full h-11 pl-9 pr-3 bg-[#eff4ff] text-[#0d1c2f] font-mono font-bold text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-[#006c49]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRateModal(false)}
                  className="px-3 py-1.5 text-xs text-[#76777d] hover:text-[#0d1c2f]"
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
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-[#dde9ff] space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#eff4ff] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#6cf8bb]/30 flex items-center justify-center text-[#006c49]">
                  <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0d1c2f]">Editar Teto Orçado</h3>
                  <p className="text-[10px] text-[#76777d]">Limite máximo de gastos para a quinzena</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBudgetModal(false)}
                className="w-8 h-8 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#45464d] hover:bg-[#dde9ff]"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[#0d1c2f] block mb-1.5">
                  Valor do Teto Orçado (R$):
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 font-mono font-bold text-xs text-[#76777d]">
                    R$
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={tempBudget}
                    onChange={(e) => setTempBudget(Number(e.target.value) || 0)}
                    className="w-full h-11 pl-10 pr-3 rounded-xl bg-[#eff4ff] text-[#0d1c2f] font-mono font-bold text-base border border-[#dde9ff] focus:outline-none focus:ring-2 focus:ring-[#006c49]"
                    autoFocus
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <span className="text-[10px] font-bold text-[#76777d] block mb-1">
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
                          ? 'bg-[#006c49] text-white border-[#006c49]'
                          : 'bg-[#eff4ff] text-[#0d1c2f] border-[#dde9ff] hover:bg-[#dde9ff]'
                      }`}
                    >
                      {val >= 1000 ? `${val / 1000}k` : val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#eff4ff]">
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#dde9ff] text-xs font-bold text-[#45464d] hover:bg-[#eff4ff] transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#006c49] hover:bg-[#005236] text-white text-xs font-bold shadow-md transition active:scale-95"
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
