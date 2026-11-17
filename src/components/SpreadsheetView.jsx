import React, { useState, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { MultiDayAssignModal } from './MultiDayAssignModal'
import { GuardScheduleEditModal } from './GuardScheduleEditModal'
import { WhatsAppIcon } from './icons/WhatsAppIcon'
import { getHoliday, getWeekday, getMonthInfo, BRAZILIAN_WEEKDAYS } from '../utils/brazilianCalendar'
import { buildMonthOptions } from '../utils/months'
import { DayShiftModal } from './schedule/DayShiftModal'
import { useDaySubstitutions } from './schedule/useDaySubstitutions'

export function SpreadsheetView({
  onOpenNewGuardModal,
  onOpenQuickHub: _onOpenQuickHub,
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
    getGuardCalculations,
    exportBackupJSON,
    getPaymentStatus,
  } = useApp()

  // Primary view range: 'month' (default: full month), 'q1' (1..15), 'q2' (16..end)
  const [calendarRange, setCalendarRange] = useState('month')
  const [viewMode, setViewMode] = useState('calendar') // 'calendar', 'cards' or 'table'

  // Day Edit & Quick Autocomplete Modal
  const [dayEditModal, setDayEditModal] = useState({ isOpen: false, day: null })

  // Other modals
  const [scheduleModalGuard, setScheduleModalGuard] = useState(null)
  const [multiDayModal, setMultiDayModal] = useState({ isOpen: false, guardId: null })

  // Floating Undo Toast
  const [undoToast, setUndoToast] = useState(null)
  const undoToastTimerRef = useRef(null)

  const showUndoToast = ({ message, onUndo }) => {
    if (undoToastTimerRef.current) clearTimeout(undoToastTimerRef.current)
    setUndoToast({ message, onUndo })
    undoToastTimerRef.current = setTimeout(() => {
      setUndoToast(null)
    }, 8000)
  }

  const handleOpenMultiDay = (guardId = null) => {
    if (onOpenMultiDay) {
      onOpenMultiDay(guardId)
    } else {
      setMultiDayModal({ isOpen: true, guardId })
    }
  }

  const [year, month] = selectedMonth.split('-').map(Number)
  const monthInfo = getMonthInfo(year, month)
  const totalDaysInMonth = monthInfo.totalDays

  const daysQ1 = monthInfo.q1Days
  const daysQ2 = monthInfo.q2Days

  // Real today reference
  const now = new Date()
  const realDay = now.getDate()
  const realMonth = now.getMonth() + 1
  const realYear = now.getFullYear()
  const realMonthKey = `${realYear}-${String(realMonth).padStart(2, '0')}`
  const isCurrentRealMonth = selectedMonth === realMonthKey
  const todayWeekdayObj = BRAZILIAN_WEEKDAYS[now.getDay()] || { full: 'Hoje' }
  const todayFormatted = `${todayWeekdayObj.full}, ${String(realDay).padStart(2, '0')} de ${now.toLocaleDateString('pt-BR', { month: 'long' })} de ${realYear}`

  // Displayed days based on calendarRange
  const displayedDays =
    calendarRange === 'month'
      ? Array.from({ length: totalDaysInMonth }, (_, i) => i + 1)
      : calendarRange === 'q1'
      ? daysQ1
      : daysQ2

  // Weekday offset for calendar layout (0 = Dom, 1 = Seg...)
  const firstDisplayedDay = calendarRange === 'q2' ? 16 : 1
  const firstDayOfWeek = new Date(year, month - 1, firstDisplayedDay).getDay()
  const leadingBlanks = Array.from({ length: firstDayOfWeek })
  const trailingBlanksCount = (7 - ((firstDayOfWeek + displayedDays.length) % 7)) % 7
  const trailingBlanks = Array.from({ length: trailingBlanksCount })

  const activeGuards = guards.filter(
    (g) => g.active && g.id !== 'g-folguista' && g.name?.toLowerCase() !== 'folguista'
  )
  const filteredGuards = activeGuards

  // Calculate totals for active range
  let totalHours = 0
  let totalAmount = 0
  let paidAmount = 0

  activeGuards.forEach((guard) => {
    const calc = getGuardCalculations(guard.id)
    const s1 = getPaymentStatus(guard.id, 'q1')
    const s2 = getPaymentStatus(guard.id, 'q2')

    let gHours = 0
    let gAmount = 0

    if (calendarRange === 'month') {
      gHours = calc.totalHours
      gAmount = calc.totalAmount
      if (s1.status === 'PAID') paidAmount += calc.q1Total
      if (s2.status === 'PAID') paidAmount += calc.q2Total
    } else if (calendarRange === 'q1') {
      gHours = calc.q1Hours
      gAmount = calc.q1Total
      if (s1.status === 'PAID') paidAmount += calc.q1Total
    } else {
      gHours = calc.q2Hours
      gAmount = calc.q2Total
      if (s2.status === 'PAID') paidAmount += calc.q2Total
    }

    totalHours += gHours
    totalAmount += gAmount
  })

  totalHours = Math.round(totalHours * 100) / 100
  totalAmount = Math.round(totalAmount * 100) / 100
  paidAmount = Math.round(paidAmount * 100) / 100
  const pendingAmount = Math.round(Math.max(0, totalAmount - paidAmount) * 100) / 100

  // Guard cards rows for cards view
  const guardRows = activeGuards.map((guard) => {
    const post = posts.find((p) => p.id === guard.postId)
    const calc = getGuardCalculations(guard.id)
    const guardShifts = shifts[selectedMonth]?.[guard.id] || {}

    const qHours =
      calendarRange === 'month'
        ? calc.totalHours
        : calendarRange === 'q1'
        ? calc.q1Hours
        : calc.q2Hours
    const qAmount =
      calendarRange === 'month'
        ? calc.totalAmount
        : calendarRange === 'q1'
        ? calc.q1Total
        : calc.q2Total

    const s1 = getPaymentStatus(guard.id, 'q1')
    const s2 = getPaymentStatus(guard.id, 'q2')
    const isPaid =
      calendarRange === 'q1'
        ? s1.status === 'PAID'
        : calendarRange === 'q2'
        ? s2.status === 'PAID'
        : s1.status === 'PAID' && s2.status === 'PAID'

    const activeDaysList = []
    displayedDays.forEach((d) => {
      const h = guardShifts[d]
      if (h !== undefined && h !== null && Number(h) > 0) {
        activeDaysList.push(d)
      }
    })

    return {
      guard,
      post,
      calc,
      qHours,
      qAmount,
      isPaid,
      activeDaysList,
      guardShifts,
    }
  })

  // Open day editor (o modal começa com a busca limpa a cada abertura)
  const handleOpenDayModal = (d) => {
    setDayEditModal({ isOpen: true, day: d })
  }

  // Regras de escala do dia e substituições por folguista
  const substitutions = useDaySubstitutions({ activeGuards, showUndoToast })
  const {
    getGuardsOnDay,
    getOriginalGuardForFolguista,
    handleUndoFolguista,
  } = substitutions


  return (
    <div className="flex flex-col w-full pb-28 space-y-4 max-w-[1920px] 2xl:max-w-full mx-auto px-1 sm:px-2">
      {/* Control Header & Period Selection */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-line space-y-3.5">
        {/* Month Selector & Rate Info */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-field px-3 py-1.5 rounded-xl border border-line/60">
              <span className="material-symbols-outlined text-[20px] text-brand">
                calendar_today
              </span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent font-bold text-xs sm:text-sm text-ink outline-none cursor-pointer capitalize"
              >
                {buildMonthOptions({ selected: selectedMonth }).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Button: Ir para Hoje */}
            {!isCurrentRealMonth ? (
              <button
                type="button"
                onClick={() => setSelectedMonth(realMonthKey)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs transition active:scale-95 shadow-xs cursor-pointer"
                title={`Ir para o mês atual (${todayFormatted})`}
              >
                <span className="material-symbols-outlined text-[16px]">today</span>
                <span>Ir para Hoje ({String(realDay).padStart(2, '0')}/{String(realMonth).padStart(2, '0')})</span>
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-brand border border-emerald-200 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-brand" />
                <span>Hoje: {todayFormatted}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-mint/20 px-3 py-1.5 rounded-xl border border-mint/30">
              <span className="text-xs text-brand-text">Hora Base:</span>
              <span className="font-mono text-xs text-brand-text font-bold">
                R$ {defaultHourlyRate.toFixed(2).replace('.', ',')}
              </span>
            </div>

            <button
              type="button"
              onClick={exportBackupJSON}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-field hover:bg-line text-ink rounded-xl text-xs font-semibold border border-line transition cursor-pointer"
              title="Baixar cópia da planilha em formato JSON para o computador"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Salvar Cópia</span>
            </button>
          </div>
        </div>

        {/* Big Range Switcher: Mês Inteiro (Padrão) vs Quinzenas */}
        <div className="grid grid-cols-3 gap-1 bg-field p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setCalendarRange('month')}
            className={`flex flex-col items-center justify-center py-2 px-2 rounded-lg transition-all cursor-pointer ${
 calendarRange === 'month'
 ? 'bg-brand text-white shadow-xs font-bold'
 : 'text-ink-soft hover:text-ink'
 }`}
          >
            <span className="text-xs font-bold">Mês Inteiro (Todos os Dias)</span>
            <span className="font-mono text-[11px] opacity-80">Dias 01 a {totalDaysInMonth}</span>
          </button>

          <button
            type="button"
            onClick={() => setCalendarRange('q1')}
            className={`flex flex-col items-center justify-center py-2 px-2 rounded-lg transition-all cursor-pointer ${
 calendarRange === 'q1'
 ? 'bg-brand text-white shadow-xs font-bold'
 : 'text-ink-soft hover:text-ink'
 }`}
          >
            <span className="text-xs font-bold">1ª Quinzena</span>
            <span className="font-mono text-[11px] opacity-80">Dias 01 a 15</span>
          </button>

          <button
            type="button"
            onClick={() => setCalendarRange('q2')}
            className={`flex flex-col items-center justify-center py-2 px-2 rounded-lg transition-all cursor-pointer ${
 calendarRange === 'q2'
 ? 'bg-brand text-white shadow-xs font-bold'
 : 'text-ink-soft hover:text-ink'
 }`}
          >
            <span className="text-xs font-bold">2ª Quinzena</span>
            <span className="font-mono text-[11px] opacity-80">Dias 16 a {totalDaysInMonth}</span>
          </button>
        </div>

        {/* Filters and View Mode Controls */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
          {/* Post Filter */}
          {/* Equipe Completa Indicator */}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand" />
            <span className="text-xs font-bold text-ink">
              Equipe Operacional ({activeGuards.length} Colaboradores)
            </span>
          </div>

          {/* Quick Actions & View Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenWhatsApp && onOpenWhatsApp()}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-whatsapp/20 hover:bg-whatsapp/30 text-whatsapp-dark font-bold text-xs transition border border-whatsapp/30 cursor-pointer active:scale-95 shadow-xs"
              title="Colar escala do WhatsApp"
            >
              <WhatsAppIcon className="w-4 h-4 fill-whatsapp" />
              <span className="hidden sm:inline">Colar WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenMultiDay(null)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs transition active:scale-95 shadow-xs cursor-pointer"
              title="Lançar múltiplos dias na grade"
            >
              <span className="material-symbols-outlined text-[15px]">calendar_add_on</span>
              <span>+ Vários Dias</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-0.5 bg-field p-0.5 rounded-xl border border-line">
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
 viewMode === 'calendar'
 ? 'bg-brand text-white shadow-xs'
 : 'text-ink-soft hover:text-ink'
 }`}
                title="Grande Calendário do Mês"
              >
                <span className="material-symbols-outlined text-[17px]">calendar_month</span>
                <span className="hidden sm:inline">Calendário</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
 viewMode === 'cards'
 ? 'bg-ink text-white shadow-xs'
 : 'text-ink-soft hover:text-ink'
 }`}
                title="Visualização em Cartões por Prestador"
              >
                <span className="material-symbols-outlined text-[17px]">view_agenda</span>
                <span className="hidden sm:inline">Cartões</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
 viewMode === 'table'
 ? 'bg-ink text-white shadow-xs'
 : 'text-ink-soft hover:text-ink'
 }`}
                title="Visualização em Grade / Tabela"
              >
                <span className="material-symbols-outlined text-[17px]">table_chart</span>
                <span className="hidden sm:inline">Grade</span>
              </button>
            </div>
          </div>
        </div>

        {/* Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-field">
          <div className="bg-field p-2.5 rounded-xl flex flex-col border border-line/60">
            <span className="text-[11px] text-ink-soft font-bold">Carga Total</span>
            <span className="font-mono text-xs font-bold text-ink mt-0.5">
              {totalHours}h ({activeGuards.length} colaboradores)
            </span>
          </div>

          <div className="bg-field p-2.5 rounded-xl flex flex-col border border-line/60">
            <span className="text-[11px] text-ink-soft font-bold">Previsão Folha</span>
            <span className="font-mono text-xs font-bold text-ink mt-0.5">
              R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </span>
          </div>

          <div className="bg-mint/20 p-2.5 rounded-xl flex flex-col border border-mint/40">
            <span className="font-mono text-[11px] text-brand-text font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">check_circle</span>
              Valor Já Pago
            </span>
            <span className="font-mono text-xs font-black text-brand-text mt-0.5">
              R$ {paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </span>
          </div>

          <div className="bg-warn-soft/30 p-2.5 rounded-xl flex flex-col border border-warn-light">
            <span className="font-mono text-[11px] text-warn-ink font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">schedule</span>
              Ainda a Pagar
            </span>
            <span className="font-mono text-xs font-black text-warn-ink mt-0.5">
              R$ {pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: GRANDE CALENDÁRIO MENSAL (Principal e Simples de Usar) */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-3xl shadow-xs border border-line overflow-hidden p-4 sm:p-5 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-field">
            <div>
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <span className="material-symbols-outlined text-brand">calendar_month</span>
                <span>
                  Grande Calendário • {calendarRange === 'month' ? 'Mês Inteiro' : calendarRange === 'q1' ? '1ª Quinzena' : '2ª Quinzena'} ({monthInfo.formattedMonth})
                </span>
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Clique em qualquer data para adicionar funcionário, trocar plantão ou preencher com folguista.
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-brand bg-mint/20 px-3 py-1 rounded-xl">
              {displayedDays.length} dias no painel
            </span>
          </div>

          {/* Banner when viewing another month */}
          {!isCurrentRealMonth && (
            <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-3 flex items-center justify-between gap-3 text-amber-900 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-700 text-xl">info</span>
                <span className="text-xs font-medium">
                  Você está visualizando a escala de <strong>{monthInfo.formattedMonth}</strong>. Hoje é <strong>{todayFormatted}</strong>.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMonth(realMonthKey)}
                className="px-3 py-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-sm">today</span>
                <span>Ir para Hoje ({String(realDay).padStart(2, '0')}/{String(realMonth).padStart(2, '0')})</span>
              </button>
            </div>
          )}

          {/* 7 Columns Weekday Header on Desktop PC */}
          <div className="hidden lg:grid grid-cols-7 gap-3">
            {BRAZILIAN_WEEKDAYS.map((w) => (
              <div
                key={w.id}
                className={`text-center py-2.5 px-2 rounded-xl text-xs lg:text-sm font-black shadow-2xs ${
 w.isWeekend ? 'bg-line/60 text-ink' : 'bg-field text-slate'
 }`}
              >
                {w.full}
              </div>
            ))}
          </div>

          {/* Monthly Calendar Grid: 7 columns on Desktop, responsive on Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 lg:gap-3.5">
            {/* Leading blanks for full month alignment */}
            {leadingBlanks.map((_, idx) => (
              <div
                key={`blank-lead-${idx}`}
                className="hidden lg:flex flex-col p-3.5 rounded-2xl border border-dashed border-line/50 bg-page/40 min-h-[160px] lg:min-h-[180px] xl:min-h-[195px]"
              />
            ))}

            {/* Actual Days */}
            {displayedDays.map((d) => {
              const weekday = getWeekday(year, month, d)
              const holiday = getHoliday(year, month, d)
              const isWeekend = weekday.isWeekend
              const guardsOnDay = getGuardsOnDay(d)
              const totalDayHours = guardsOnDay.reduce((acc, curr) => acc + curr.hours, 0)
              const hasFolguista = guardsOnDay.some((item) => item.isFolguista)
              const isToday = isCurrentRealMonth && d === realDay

              return (
                <div
                  key={d}
                  onClick={() => handleOpenDayModal(d)}
                  className={`p-3.5 lg:p-4 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 min-h-[160px] lg:min-h-[180px] xl:min-h-[195px] cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99] group ${
 isToday
 ? 'bg-emerald-50/75 border-2 border-brand ring-2 ring-brand/40 shadow-md'
 : holiday
 ? 'bg-amber-50/40 border-amber-200/90 hover:border-amber-400'
 : isWeekend
 ? 'bg-page border-line hover:border-mint'
 : 'bg-white border-line hover:border-brand'
 }`}
                  title={
                    isToday
                      ? `Hoje, dia ${d} (${weekday.full}) - Clique para gerenciar plantão`
                      : `Clique no dia ${d} para adicionar, trocar ou lançar folguista`
                  }
                >
                  {/* Card Header (Day Number + Weekday + Badges) */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 lg:w-9 lg:h-9 xl:w-10 xl:h-10 rounded-xl font-mono flex items-center justify-center font-black text-xs lg:text-sm shadow-2xs ${
 isToday
 ? 'bg-brand text-white ring-2 ring-emerald-300 shadow-sm'
 : holiday
 ? 'bg-amber-100 text-amber-900 border border-amber-300'
 : isWeekend
 ? 'bg-line text-ink'
 : 'bg-field text-brand group-hover:bg-brand group-hover:text-white transition-colors'
 }`}
                        >
                          {String(d).padStart(2, '0')}
                        </div>

                        {isToday ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand text-white text-[11px] lg:text-xs font-black shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
                            HOJE
                          </span>
                        ) : (
                          <span className="font-bold text-xs text-ink capitalize lg:hidden">
                            {weekday.full}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {hasFolguista && (
                          <span
                            className="w-2.5 h-2.5 rounded-full bg-amber-500"
                            title="Dia com folguista cadastrado"
                          />
                        )}
                        <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
 isToday ? 'bg-brand/15 text-brand font-black' : 'text-ink-soft bg-field'
 }`}>
                          {guardsOnDay.length > 0 ? `${totalDayHours}h` : '0h'}
                        </span>
                      </div>
                    </div>

                    {holiday && (
                      <div className="mb-1 text-xs lg:text-xs text-amber-900 font-bold bg-amber-100/80 border border-amber-200/60 px-2 py-0.5 rounded-md truncate" title={holiday.name}>
                        <span className="material-symbols-outlined text-[12px] leading-none">flag</span> {holiday.name}
                      </div>
                    )}
                  </div>

                  {/* Scheduled Guards Pills - Exibe todos os colaboradores escalados */}
                  <div className="space-y-1 my-auto">
                    {guardsOnDay.map(({ guard, hours, post, isFolguista }) => {
                      const displayName = guard.name
                      const originalForDay = isFolguista ? getOriginalGuardForFolguista(d) : null
                      return (
                        <div
                          key={guard.id}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs lg:text-[13px] font-bold transition ${
 isFolguista
 ? 'bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs'
 : 'bg-field group-hover:bg-white text-ink border border-line/80'
 }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
 isFolguista ? 'bg-amber-600' : 'bg-brand'
 }`}
                            />
                            <span className="truncate">{displayName}</span>
                            {isFolguista && originalForDay && (
                              <span className="text-[11px] text-amber-900/80 font-bold truncate">
                                ({originalForDay.guard.name})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {isFolguista && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleUndoFolguista(d)
                                }}
                                className="px-1.5 py-0.5 rounded-md bg-amber-200 hover:bg-emerald-600 hover:text-white text-amber-950 flex items-center gap-0.5 text-[11px] font-black transition cursor-pointer shadow-2xs"
                                title={
                                  originalForDay
                                    ? `Clique para desfazer e voltar para ${originalForDay.guard.name}`
                                    : 'Clique para desfazer folguista'
                                }
                              >
                                <span className="material-symbols-outlined text-[13px]">undo</span>
                                <span>Voltar</span>
                              </button>
                            )}
                            <span className={`font-mono text-xs font-black ml-0.5 ${isFolguista ? 'text-amber-900' : 'text-brand'}`}>
                              {hours}h
                            </span>
                          </div>
                        </div>
                      )
                    })}

                    {guardsOnDay.length === 0 && (
                      <div className="py-4 text-center text-xs text-ink-muted italic bg-page rounded-xl border border-dashed border-line">
                        Sem plantão escalado
                      </div>
                    )}
                  </div>

                  {/* Day Footer Action */}
                  <div className="pt-2 border-t border-field flex items-center justify-between text-xs lg:text-[13px]">
                    <span className="text-ink-muted">
                      {guardsOnDay.length} {guardsOnDay.length === 1 ? 'colaborador' : 'colaboradores'}
                    </span>
                    <span className="font-bold text-brand group-hover:underline flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[15px]">edit</span>
                      <span>Editar</span>
                    </span>
                  </div>
                </div>
              )
            })}

            {/* Trailing blanks */}
            {trailingBlanks.map((_, idx) => (
              <div
                key={`blank-trail-${idx}`}
                className="hidden lg:flex flex-col p-3.5 rounded-2xl border border-dashed border-line/50 bg-page/40 min-h-[160px] lg:min-h-[180px] xl:min-h-[195px]"
              />
            ))}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: CARDS POR PRESTADOR */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filteredGuards.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center border border-line space-y-3 col-span-full">
              <span className="material-symbols-outlined text-4xl text-ink-muted">group_off</span>
              <p className="text-sm font-bold text-ink">Nenhum colaborador encontrado</p>
            </div>
          )}

          {guardRows.map(({ guard, post, qHours, qAmount, isPaid, activeDaysList }) => {
            const hasHours = qHours > 0
            const isFolguista = guard.id === 'g-folguista' || guard.name.toLowerCase() === 'folguista'

            return (
              <div
                key={guard.id}
                className={`bg-white rounded-2xl p-4 shadow-xs border transition-all flex flex-col justify-between gap-3 ${
 isFolguista ? 'border-amber-300 bg-amber-50/30' : 'border-line'
 }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs ${
 isFolguista ? 'bg-amber-200 text-amber-950 font-black' : 'bg-line text-ink'
 }`}>
                        {isFolguista ? 'FOL' : guard.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-ink">{guard.name}</h4>
                          {isFolguista && (
                            <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[11px] font-black">
                              Substituto
                            </span>
                          )}
                        </div>
                        {isFolguista && (
                          <span className="text-xs text-amber-800 font-medium">
                            Plantões de Substituição
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="font-mono text-sm font-bold text-brand">{qHours}h</span>
                      <span className="font-mono text-xs font-bold text-ink">
                        R$ {qAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-field flex items-center justify-between text-xs text-ink-muted">
                    <span>{activeDaysList.length} dias alocados no período</span>
                    <button
                      type="button"
                      onClick={() => handleOpenMultiDay(guard.id)}
                      className="px-2.5 py-1 rounded-lg bg-field hover:bg-line text-brand font-bold text-xs flex items-center gap-1 transition"
                    >
                      <span className="material-symbols-outlined text-[14px]">calendar_add_on</span>
                      <span>Lançar Dias</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* VIEW MODE 3: GRADE / TABELA COMPLETA */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-3xl shadow-xs border border-line overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b border-field">
            <div>
              <h3 className="text-sm font-bold text-ink">Grade Completa de Dias</h3>
              <p className="text-xs text-ink-muted">Auditoria dia a dia de todos os colaboradores</p>
            </div>
            <span className="material-symbols-outlined text-ink-muted">swap_horiz</span>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-field text-ink-soft font-mono text-[11px]">
                  <th className="py-2.5 px-3 sticky left-0 bg-field shadow-[1px_0_4px_rgba(0,0,0,0.05)] z-10">
                    Prestador
                  </th>
                  {displayedDays.map((d) => {
                    const weekday = getWeekday(year, month, d)
                    const holiday = getHoliday(year, month, d)
                    const isToday = isCurrentRealMonth && d === realDay
                    return (
                      <th
                        key={d}
                        onClick={() => handleOpenDayModal(d)}
                        className={`py-2 px-1 text-center min-w-[34px] cursor-pointer hover:bg-line transition ${
 isToday
 ? 'bg-brand text-white border-b-2 border-emerald-300 font-bold'
 : holiday
 ? 'bg-amber-100 text-amber-900 border-b-2 border-amber-400'
 : weekday.isWeekend
 ? 'bg-field-strong text-navy-muted'
 : ''
 }`}
                        title={
                          isToday
                            ? `Hoje, dia ${d} (${weekday.full})`
                            : `Dia ${d} (${weekday.full}) - Clique para editar`
                        }
                      >
                        <div>{String(d).padStart(2, '0')}</div>
                        <div className={`text-[10px] ${isToday ? 'font-black text-emerald-200' : 'opacity-75'}`}>
                          {isToday ? 'HOJE' : weekday.short}
                        </div>
                      </th>
                    )
                  })}
                  <th className="py-2.5 px-2 text-center">Horas</th>
                  <th className="py-2.5 px-3 text-right">Total R$</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-field">
                {guardRows.map(({ guard, post, qHours, qAmount, guardShifts }) => (
                  <tr key={guard.id} className="hover:bg-page transition-colors">
                    <td className="py-2 px-3 font-semibold text-ink sticky left-0 bg-white shadow-[1px_0_4px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[140px]">{guard.name}</span>
                      </div>
                    </td>

                    {displayedDays.map((d) => {
                      const h = guardShifts[d]
                      const hasVal = h !== undefined && h !== null
                      const isToday = isCurrentRealMonth && d === realDay
                      return (
                        <td
                          key={d}
                          onClick={() => handleOpenDayModal(d)}
                          className={`py-1 px-1 text-center font-mono text-xs cursor-pointer transition ${
 isToday ? 'bg-emerald-50/50 hover:bg-emerald-100/50 font-semibold' : 'hover:bg-emerald-50'
 }`}
                        >
                          {hasVal && Number(h) > 0 ? (
                            <span className="font-bold text-brand bg-emerald-50 px-1 py-0.5 rounded">
                              {h}h
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      )
                    })}

                    <td className="py-2 px-2 text-center font-mono font-bold text-brand">
                      {qHours}h
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-ink">
                      R$ {qAmount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Floating Tactical Bottom Bar */}
      <div className="fixed bottom-16 md:bottom-4 left-0 w-full px-4 z-30 pointer-events-none">
        <div className="max-w-[1920px] 2xl:max-w-full mx-auto bg-navy text-white rounded-2xl p-3.5 shadow-xl flex items-center justify-between gap-3 backdrop-blur-md border border-white/10 pointer-events-auto">
          <div className="flex flex-col min-w-0">
            <span className="font-mono text-[11px] text-on-navy flex items-center gap-1.5 font-semibold">
              <span className="inline-block w-2 h-2 rounded-full bg-mint"></span>
              <span>{monthInfo.formattedMonth}</span>
              <span>•</span>
              <span className="text-mint">{calendarRange === 'month' ? 'Mês Inteiro' : calendarRange === 'q1' ? '1ª Quinzena' : '2ª Quinzena'}</span>
              <span>({totalHours}h totais)</span>
            </span>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="font-mono text-xs font-bold text-mint">
                ✓ Pago: R$ {paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </span>
              <span className="font-mono text-xs font-bold text-warn-soft">
                Pendente: R$ {pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenMultiDay(null)}
              className="h-9 px-3.5 rounded-xl bg-brand hover:bg-brand-hover text-white flex items-center gap-1 text-xs font-bold transition active:scale-95 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">calendar_add_on</span>
              <span>Lançar Vários Dias</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: GERENCIAR PLANTÃO DO DIA (CLICOU NO DIA)           */}
      {/* Com autocomplete de escrita rápida e botão de Folguista   */}
      {/* ======================================================== */}
      {dayEditModal.isOpen && dayEditModal.day && (
        <DayShiftModal
          key={dayEditModal.day}
          dayEditModal={dayEditModal}
          setDayEditModal={setDayEditModal}
          activeGuards={activeGuards}
          monthInfo={monthInfo}
          year={year}
          month={month}
          isCurrentRealMonth={isCurrentRealMonth}
          realDay={realDay}
          substitutions={substitutions}
        />
      )}

      {/* Global Multi-Day Modal fallback */}
      {multiDayModal.isOpen && (
        <MultiDayAssignModal
          isOpen={multiDayModal.isOpen}
          initialGuardId={multiDayModal.guardId}
          onClose={() => setMultiDayModal({ isOpen: false, guardId: null })}
        />
      )}

      {/* Schedule Edit Modal */}
      {scheduleModalGuard && (
        <GuardScheduleEditModal
          isOpen={Boolean(scheduleModalGuard)}
          guard={scheduleModalGuard}
          onClose={() => setScheduleModalGuard(null)}
        />
      )}

      {/* Floating Instant Undo Toast */}
      {undoToast && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-50 max-w-md bg-navy text-white p-3.5 rounded-2xl shadow-2xl border border-mint/40 flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-mint text-[20px]">
              check_circle
            </span>
            <span className="text-xs font-semibold leading-tight">{undoToast.message}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {undoToast.onUndo && (
              <button
                type="button"
                onClick={() => {
                  undoToast.onUndo()
                  setUndoToast(null)
                }}
                className="px-3 py-1.5 rounded-xl bg-mint hover:bg-mint-strong text-brand-deep font-black text-xs flex items-center gap-1 transition active:scale-95 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">undo</span>
                <span>Desfazer</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setUndoToast(null)}
              className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer text-xs"
              title="Fechar aviso"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
