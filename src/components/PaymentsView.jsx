import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { WhatsAppIcon } from './icons/WhatsAppIcon'
import { GuardScheduleEditModal } from './GuardScheduleEditModal'
import {
  getMonthInfo,
  getHoliday,
  getWeekday,
  formatCurrencyBR,
} from '../utils/brazilianCalendar'

export function PaymentsView({ onOpenQuickHub }) {
  const {
    selectedMonth,
    setSelectedMonth,
    posts,
    guards,
    shifts,
    payments,
    defaultHourlyRate,
    setShiftHours,
    getShiftNote,
    getGuardCalculations,
    getPaymentStatus,
    togglePaymentStatus,
    batchMarkPaid,
  } = useApp()

  const activeGuards = guards.filter((g) => g.active)
  const [selectedGuardId, setSelectedGuardId] = useState(
    activeGuards[0]?.id || ''
  )
  // Selected Quinzena: 'q1' (01 a 15), 'q2' (16 ao final), or 'all' (Mês Completo)
  const [selectedQuinzena, setSelectedQuinzena] = useState('q1')
  const [toastMessage, setToastMessage] = useState('')
  const [onlyPendingFilter, setOnlyPendingFilter] = useState(false)
  const [scheduleModalGuard, setScheduleModalGuard] = useState(null)
  const [dayEditModal, setDayEditModal] = useState(null) // { guard, day, hours, note }
  const [historySearch, setHistorySearch] = useState('')
  const [historyMonthFilter, setHistoryMonthFilter] = useState('all')
  const [showHistory, setShowHistory] = useState(true)

  const [year, month] = selectedMonth.split('-').map(Number)
  const monthInfo = getMonthInfo(year, month)
  const totalDays = monthInfo.totalDays

  // Filter guards if user only wants to see who is missing payment
  const displayedGuards = onlyPendingFilter
    ? activeGuards.filter((g) => {
        const c = getGuardCalculations(g.id)
        const s1 = getPaymentStatus(g.id, 'q1')
        const s2 = getPaymentStatus(g.id, 'q2')
        if (selectedQuinzena === 'q1') return s1.status !== 'PAID' && c.q1Total > 0
        if (selectedQuinzena === 'q2') return s2.status !== 'PAID' && c.q2Total > 0
        return (s1.status !== 'PAID' && c.q1Total > 0) || (s2.status !== 'PAID' && c.q2Total > 0)
      })
    : activeGuards

  const currentGuard =
    displayedGuards.find((g) => g.id === selectedGuardId) ||
    displayedGuards[0] ||
    activeGuards.find((g) => g.id === selectedGuardId) ||
    activeGuards[0]
  const currentPost = posts.find((p) => p.id === currentGuard?.postId)

  // Global financial metrics for current month
  let q1PendingCount = 0
  let q1PendingAmount = 0
  let q1PaidAmount = 0
  let q1TotalAmount = 0

  let q2PendingCount = 0
  let q2PendingAmount = 0
  let q2PaidAmount = 0
  let q2TotalAmount = 0

  activeGuards.forEach((g) => {
    const c = getGuardCalculations(g.id)
    const s1 = getPaymentStatus(g.id, 'q1')
    const s2 = getPaymentStatus(g.id, 'q2')

    q1TotalAmount += c.q1Total
    if (s1.status === 'PAID') {
      q1PaidAmount += c.q1Total
    } else if (c.q1Total > 0) {
      q1PendingCount++
      q1PendingAmount += c.q1Total
    }

    q2TotalAmount += c.q2Total
    if (s2.status === 'PAID') {
      q2PaidAmount += c.q2Total
    } else if (c.q2Total > 0) {
      q2PendingCount++
      q2PendingAmount += c.q2Total
    }
  })

  const calc = currentGuard
    ? getGuardCalculations(currentGuard.id)
    : { q1Hours: 0, q1Total: 0, q2Hours: 0, q2Total: 0, totalHours: 0, totalAmount: 0, rate: 40 }

  const statusQ1 = currentGuard ? getPaymentStatus(currentGuard.id, 'q1') : {}
  const statusQ2 = currentGuard ? getPaymentStatus(currentGuard.id, 'q2') : {}

  const isQ1Paid = statusQ1.status === 'PAID'
  const isQ2Paid = statusQ2.status === 'PAID'

  // Dynamic context according to selected quinzena
  let activeAmount = 0
  let pendingAmountToPay = 0
  let activeHours = 0
  let isCurrentPaid = false
  let activeQuinzenaLabel = ''
  let activeShortLabel = ''
  let activeDaysRange = []

  if (selectedQuinzena === 'q1') {
    activeAmount = calc.q1Total
    pendingAmountToPay = isQ1Paid ? 0 : calc.q1Total
    activeHours = calc.q1Hours
    isCurrentPaid = isQ1Paid
    activeQuinzenaLabel = '1ª Quinzena (01 a 15)'
    activeShortLabel = '1ª Quinzena'
    activeDaysRange = monthInfo.q1Days // [1..15]
  } else if (selectedQuinzena === 'q2') {
    activeAmount = calc.q2Total
    pendingAmountToPay = isQ2Paid ? 0 : calc.q2Total
    activeHours = calc.q2Hours
    isCurrentPaid = isQ2Paid
    activeQuinzenaLabel = `2ª Quinzena (16 a ${totalDays})`
    activeShortLabel = '2ª Quinzena'
    activeDaysRange = monthInfo.q2Days // [16..totalDays]
  } else {
    // Both Quinzenas (Mês Completo)
    isCurrentPaid = isQ1Paid && isQ2Paid
    if (isQ1Paid && !isQ2Paid) {
      pendingAmountToPay = calc.q2Total
      activeAmount = calc.q2Total
      activeShortLabel = '2ª Quinzena Restante'
    } else if (!isQ1Paid && isQ2Paid) {
      pendingAmountToPay = calc.q1Total
      activeAmount = calc.q1Total
      activeShortLabel = '1ª Quinzena Restante'
    } else if (!isQ1Paid && !isQ2Paid) {
      pendingAmountToPay = calc.totalAmount
      activeAmount = calc.totalAmount
      activeShortLabel = 'Mês Completo'
    } else {
      pendingAmountToPay = 0
      activeAmount = calc.totalAmount
      activeShortLabel = 'Mês Completo (Quitado)'
    }
    activeHours = calc.totalHours
    activeQuinzenaLabel = `Mês Completo (01 a ${totalDays})`
    activeDaysRange = Array.from({ length: totalDays }, (_, i) => i + 1)
  }

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handleCopyPix = () => {
    if (!currentGuard?.pixKey) {
      showToast('Nenhuma chave PIX cadastrada para este segurança.')
      return
    }
    navigator.clipboard.writeText(currentGuard.pixKey)
    const amountToTransfer = isCurrentPaid ? calc.totalAmount : (pendingAmountToPay > 0 ? pendingAmountToPay : activeAmount)
    showToast(`Chave PIX copiada! Valor a transferir: ${formatCurrencyBR(amountToTransfer)} (${activeShortLabel})`)
  }

  // Toggle payment status for currently active quinzena
  const handleToggleActiveQuinzenaPayment = () => {
    if (!currentGuard) return
    if (selectedQuinzena === 'q1') {
      togglePaymentStatus(currentGuard.id, 'q1')
      showToast(
        !isQ1Paid
          ? `1ª Quinzena (${formatCurrencyBR(calc.q1Total)}) de ${currentGuard.name} marcada como Paga!`
          : `1ª Quinzena de ${currentGuard.name} reaberta (Pendente).`
      )
    } else if (selectedQuinzena === 'q2') {
      togglePaymentStatus(currentGuard.id, 'q2')
      showToast(
        !isQ2Paid
          ? `2ª Quinzena (${formatCurrencyBR(calc.q2Total)}) de ${currentGuard.name} marcada como Paga!`
          : `2ª Quinzena de ${currentGuard.name} reaberta (Pendente).`
      )
    } else {
      // Both
      const targetNext = !(isQ1Paid && isQ2Paid)
      if (targetNext) {
        if (!isQ1Paid) togglePaymentStatus(currentGuard.id, 'q1')
        if (!isQ2Paid) togglePaymentStatus(currentGuard.id, 'q2')
        showToast(`Mês completo de ${currentGuard.name} marcado como Pago!`)
      } else {
        if (isQ1Paid) togglePaymentStatus(currentGuard.id, 'q1')
        if (isQ2Paid) togglePaymentStatus(currentGuard.id, 'q2')
        showToast(`Pagamentos de ${currentGuard.name} reabertos (Pendentes).`)
      }
    }
  }

  // Quick batch payment trigger for quinzena
  const handleBatchPayQuinzena = (q) => {
    const pendingGuards = activeGuards.filter((g) => {
      const c = getGuardCalculations(g.id)
      const s = getPaymentStatus(g.id, q)
      return s.status !== 'PAID' && (q === 'q1' ? c.q1Total : c.q2Total) > 0
    })

    if (pendingGuards.length === 0) {
      showToast(`Todos os bicos da ${q === 'q1' ? '1ª' : '2ª'} Quinzena já estão quitados!`)
      return
    }

    if (
      window.confirm(
        `Confirmar liquidação em lote de ${pendingGuards.length} prestadores da ${
          q === 'q1' ? '1ª' : '2ª'
        } Quinzena?`
      )
    ) {
      batchMarkPaid(q, pendingGuards.map((g) => g.id))
      showToast(
        `Sucesso! ${pendingGuards.length} bicos marcados como pagos na ${
          q === 'q1' ? '1ª' : '2ª'
        } Quinzena.`
      )
    }
  }

  // Navigate between guards
  const currentGuardIndex = displayedGuards.findIndex((g) => g.id === currentGuard?.id)
  const handlePrevGuard = () => {
    if (displayedGuards.length === 0) return
    const prevIdx = (currentGuardIndex - 1 + displayedGuards.length) % displayedGuards.length
    setSelectedGuardId(displayedGuards[prevIdx].id)
  }
  const handleNextGuard = () => {
    if (displayedGuards.length === 0) return
    const nextIdx = (currentGuardIndex + 1) % displayedGuards.length
    setSelectedGuardId(displayedGuards[nextIdx].id)
  }

  // Shifts of current guard filtered to active days range
  const guardShifts = shifts[selectedMonth]?.[currentGuard?.id] || {}
  const daysWithHours = []
  activeDaysRange.forEach((d) => {
    const h = guardShifts[d]
    if (h !== undefined && h !== null && Number(h) > 0) {
      const weekday = getWeekday(year, month, d)
      const holiday = getHoliday(year, month, d)
      const note = getShiftNote ? getShiftNote(currentGuard?.id, d) : ''
      daysWithHours.push({
        day: d,
        hours: Number(h),
        amount: Number(h) * (calc.rate || defaultHourlyRate),
        weekday,
        holiday,
        note,
      })
    }
  })

  // Auditoria e Histórico Geral de Pagamentos Confirmados
  const paidCountsByMonth = {}
  const confirmedPaymentRecords = Object.entries(payments || {})
    .filter(([_, data]) => data?.status === 'PAID')
    .map(([key, data]) => {
      const [pMonth, pGuardId, pQuinzena = 'q1'] = key.split('_')
      paidCountsByMonth[pMonth] = (paidCountsByMonth[pMonth] || 0) + 1

      const guard = guards.find((g) => g.id === pGuardId)
      const post = posts.find((p) => p.id === guard?.postId)

      const guardMonthShifts = shifts[pMonth]?.[pGuardId] || {}
      const [pYear, pMNum] = (pMonth || '2026-09').split('-').map(Number)
      const pTotalDays = new Date(pYear, pMNum, 0).getDate()
      const rate = Number(guard?.hourlyRate) > 0 ? Number(guard.hourlyRate) : (Number(defaultHourlyRate) || 40)

      let pHours = 0
      const startDay = pQuinzena === 'q1' ? 1 : 16
      const endDay = pQuinzena === 'q1' ? 15 : pTotalDays
      for (let d = startDay; d <= endDay; d++) {
        const h = Number(guardMonthShifts[d])
        if (!isNaN(h) && h > 0) pHours += h
      }
      const pAmount = Math.round(pHours * rate * 100) / 100
      const pMonthInfo = getMonthInfo(pYear, pMNum)

      return {
        key,
        month: pMonth,
        monthName: pMonthInfo.formattedMonth,
        guardId: pGuardId,
        guardName: guard?.name || pGuardId,
        guardFullName: guard?.fullName || '',
        pixKey: guard?.pixKey || '',
        pixType: guard?.pixType || '',
        postName: post?.name || 'Posto Geral',
        quinzena: pQuinzena,
        quinzenaLabel: pQuinzena === 'q1' ? '1ª Quinzena (01 a 15)' : '2ª Quinzena (16 ao fim)',
        paidAt: data.paidAt,
        notes: data.notes || 'PIX Realizado',
        hours: pHours,
        amount: pAmount,
      }
    })
    .sort((a, b) => {
      if (a.paidAt && b.paidAt) return new Date(b.paidAt) - new Date(a.paidAt)
      return b.month.localeCompare(a.month)
    })

  const filteredHistory = confirmedPaymentRecords.filter((rec) => {
    const matchMonth = historyMonthFilter === 'all' || rec.month === historyMonthFilter
    const matchSearch =
      !historySearch.trim() ||
      rec.guardName.toLowerCase().includes(historySearch.toLowerCase()) ||
      rec.guardFullName.toLowerCase().includes(historySearch.toLowerCase()) ||
      rec.pixKey.toLowerCase().includes(historySearch.toLowerCase())
    return matchMonth && matchSearch
  })

  return (
    <div className="flex flex-col w-full gap-4 pb-36 max-w-[1920px] 2xl:max-w-full mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#131b2e] text-white px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2 border border-white/10">
          <span className="material-symbols-outlined text-[#6cf8bb] text-[18px]">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Cycle Month Selector & Brazilian Calendar Header */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#dde9ff] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#006c49]/10 text-[#006c49] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[26px]">
              calendar_month
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[10px] font-black uppercase tracking-wider text-[#006c49] bg-[#6cf8bb]/30 px-2 py-0.5 rounded-md border border-[#6cf8bb]/40">
                Mês de Competência
              </span>
              <h1 className="text-base font-black text-[#0d1c2f] tracking-tight">
                {monthInfo.formattedMonth}
              </h1>
            </div>
            <p className="text-xs text-[#76777d] mt-0.5">
              Folha quinzenal: 1ª Quinzena (01 a 15) • 2ª Quinzena (16 a {totalDays} de {monthInfo.monthName})
            </p>
          </div>
        </div>

        {/* Quick Month Selector Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedMonth('2026-09')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
              selectedMonth === '2026-09'
                ? 'bg-[#006c49] text-white border-[#006c49] shadow-sm'
                : 'bg-[#f8f9ff] text-[#0d1c2f] border-[#dde9ff] hover:bg-[#eff4ff]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>Setembro 2026</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
              selectedMonth === '2026-09' ? 'bg-white text-[#006c49]' : 'bg-[#6cf8bb]/40 text-[#006c49]'
            }`}>
              {paidCountsByMonth['2026-09'] || 25} Pagos
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMonth('2026-10')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
              selectedMonth === '2026-10'
                ? 'bg-[#006c49] text-white border-[#006c49] shadow-sm'
                : 'bg-[#f8f9ff] text-[#0d1c2f] border-[#dde9ff] hover:bg-[#eff4ff]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">event</span>
            <span>Outubro 2026 (Atual)</span>
            {paidCountsByMonth['2026-10'] > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                selectedMonth === '2026-10' ? 'bg-white text-[#006c49]' : 'bg-[#6cf8bb]/40 text-[#006c49]'
              }`}>
                {paidCountsByMonth['2026-10']} Pagos
              </span>
            )}
          </button>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-[#eff4ff] text-[#0d1c2f] font-bold text-xs px-3 py-2 rounded-xl border border-[#dde9ff] focus:outline-none cursor-pointer capitalize shadow-2xs"
          >
            <option value="2026-08">Agosto 2026</option>
            <option value="2026-09">Setembro 2026 (25 Pagos)</option>
            <option value="2026-10">Outubro 2026 (Mês Atual)</option>
            <option value="2026-11">Novembro 2026</option>
            <option value="2026-12">Dezembro 2026</option>
          </select>
        </div>
      </div>

      {/* Informativo de Conferência de Pagamentos */}
      {selectedMonth === '2026-10' && (paidCountsByMonth['2026-09'] || 25) > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-start gap-3">
          <span className="material-symbols-outlined text-blue-700 text-[20px] shrink-0 mt-0.5">info</span>
          <div className="text-xs text-blue-900 leading-relaxed">
            <strong>Aviso de Competência:</strong> Os pagamentos efetuados recentemente para o fechamento de setembro estão salvos na competência <strong>Setembro 2026</strong> ({paidCountsByMonth['2026-09'] || 25} prestadores confirmados). Clique no botão <strong>[Setembro 2026]</strong> acima para ver a folha quitada ou confira o <strong>Histórico de Auditoria</strong> abaixo.
          </div>
        </div>
      )}

      {/* ALERTA DE FALTAS DE PAGAMENTO */}
      {(selectedQuinzena === 'q1' ? q1PendingCount : selectedQuinzena === 'q2' ? q2PendingCount : q1PendingCount + q2PendingCount) > 0 ? (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-400 rounded-2xl p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shrink-0 shadow-2xs">
              <span className="material-symbols-outlined text-[22px]">notification_important</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-white">
                  Alerta: Faltas de Pagamento
                </span>
                <span className="text-xs font-black text-[#78350f]">
                  {(selectedQuinzena === 'q1' ? q1PendingCount : selectedQuinzena === 'q2' ? q2PendingCount : q1PendingCount + q2PendingCount)} {((selectedQuinzena === 'q1' ? q1PendingCount : selectedQuinzena === 'q2' ? q2PendingCount : q1PendingCount + q2PendingCount) === 1 ? 'prestador aguarda pagamento' : 'prestadores aguardam pagamento')}
                </span>
              </div>
              <p className="text-[11px] text-[#92400e] font-medium mt-0.5">
                Total pendente: <strong>R$ {(selectedQuinzena === 'q1' ? q1PendingAmount : selectedQuinzena === 'q2' ? q2PendingAmount : q1PendingAmount + q2PendingAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> ({activeShortLabel} • {monthInfo.formattedMonth})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOnlyPendingFilter(!onlyPendingFilter)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 shadow-xs cursor-pointer active:scale-95 ${
              onlyPendingFilter
                ? 'bg-amber-700 text-white ring-2 ring-amber-400'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {onlyPendingFilter ? 'visibility_off' : 'filter_alt'}
            </span>
            <span>{onlyPendingFilter ? 'Mostrar Todos' : 'Ver Apenas Faltas'}</span>
          </button>
        </div>
      ) : (
        <div className="bg-[#6cf8bb]/15 border border-[#6cf8bb]/40 rounded-2xl p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00714d] text-[20px]">check_circle</span>
            <span className="text-xs font-bold text-[#00714d]">
              Todos os pagamentos da {activeShortLabel} estão 100% quitados!
            </span>
          </div>
          <span className="font-mono text-[10px] font-black text-[#00714d] bg-[#6cf8bb]/30 px-2 py-0.5 rounded-full">
            Tudo Pago
          </span>
        </div>
      )}

      {/* PRIMARY QUINZENA SELECTOR TABS (1 a 15 vs 16 ao final) */}
      <div className="bg-[#131b2e] text-white rounded-2xl p-2.5 shadow-sm border border-white/10 flex flex-col gap-2">
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#6cf8bb] animate-pulse"></span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-white font-black flex items-center gap-1.5 flex-wrap">
              <span>Folha de {monthInfo.formattedMonth}</span>
              <span className="text-[#6cf8bb] font-bold">•</span>
              <span className="text-[#6cf8bb]">{activeShortLabel}</span>
            </span>
          </div>
          <button
            onClick={() => onOpenQuickHub?.('pagamento')}
            className="flex items-center gap-1 text-[10px] font-bold text-[#6cf8bb] hover:underline"
          >
            <span className="material-symbols-outlined text-[14px]">bolt</span>
            <span>Liquidar Lote</span>
          </button>
        </div>

        {/* 3-Way Quinzena Segmented Switcher */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10">
          {/* Tab 1: 1ª Quinzena (01 a 15) */}
          <button
            type="button"
            onClick={() => setSelectedQuinzena('q1')}
            className={`py-2 px-1.5 rounded-lg flex flex-col items-center justify-center transition-all ${
              selectedQuinzena === 'q1'
                ? 'bg-[#006c49] text-white shadow-md font-bold'
                : 'bg-white/5 text-[#bec6e0] hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="text-xs font-bold leading-tight">1ª Quinzena</span>
            <span className="font-mono text-[10px] opacity-80">Dias 01 a 15</span>
            {currentGuard && (
              <span
                className={`mt-1 font-mono text-[10px] px-2 py-0.5 rounded-full font-black flex items-center gap-0.5 ${
                  isQ1Paid
                    ? 'bg-[#6cf8bb] text-[#002113] shadow-xs'
                    : 'bg-white/20 text-[#6cf8bb]'
                }`}
              >
                {isQ1Paid ? '✓ PAGO' : `R$ ${calc.q1Total.toFixed(0)}`}
              </span>
            )}
          </button>

          {/* Tab 2: 2ª Quinzena (16 ao final) */}
          <button
            type="button"
            onClick={() => setSelectedQuinzena('q2')}
            className={`py-2 px-1.5 rounded-lg flex flex-col items-center justify-center transition-all ${
              selectedQuinzena === 'q2'
                ? 'bg-[#006c49] text-white shadow-md font-bold'
                : 'bg-white/5 text-[#bec6e0] hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="text-xs font-bold leading-tight">2ª Quinzena</span>
            <span className="font-mono text-[10px] opacity-80">Dias 16 a {totalDays}</span>
            {currentGuard && (
              <span
                className={`mt-1 font-mono text-[10px] px-2 py-0.5 rounded-full font-black flex items-center gap-0.5 ${
                  isQ2Paid
                    ? 'bg-[#6cf8bb] text-[#002113] shadow-xs'
                    : 'bg-white/20 text-[#6cf8bb]'
                }`}
              >
                {isQ2Paid ? '✓ PAGO' : `R$ ${calc.q2Total.toFixed(0)}`}
              </span>
            )}
          </button>

          {/* Tab 3: Mês Completo (Consolidado) */}
          <button
            type="button"
            onClick={() => setSelectedQuinzena('all')}
            className={`py-2 px-1.5 rounded-lg flex flex-col items-center justify-center transition-all ${
              selectedQuinzena === 'all'
                ? 'bg-[#006c49] text-white shadow-md font-bold'
                : 'bg-white/5 text-[#bec6e0] hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="text-xs font-bold leading-tight">Mês Todo</span>
            <span className="font-mono text-[10px] opacity-80">01 a {totalDays}</span>
            {currentGuard && (
              <span
                className={`mt-1 font-mono text-[10px] px-2 py-0.5 rounded-full font-black flex items-center gap-0.5 ${
                  isQ1Paid && isQ2Paid
                    ? 'bg-[#6cf8bb] text-[#002113] shadow-xs'
                    : 'bg-white/20 text-[#6cf8bb]'
                }`}
              >
                {isQ1Paid && isQ2Paid ? '✓ PAGO' : `R$ ${calc.totalAmount.toFixed(0)}`}
              </span>
            )}
          </button>
        </div>

        {/* Global Financial Summary Strip Differentiating Paid vs To Pay */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#bec6e0] font-bold">1ª Q (01 a 15)</span>
              {q1PendingCount > 0 ? (
                <button
                  type="button"
                  onClick={() => handleBatchPayQuinzena('q1')}
                  className="py-0.5 px-2 text-[9px] font-bold bg-[#006c49] hover:bg-[#005236] text-white rounded-md transition active:scale-95 shadow-2xs"
                >
                  Quitar ({q1PendingCount})
                </button>
              ) : (
                <span className="text-[9px] text-[#6cf8bb] font-mono font-black flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[11px]">check</span>
                  Quitada
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#6cf8bb] font-bold" title="Já Pago">
                ✓ R$ {q1PaidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </span>
              <span className="text-[#ffddb8] font-bold" title="Ainda a Pagar">
                ⏳ R$ {q1PendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-2.5 border border-white/5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#bec6e0] font-bold">2ª Q (16 a {totalDays})</span>
              {q2PendingCount > 0 ? (
                <button
                  type="button"
                  onClick={() => handleBatchPayQuinzena('q2')}
                  className="py-0.5 px-2 text-[9px] font-bold bg-[#006c49] hover:bg-[#005236] text-white rounded-md transition active:scale-95 shadow-2xs"
                >
                  Quitar ({q2PendingCount})
                </button>
              ) : (
                <span className="text-[9px] text-[#6cf8bb] font-mono font-black flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[11px]">check</span>
                  Quitada
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#6cf8bb] font-bold" title="Já Pago">
                ✓ R$ {q2PaidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </span>
              <span className="text-[#ffddb8] font-bold" title="Ainda a Pagar">
                ⏳ R$ {q2PendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Select Collaborator Strip with Prev / Next Arrow controls */}
      <div className="bg-white rounded-2xl p-3 shadow-xs border border-[#dde9ff] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handlePrevGuard}
            className="w-8 h-8 rounded-xl bg-[#eff4ff] hover:bg-[#dde9ff] text-[#0d1c2f] flex items-center justify-center transition active:scale-90"
            title="Prestador Anterior"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <span className="text-xs font-semibold text-[#45464d] hidden sm:inline">Colaborador:</span>
        </div>

        <select
          value={selectedGuardId}
          onChange={(e) => setSelectedGuardId(e.target.value)}
          className="bg-[#eff4ff] text-[#0d1c2f] font-bold text-xs px-3 py-1.5 rounded-xl border border-[#dde9ff] focus:outline-none cursor-pointer flex-1 truncate"
        >
          {displayedGuards.length === 0 ? (
            <option value="">Nenhum prestador pendente nesta quinzena</option>
          ) : (
            displayedGuards.map((g) => {
              const c = getGuardCalculations(g.id)
              const s1 = getPaymentStatus(g.id, 'q1')
              const s2 = getPaymentStatus(g.id, 'q2')
              const gAmount =
                selectedQuinzena === 'q1'
                  ? c.q1Total
                  : selectedQuinzena === 'q2'
                  ? c.q2Total
                  : c.totalAmount
              const isPaid =
                selectedQuinzena === 'q1'
                  ? s1.status === 'PAID'
                  : selectedQuinzena === 'q2'
                  ? s2.status === 'PAID'
                  : s1.status === 'PAID' && s2.status === 'PAID'

              return (
                <option key={g.id} value={g.id}>
                  {isPaid ? '✓ [PAGO' : '⏳ [A PAGAR'} • {monthInfo.monthName.slice(0, 3).toUpperCase()}/{monthInfo.year}] {g.name} — {formatCurrencyBR(gAmount)}
                </option>
              )
            })
          )}
        </select>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleNextGuard}
            className="w-8 h-8 rounded-xl bg-[#eff4ff] hover:bg-[#dde9ff] text-[#0d1c2f] flex items-center justify-center transition active:scale-90"
            title="Próximo Prestador"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
          {currentGuard?.pixKey && (
            <button
              onClick={handleCopyPix}
              className="p-1.5 rounded-xl bg-[#6cf8bb]/30 hover:bg-[#6cf8bb]/50 text-[#006c49] transition active:scale-90"
              title="Copiar PIX agora"
            >
              <span className="material-symbols-outlined text-[18px]">content_copy</span>
            </button>
          )}
        </div>
      </div>

      {currentGuard && (
        <>
          {/* Worker Profile & Banking Data */}
          <section className="bg-white rounded-2xl p-4 shadow-xs border border-[#dde9ff] flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-full bg-[#dde9ff] flex items-center justify-center text-[#0d1c2f] font-bold text-base shadow-xs shrink-0">
                  {currentGuard.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm font-bold text-[#0d1c2f] truncate">
                      {currentGuard.fullName || currentGuard.name}
                    </h2>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#eff4ff] text-[#45464d] font-semibold">
                      ({currentGuard.name})
                    </span>
                  </div>
                  <p className="text-xs text-[#76777d] flex items-center gap-1 mt-0.5 truncate">
                    <span className="material-symbols-outlined text-[15px] text-[#76777d]">
                      security
                    </span>
                    <span>Posto {currentPost?.name || 'Geral'}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-xs transition-all ${
                    isCurrentPaid
                      ? 'bg-[#006c49] text-white border-2 border-[#6cf8bb]'
                      : 'bg-[#ffddb8] text-[#78350f] border border-[#ffb95f]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] font-black">
                    {isCurrentPaid ? 'check_circle' : 'pending'}
                  </span>
                  <span>{isCurrentPaid ? '✓ PAGO' : 'A PAGAR'}</span>
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#eff4ff] text-[#006c49] font-bold border border-[#dde9ff]">
                  Ref: {monthInfo.formattedMonth}
                </span>
                <button
                  type="button"
                  onClick={() => setScheduleModalGuard(currentGuard)}
                  className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#eff4ff] hover:bg-[#dde9ff] text-[#006c49] border border-[#dde9ff] text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
                  title="Editar escala, horas extras e valores deste prestador"
                >
                  <span className="material-symbols-outlined text-[15px]">edit_calendar</span>
                  <span>Editar Escala</span>
                </button>
              </div>
            </div>

            {/* Bank Details Chip Grid */}
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#eff4ff] text-[#0d1c2f] border border-[#dde9ff]/60">
              <div className="flex flex-col">
                <span className="font-mono text-[10px] text-[#76777d] uppercase tracking-wider font-semibold">
                  Chave PIX ({currentGuard.pixType || 'CPF'})
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-mono text-xs font-bold tracking-tight text-[#0d1c2f] truncate">
                    {currentGuard.pixKey || 'Não cadastrado'}
                  </span>
                  {currentGuard.pixKey && (
                    <button
                      onClick={handleCopyPix}
                      className="text-[#45464d] hover:text-[#0d1c2f] transition-transform active:scale-90"
                      title="Copiar chave"
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        content_copy
                      </span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col">
                <span className="font-mono text-[10px] text-[#76777d] uppercase tracking-wider font-semibold">
                  Contato
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <WhatsAppIcon className="w-3.5 h-3.5 fill-[#25D366] shrink-0" />
                  <span className="text-xs font-semibold text-[#0d1c2f]">
                    {currentGuard.phone || 'Sem WhatsApp'}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* FINANCIAL SUMMARY HERO CARD — CENTERED ON QUINZENA CALCULATION */}
          <section className="bg-[#131b2e] text-white rounded-2xl p-5 shadow-md flex flex-col gap-3 relative overflow-hidden border border-white/10">
            <div className="flex flex-col gap-2 z-10">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg bg-[#6cf8bb]/20 text-[#6cf8bb] border border-[#6cf8bb]/40 font-mono text-xs font-black uppercase flex items-center gap-1.5 shadow-xs">
                    <span className="material-symbols-outlined text-[15px]">calendar_month</span>
                    <span>MÊS DE REFERÊNCIA: {monthInfo.formattedMonth.toUpperCase()}</span>
                  </span>
                  <span className="text-white/60 font-mono text-xs font-bold">
                    • {activeQuinzenaLabel}
                  </span>
                </div>
                <span
                  className={`font-mono text-[11px] px-2.5 py-1 rounded-full font-black flex items-center gap-1.5 shadow-xs ${
                    isCurrentPaid
                      ? 'bg-[#006c49] text-white border-2 border-[#6cf8bb]'
                      : 'bg-[#ffddb8] text-[#2a1700]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px] font-black">
                    {isCurrentPaid ? 'check_circle' : 'pending'}
                  </span>
                  <span>{isCurrentPaid ? '✓ PAGO / LIQUIDADO' : 'A PAGAR'}</span>
                </span>
              </div>

              {/* Main Quinzena Calculation Hero Number with differentiation */}
              <div className="flex flex-col mt-1">
                <span className={`text-[10px] font-mono uppercase font-bold flex items-center gap-1 ${isCurrentPaid ? 'text-[#6cf8bb]' : 'text-[#ffddb8]'}`}>
                  <span className="material-symbols-outlined text-[13px]">
                    {isCurrentPaid ? 'check_circle' : 'schedule'}
                  </span>
                  {isCurrentPaid
                    ? `Valor Quitado (Já Pago) • Folha de ${monthInfo.formattedMonth}`
                    : `Valor em Aberto (Ainda a Pagar) • Folha de ${monthInfo.formattedMonth}`}
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className={`font-mono text-xs font-bold ${isCurrentPaid ? 'text-[#6ffbbe]' : 'text-[#ffddb8]'}`}>R$</span>
                  <span className={`font-mono text-3xl tracking-tight font-black ${isCurrentPaid ? 'text-[#6ffbbe]' : 'text-[#ffddb8]'}`}>
                    {activeAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Big High-Visibility Paid Banner */}
              {isCurrentPaid && (
                <div className="mt-2 flex items-center gap-3 p-3.5 bg-gradient-to-r from-[#006c49] to-[#005236] text-white rounded-xl border-2 border-[#6cf8bb] shadow-lg animate-in fade-in zoom-in-95">
                  <div className="w-10 h-10 rounded-full bg-[#6cf8bb] text-[#002113] flex items-center justify-center shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-[26px] font-black">
                      check
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black tracking-wider text-[#6cf8bb] uppercase">
                        ✓ PAGAMENTO CONFIRMADO
                      </span>
                      <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded font-mono font-bold">
                        {activeShortLabel}
                      </span>
                      <span className="text-[10px] bg-[#6cf8bb] text-[#002113] px-2 py-0.5 rounded font-mono font-black uppercase shadow-2xs">
                        📅 {monthInfo.formattedMonth.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs text-white/95 font-medium mt-0.5">
                      Valor de {formatCurrencyBR(activeAmount)} quitado com sucesso para este colaborador referente à folha de <strong className="text-[#6cf8bb] font-black underline">{monthInfo.formattedMonth}</strong> ({activeShortLabel}).
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Metrics Strip for this Quinzena */}
            <div className="grid grid-cols-3 gap-2 pt-1 bg-white/10 rounded-xl p-2.5 z-10">
              <div className="flex flex-col">
                <span className="text-[10px] text-[#bec6e0]">Carga Horária</span>
                <span className="font-mono text-xs font-bold text-white mt-0.5">
                  {activeHours} horas
                </span>
              </div>

              <div className="flex flex-col border-x border-white/10 px-2">
                <span className="text-[10px] text-[#bec6e0]">Valor da Hora</span>
                <span className="font-mono text-xs font-bold text-white mt-0.5">
                  R$ {(calc.rate || defaultHourlyRate).toFixed(2).replace('.', ',')}
                </span>
              </div>

              <div className="flex flex-col text-right">
                <span className="text-[10px] text-[#bec6e0]">Diárias Ativas</span>
                <span className="font-mono text-xs font-bold text-[#6cf8bb] mt-0.5">
                  {daysWithHours.length} plantões
                </span>
              </div>
            </div>

            {/* Quinzena Action & Status Row */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 z-10">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
                    isCurrentPaid ? 'bg-[#006c49] text-[#6cf8bb] border border-[#6cf8bb]' : 'bg-white/20 text-[#bec6e0]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] font-black">
                    {isCurrentPaid ? 'check' : 'schedule'}
                  </span>
                </div>
                <span className="text-xs font-medium text-[#bec6e0]">
                  Status:{' '}
                  <strong className={isCurrentPaid ? 'text-[#6cf8bb] font-black' : 'text-white'}>
                    {isCurrentPaid ? '✓ PAGO / LIQUIDADO' : 'Aberto para Pagamento'}
                  </strong>
                </span>
              </div>

              <button
                type="button"
                onClick={handleToggleActiveQuinzenaPayment}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition shadow-xs flex items-center gap-1.5 active:scale-95 ${
                  isCurrentPaid
                    ? 'bg-[#006c49] text-white border border-[#6cf8bb] hover:bg-[#005236]'
                    : 'bg-[#6cf8bb] hover:bg-[#57e4a8] text-[#002113]'
                }`}
                title={isCurrentPaid ? 'Pagamento marcado como PAGO. Clique para retirar o pagamento e reabrir.' : 'Clique para pagar'}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isCurrentPaid ? 'check_circle' : 'payments'}
                </span>
                <span>{isCurrentPaid ? '✓ PAGO (Clique p/ Desfazer)' : `Pagar (${activeShortLabel})`}</span>
              </button>
            </div>

            {/* Quinzena Subtotals Comparison (Quick glance at both) */}
            {selectedQuinzena === 'all' && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 z-10">
                <div className="bg-white/5 rounded-xl p-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#bec6e0] block">1ª Quinzena (01-15)</span>
                    <span className="font-mono text-xs font-bold text-white">
                      {formatCurrencyBR(calc.q1Total)} ({calc.q1Hours}h)
                    </span>
                  </div>
                  <button
                    onClick={() => togglePaymentStatus(currentGuard.id, 'q1')}
                    className={`text-[9px] font-mono font-bold px-2 py-1 rounded transition ${
                      isQ1Paid ? 'bg-[#006c49] text-white' : 'bg-[#ffddb8] text-[#2a1700]'
                    }`}
                  >
                    {isQ1Paid ? 'Pago' : 'Pagar'}
                  </button>
                </div>

                <div className="bg-white/5 rounded-xl p-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#bec6e0] block">2ª Quinzena (16-{totalDays})</span>
                    <span className="font-mono text-xs font-bold text-white">
                      {formatCurrencyBR(calc.q2Total)} ({calc.q2Hours}h)
                    </span>
                  </div>
                  <button
                    onClick={() => togglePaymentStatus(currentGuard.id, 'q2')}
                    className={`text-[9px] font-mono font-bold px-2 py-1 rounded transition ${
                      isQ2Paid ? 'bg-[#006c49] text-white' : 'bg-[#ffddb8] text-[#2a1700]'
                    }`}
                  >
                    {isQ2Paid ? 'Pago' : 'Pagar'}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Internal Control Note (No employment relationship / receipts) */}
          <section className="bg-white rounded-2xl p-3.5 flex items-center justify-between shadow-xs border border-[#dde9ff]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#006c49]/10 flex items-center justify-center text-[#006c49] shrink-0">
                <span className="material-symbols-outlined text-[20px]">security</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#0d1c2f]">
                  Controle Operacional Interno por Quinzena
                </span>
                <span className="text-[11px] text-[#76777d]">
                  Sem emissão de recibos pelo app • Comprovante enviado diretamente pelo app do banco (PIX)
                </span>
              </div>
            </div>
            <span className="font-mono text-[10px] text-[#006c49] font-bold bg-[#6cf8bb]/20 px-2 py-0.5 rounded-full shrink-0">
              Uso Interno
            </span>
          </section>

          {/* TIMELINE / DAILY LOG TABLE ACCORDING TO BRAZILIAN NATIONAL CALENDAR */}
          <section className="bg-white rounded-2xl p-4 shadow-xs border border-[#dde9ff] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px] text-[#0d1c2f]">
                  event_available
                </span>
                <div>
                  <h3 className="text-xs font-bold text-[#0d1c2f]">
                    Diárias da {activeShortLabel} • {monthInfo.formattedMonth}
                  </h3>
                  <p className="text-[10px] text-[#76777d]">
                    Calendário Oficial Brasileiro • Feriados Nacionais & Dias da Semana
                  </p>
                </div>
              </div>
              <span className="font-mono text-[10px] text-[#006c49] font-bold bg-[#eff4ff] px-2 py-0.5 rounded-full border border-[#dde9ff]">
                {daysWithHours.length} diárias ({activeHours}h)
              </span>
            </div>

            {/* Daily Shift Records List */}
            <div className="flex flex-col divide-y divide-[#eff4ff]">
              {daysWithHours.map((item) => {
                const isOvertime = item.hours > (currentGuard.defaultShiftHours || 3)
                const isWeekend = item.weekday.isWeekend
                const hasHoliday = item.holiday && item.holiday.isHoliday

                return (
                  <div
                    key={item.day}
                    className="flex items-center justify-between py-2.5 text-xs hover:bg-[#f8f9ff] px-1 rounded-xl transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Day & Weekday Box */}
                      <div
                        className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 font-mono transition ${
                          hasHoliday
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 font-black'
                            : isWeekend
                            ? 'bg-[#fcfaff] text-[#45464d] border border-[#dde9ff]'
                            : 'bg-[#eff4ff] text-[#0d1c2f] font-bold border border-[#dde9ff]'
                        }`}
                      >
                        <span className="text-xs font-bold leading-none">
                          {String(item.day).padStart(2, '0')}
                        </span>
                        <span className="text-[9px] uppercase leading-none mt-0.5 font-sans font-bold">
                          {item.weekday.short}
                        </span>
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-[#0d1c2f]">
                            Plantão Operacional • {item.weekday.full}
                          </span>

                          {/* Brazilian National Holiday Badge */}
                          {hasHoliday && (
                            <span
                              className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 border border-amber-300"
                              title={`Feriado Nacional Oficial: ${item.holiday.name}`}
                            >
                              <span>🇧🇷</span>
                              <span className="truncate max-w-[140px]">{item.holiday.name}</span>
                            </span>
                          )}

                          {isOvertime && (
                            <span className="text-[9px] bg-[#ffddb8] text-[#78350f] font-black px-1.5 py-0.2 rounded-full">
                              ★ Hora Extra (+{item.hours - (currentGuard.defaultShiftHours || 3)}h)
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-[#76777d] mt-0.5">
                          Posto: {currentPost?.name || 'Geral'} • {item.hours} horas cumpridas
                        </span>
                        {item.note && (
                          <span className="text-[10px] text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-md font-mono mt-1 inline-block w-fit">
                            💬 {item.note}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pl-2">
                      {/* Stepper to adjust extra hours directly on this screen before paying */}
                      <div className="flex items-center bg-[#eff4ff] border border-[#dde9ff] rounded-xl p-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => {
                            const newH = Math.max(0, item.hours - 1)
                            setShiftHours(currentGuard.id, item.day, newH)
                          }}
                          className="w-6 h-6 rounded-lg bg-white hover:bg-[#dde9ff] text-[#0d1c2f] font-black text-xs flex items-center justify-center transition active:scale-95 shadow-2xs cursor-pointer"
                          title="Diminuir 1 hora (-1h)"
                        >
                          -
                        </button>

                        <span
                          className={`w-7 text-center font-mono text-xs font-black ${
                            isOvertime ? 'text-amber-800' : 'text-[#006c49]'
                          }`}
                        >
                          {item.hours}h
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            const newH = item.hours + 1
                            setShiftHours(currentGuard.id, item.day, newH)
                          }}
                          className="w-6 h-6 rounded-lg bg-[#006c49] hover:bg-[#005236] text-white font-black text-xs flex items-center justify-center transition active:scale-95 shadow-2xs cursor-pointer"
                          title="Adicionar 1 hora extra (+1h)"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex flex-col items-end min-w-[70px]">
                        <span className="font-mono text-xs font-black text-[#006c49]">
                          {formatCurrencyBR(item.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setDayEditModal({
                              guard: currentGuard,
                              day: item.day,
                              hours: item.hours,
                              note: item.note || '',
                            })
                          }
                          className="text-[10px] text-[#006c49] hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                          title="Ajustar horas exatas ou adicionar motivo de hora extra"
                        >
                          <span>Ajustar</span>
                          <span className="material-symbols-outlined text-[12px]">edit</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}

              {daysWithHours.length === 0 && (
                <div className="py-6 flex flex-col items-center justify-center text-center">
                  <span className="material-symbols-outlined text-[28px] text-[#bec6e0] mb-1">
                    event_busy
                  </span>
                  <p className="text-xs text-[#76777d] font-medium">
                    Nenhum plantão registrado para este colaborador na {activeShortLabel}.
                  </p>
                  <p className="text-[10px] text-[#76777d] mt-0.5">
                    Alterne para a outra quinzena ou lance plantões na aba Planilha / Vários Dias.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Sticky Bottom Actions Dock (Pure Pagar with Checkbox) */}
          <section className="fixed bottom-16 md:bottom-4 left-0 w-full px-4 z-30">
            <div className="max-w-[1920px] 2xl:max-w-full mx-auto flex flex-col gap-1.5 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-[#dde9ff]">
              {/* Ultra-clear Month Competência Label above the button */}
              <div className="flex items-center justify-between px-1 text-[11px] font-mono">
                <span className="flex items-center gap-1 text-[#006c49] font-black uppercase">
                  <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                  <span>Mês de Competência: <strong className="underline">{monthInfo.formattedMonth}</strong></span>
                </span>
                <span className="text-[#45464d] font-bold">
                  {activeShortLabel}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Primary Pure "Pagar" / "✓ Pago" Action Button */}
                <button
                  type="button"
                  onClick={handleToggleActiveQuinzenaPayment}
                  className={`flex-1 h-12 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all border ${
                    isCurrentPaid
                      ? 'bg-[#006c49] text-white border-2 border-[#6cf8bb] hover:bg-[#005236]'
                      : 'bg-[#006c49] hover:bg-[#005236] text-white border border-[#006c49]'
                  }`}
                  title={isCurrentPaid ? `Pagamento marcado como PAGO. Clique para retirar o pagamento e reabrir.` : `Clique para pagar ${activeShortLabel} de ${monthInfo.formattedMonth}`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {isCurrentPaid ? 'check_circle' : 'payments'}
                  </span>
                  <span>
                    {isCurrentPaid
                      ? `✓ PAGO • ${formatCurrencyBR(activeAmount)} (Clique p/ Desfazer)`
                      : `Pagar ${activeShortLabel} • ${formatCurrencyBR(activeAmount)}`}
                  </span>
                </button>

                {currentGuard?.pixKey && (
                  <button
                    type="button"
                    onClick={handleCopyPix}
                    className="w-12 h-12 rounded-xl bg-[#eff4ff] hover:bg-[#dde9ff] text-[#0d1c2f] flex flex-col items-center justify-center transition border border-[#dde9ff] shrink-0"
                    title="Copiar Chave PIX"
                  >
                    <span className="material-symbols-outlined text-[18px]">content_copy</span>
                    <span className="text-[9px] font-bold">PIX</span>
                  </button>
                )}
              </div>
            </div>
          </section>
        </>
      )}

      {/* HISTÓRICO GERAL DE PAGAMENTOS CONFIRMADOS (AUDITORIA DO GERENTE) */}
      <section className="bg-white rounded-3xl p-5 shadow-xs border border-[#dde9ff] flex flex-col gap-4 mt-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#eff4ff] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#006c49] text-white flex items-center justify-center font-black shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[24px]">verified</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-[#0d1c2f]">
                  Histórico Geral de Pagamentos Confirmados
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#006c49] font-mono text-xs font-bold border border-emerald-200">
                  {confirmedPaymentRecords.length} Pagamentos Registrados
                </span>
              </div>
              <p className="text-xs text-[#76777d] mt-0.5">
                Auditoria completa: consulte quando cada pagamento foi feito, chave PIX utilizada e mês de competência correspondente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative min-w-[200px]">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-[#76777d]">
                search
              </span>
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Buscar prestador..."
                className="w-full text-xs pl-9 pr-3 py-2 bg-[#f8f9ff] border border-[#dde9ff] rounded-xl outline-none focus:ring-1 focus:ring-[#006c49]"
              />
            </div>

            {/* Filter by Month */}
            <select
              value={historyMonthFilter}
              onChange={(e) => setHistoryMonthFilter(e.target.value)}
              className="text-xs font-bold px-3 py-2 bg-[#f8f9ff] border border-[#dde9ff] rounded-xl text-[#0d1c2f] outline-none cursor-pointer"
            >
              <option value="all">Todos os Meses</option>
              <option value="2026-09">Setembro 2026</option>
              <option value="2026-10">Outubro 2026</option>
              <option value="2026-11">Novembro 2026</option>
            </select>

            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-[#eff4ff] text-[#0d1c2f] hover:bg-[#dde9ff] transition cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">
                {showHistory ? 'expand_less' : 'expand_more'}
              </span>
              <span>{showHistory ? 'Recolher' : 'Expandir'}</span>
            </button>
          </div>
        </div>

        {showHistory && (
          <>
            {filteredHistory.length === 0 ? (
              <div className="py-8 text-center text-[#76777d] flex flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[36px] text-[#bec6e0]">
                  receipt_long
                </span>
                <p className="text-sm font-semibold">Nenhum pagamento encontrado com os filtros selecionados.</p>
                <p className="text-xs">Selecione "Todos os Meses" ou limpe a busca para visualizar os registros.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[#dde9ff]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#eff4ff] text-[#0d1c2f] border-b border-[#dde9ff]">
                      <th className="py-3 px-3.5 font-black">Data / Horário</th>
                      <th className="py-3 px-3.5 font-black">Prestador</th>
                      <th className="py-3 px-3.5 font-black">Competência</th>
                      <th className="py-3 px-3.5 font-black">Quinzena</th>
                      <th className="py-3 px-3.5 font-black">Horas</th>
                      <th className="py-3 px-3.5 font-black">Valor Quitado</th>
                      <th className="py-3 px-3.5 font-black">Chave PIX</th>
                      <th className="py-3 px-3.5 font-black">Status</th>
                      <th className="py-3 px-3.5 font-black text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eff4ff] bg-white">
                    {filteredHistory.map((rec) => {
                      let dateStr = 'Gravado na Nuvem'
                      if (rec.paidAt) {
                        try {
                          const d = new Date(rec.paidAt)
                          if (!isNaN(d.getTime())) {
                            dateStr = d.toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          }
                        } catch {}
                      }

                      return (
                        <tr key={rec.key} className="hover:bg-[#f8f9ff] transition-colors">
                          <td className="py-3 px-3.5 font-mono text-[11px] text-[#45464d] whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[15px] text-emerald-600">
                                event_available
                              </span>
                              <span>{dateStr}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3.5 font-bold text-[#0d1c2f]">
                            <div>
                              <span>{rec.guardName}</span>
                              <div className="text-[10px] text-[#76777d] font-normal">{rec.postName}</div>
                            </div>
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded-md bg-[#eff4ff] text-[#006c49] border border-[#dde9ff]">
                              {rec.monthName}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap text-[#45464d] font-semibold">
                            {rec.quinzena === 'q1' ? '1ª Quinzena (01 a 15)' : '2ª Quinzena (16 ao fim)'}
                          </td>
                          <td className="py-3 px-3.5 font-mono font-bold text-[#0d1c2f]">
                            {rec.hours > 0 ? `${rec.hours}h` : '—'}
                          </td>
                          <td className="py-3 px-3.5 font-mono font-black text-emerald-700 whitespace-nowrap">
                            {rec.amount > 0 ? formatCurrencyBR(rec.amount) : 'Quitado'}
                          </td>
                          <td className="py-3 px-3.5 font-mono text-[11px] text-[#45464d]">
                            {rec.pixKey ? (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(rec.pixKey)
                                  showToast(`Chave PIX de ${rec.guardName} copiada!`)
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#eff4ff] hover:bg-[#dde9ff] text-[#0d1c2f] transition cursor-pointer"
                                title="Copiar PIX"
                              >
                                <span className="material-symbols-outlined text-[13px]">content_copy</span>
                                <span className="truncate max-w-[120px]">{rec.pixKey}</span>
                              </button>
                            ) : (
                              <span className="text-[#bec6e0] italic">Sem PIX</span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <span className="material-symbols-outlined text-[13px]">check_circle</span>
                              PAGO
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {rec.month !== selectedMonth && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedMonth(rec.month)}
                                  className="px-2 py-1 rounded-lg bg-[#eff4ff] hover:bg-[#dde9ff] text-[#0d1c2f] font-bold text-[10px] transition cursor-pointer"
                                  title="Ver folha desta competência"
                                >
                                  Ver Folha
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Deseja reabrir e marcar como PENDENTE a ${rec.quinzena === 'q1' ? '1ª' : '2ª'} Quinzena de ${rec.guardName} (${rec.monthName})?`)) {
                                    togglePaymentStatus(rec.guardId, rec.quinzena, rec.month)
                                    showToast(`Pagamento de ${rec.guardName} reaberto (Pendente).`)
                                  }
                                }}
                                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] transition cursor-pointer border border-rose-200"
                                title="Desfazer marcação de pago"
                              >
                                Reabrir
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>

      {/* Modal de Ajuste Rápido de Horas / Hora Extra do Dia */}
      {dayEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 space-y-4 shadow-2xl border border-[#dde9ff]">
            <div className="flex items-center justify-between border-b border-[#eff4ff] pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center font-black">
                  <span className="material-symbols-outlined text-[18px]">more_time</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0d1c2f]">
                    Ajustar Dia {dayEditModal.day}
                  </h4>
                  <span className="text-[11px] text-[#76777d]">
                    {dayEditModal.guard.name}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDayEditModal(null)}
                className="w-7 h-7 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#45464d] hover:bg-[#dde9ff]"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#0d1c2f] block mb-1">
                  Horas Trabalhadas:
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDayEditModal({ ...dayEditModal, hours: Math.max(0, dayEditModal.hours - 1) })}
                    className="w-10 h-10 rounded-xl bg-[#eff4ff] text-[#0d1c2f] font-bold text-lg flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={dayEditModal.hours}
                    onChange={(e) => setDayEditModal({ ...dayEditModal, hours: Math.max(0, Number(e.target.value) || 0) })}
                    className="flex-1 h-10 bg-white border border-[#dde9ff] rounded-xl text-center font-mono font-bold text-base outline-none focus:ring-1 focus:ring-[#006c49]"
                  />
                  <button
                    type="button"
                    onClick={() => setDayEditModal({ ...dayEditModal, hours: dayEditModal.hours + 1 })}
                    className="w-10 h-10 rounded-xl bg-[#006c49] text-white font-bold text-lg flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Preset Chips */}
                <div className="grid grid-cols-5 gap-1 mt-2">
                  {[0, 3, 4, 6, 12].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setDayEditModal({ ...dayEditModal, hours: h })}
                      className={`py-1 rounded-lg text-xs font-mono font-bold transition border cursor-pointer ${
                        dayEditModal.hours === h
                          ? 'bg-[#006c49] text-white border-[#006c49]'
                          : 'bg-[#eff4ff] text-[#45464d] border-[#dde9ff] hover:bg-[#dde9ff]'
                      }`}
                    >
                      {h === 0 ? '0h' : `${h}h`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#0d1c2f] block mb-1">
                  Motivo / Observação da Hora Extra (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Ficou até mais tarde, Dobra..."
                  value={dayEditModal.note}
                  onChange={(e) => setDayEditModal({ ...dayEditModal, note: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-[#f8f9ff] border border-[#dde9ff] rounded-xl outline-none focus:ring-1 focus:ring-[#006c49]"
                />
              </div>

              {/* Subtotal preview */}
              <div className="p-2.5 bg-[#131b2e] text-white rounded-xl flex items-center justify-between text-xs">
                <span className="text-[#bec6e0] font-mono">Total deste dia:</span>
                <span className="font-mono font-black text-[#6cf8bb]">
                  R$ {(dayEditModal.hours * (calc.rate || defaultHourlyRate)).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDayEditModal(null)}
                className="w-1/3 py-2 rounded-xl bg-[#eff4ff] text-[#45464d] text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShiftHours(dayEditModal.guard.id, dayEditModal.day, dayEditModal.hours, dayEditModal.note)
                  setDayEditModal(null)
                }}
                className="w-2/3 py-2 rounded-xl bg-[#006c49] hover:bg-[#005236] text-white text-xs font-bold shadow-md transition active:scale-95 cursor-pointer"
              >
                Salvar Horas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição Completa da Escala */}
      {scheduleModalGuard && (
        <GuardScheduleEditModal
          guard={scheduleModalGuard}
          isOpen={Boolean(scheduleModalGuard)}
          onClose={() => setScheduleModalGuard(null)}
        />
      )}
    </div>
  )
}

