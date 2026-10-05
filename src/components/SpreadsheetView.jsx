import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { MultiDayAssignModal } from './MultiDayAssignModal'
import { GuardScheduleEditModal } from './GuardScheduleEditModal'
import { WhatsAppIcon } from './icons/WhatsAppIcon'
import { getHoliday, getWeekday, getMonthInfo, BRAZILIAN_WEEKDAYS } from '../utils/brazilianCalendar'

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
    setShiftHours,
    getGuardCalculations,
    exportBackupJSON,
    getShiftNote,
    getPaymentStatus,
    togglePaymentStatus,
  } = useApp()

  // Primary view range: 'month' (default: full month), 'q1' (1..15), 'q2' (16..end)
  const [calendarRange, setCalendarRange] = useState('month')
  const [viewMode, setViewMode] = useState('calendar') // 'calendar', 'cards' or 'table'
  const [selectedPostFilter, setSelectedPostFilter] = useState('all')

  // Day Edit & Quick Autocomplete Modal
  const [dayEditModal, setDayEditModal] = useState({ isOpen: false, day: null })
  const [daySearchQuery, setDaySearchQuery] = useState('')
  const [swappingGuardId, setSwappingGuardId] = useState(null)
  const searchInputRef = useRef(null)

  // Other modals
  const [scheduleModalGuard, setScheduleModalGuard] = useState(null)
  const [multiDayModal, setMultiDayModal] = useState({ isOpen: false, guardId: null })

  // Focus search input when modal opens
  useEffect(() => {
    if (dayEditModal.isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [dayEditModal.isOpen])

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

  // Displayed days based on calendarRange
  const displayedDays =
    calendarRange === 'month'
      ? Array.from({ length: totalDaysInMonth }, (_, i) => i + 1)
      : calendarRange === 'q1'
      ? daysQ1
      : daysQ2

  // Weekday offset for calendar month layout (0 = Dom, 1 = Seg...)
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay()
  const leadingBlanks = calendarRange === 'month' ? Array.from({ length: firstDayOfWeek }) : []
  const trailingBlanksCount =
    calendarRange === 'month' ? (7 - ((firstDayOfWeek + totalDaysInMonth) % 7)) % 7 : 0
  const trailingBlanks = Array.from({ length: trailingBlanksCount })

  const activeGuards = guards.filter((g) => g.active)

  // Filter guards by post if selected
  const filteredGuards =
    selectedPostFilter === 'all'
      ? activeGuards
      : activeGuards.filter((g) => g.postId === selectedPostFilter || g.id === 'g-folguista')

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

  const pendingAmount = Math.max(0, totalAmount - paidAmount)

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

  // Open day editor
  const handleOpenDayModal = (d) => {
    setDaySearchQuery('')
    setSwappingGuardId(null)
    setDayEditModal({ isOpen: true, day: d })
  }

  // Get guards on a specific day
  const getGuardsOnDay = (d) => {
    return activeGuards
      .filter((g) => {
        if (selectedPostFilter !== 'all' && g.postId !== selectedPostFilter && g.id !== 'g-folguista') {
          return false
        }
        const h = shifts[selectedMonth]?.[g.id]?.[d]
        return h !== undefined && h !== null && Number(h) > 0
      })
      .map((g) => ({
        guard: g,
        hours: Number(shifts[selectedMonth]?.[g.id]?.[d]),
        post: posts.find((p) => p.id === g.postId),
        note: getShiftNote ? getShiftNote(g.id, d) : '',
        isFolguista: g.id === 'g-folguista' || g.name.toLowerCase() === 'folguista',
      }))
  }

  // Add guard via autocomplete to current day
  const handleSelectGuardForDay = (targetGuard, d) => {
    if (!targetGuard || !d) return
    const hours = targetGuard.defaultShiftHours || 3

    if (swappingGuardId) {
      // Swapping out an existing guard
      setShiftHours(swappingGuardId, d, null)
      setShiftHours(targetGuard.id, d, hours, 'Substituto')
      setSwappingGuardId(null)
    } else {
      // Adding new guard
      setShiftHours(targetGuard.id, d, hours)
    }
    setDaySearchQuery('')
    searchInputRef.current?.focus()
  }

  // Quick "+ Preencher com Folguista"
  const handleAddFolguistaToDay = (d) => {
    if (!d) return
    setShiftHours('g-folguista', d, 3, 'Substituto')
    setDaySearchQuery('')
  }

  // Replace a specific regular guard with Folguista
  const handleReplaceWithFolguista = (guardId, d, currentHours = 3) => {
    if (!d || !guardId) return
    setShiftHours(guardId, d, null)
    setShiftHours('g-folguista', d, currentHours || 3, 'Substituto')
  }

  // Current day guards in open modal
  const modalDayGuards = dayEditModal.isOpen && dayEditModal.day ? getGuardsOnDay(dayEditModal.day) : []
  const modalDayTotalHours = modalDayGuards.reduce((acc, curr) => acc + curr.hours, 0)

  // Matching guards for autocomplete (excluding those already scheduled on this day)
  const scheduledGuardIds = modalDayGuards.map((item) => item.guard.id)
  const matchingGuards = daySearchQuery.trim()
    ? activeGuards.filter((g) => {
        if (scheduledGuardIds.includes(g.id) && g.id !== swappingGuardId) return false
        const q = daySearchQuery.toLowerCase().trim()
        return (
          g.name.toLowerCase().includes(q) ||
          (g.fullName && g.fullName.toLowerCase().includes(q))
        )
      })
    : []

  return (
    <div className="flex flex-col w-full pb-28 space-y-4 max-w-7xl mx-auto">
      {/* Control Header & Period Selection */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#dde9ff] space-y-3.5">
        {/* Month Selector & Rate Info */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-[#eff4ff] px-3 py-1.5 rounded-xl border border-[#dde9ff]/60">
            <span className="material-symbols-outlined text-[20px] text-[#006c49]">
              calendar_today
            </span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-bold text-xs sm:text-sm text-[#0d1c2f] outline-none cursor-pointer capitalize"
            >
              <option value="2026-08">Agosto 2026</option>
              <option value="2026-09">Setembro 2026</option>
              <option value="2026-10">Outubro 2026</option>
              <option value="2026-11">Novembro 2026</option>
              <option value="2026-12">Dezembro 2026</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#6cf8bb]/20 px-3 py-1.5 rounded-xl border border-[#6cf8bb]/30">
              <span className="font-mono text-xs text-[#00714d]">Hora Base:</span>
              <span className="font-mono text-xs text-[#00714d] font-bold">
                R$ {defaultHourlyRate.toFixed(2).replace('.', ',')}
              </span>
            </div>

            <button
              type="button"
              onClick={exportBackupJSON}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-[#eff4ff] hover:bg-[#dde9ff] text-[#0d1c2f] rounded-xl text-xs font-semibold border border-[#dde9ff] transition"
              title="Baixar planilha/backup em JSON"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Backup</span>
            </button>
          </div>
        </div>

        {/* Big Range Switcher: Mês Inteiro (Padrão) vs Quinzenas */}
        <div className="grid grid-cols-3 gap-1 bg-[#eff4ff] p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setCalendarRange('month')}
            className={`flex flex-col items-center justify-center py-2 px-2 rounded-lg transition-all cursor-pointer ${
              calendarRange === 'month'
                ? 'bg-[#006c49] text-white shadow-xs font-bold'
                : 'text-[#45464d] hover:text-[#0d1c2f]'
            }`}
          >
            <span className="text-xs font-bold">Mês Inteiro (Todos os Dias)</span>
            <span className="font-mono text-[10px] opacity-80">Dias 01 a {totalDaysInMonth}</span>
          </button>

          <button
            type="button"
            onClick={() => setCalendarRange('q1')}
            className={`flex flex-col items-center justify-center py-2 px-2 rounded-lg transition-all cursor-pointer ${
              calendarRange === 'q1'
                ? 'bg-[#006c49] text-white shadow-xs font-bold'
                : 'text-[#45464d] hover:text-[#0d1c2f]'
            }`}
          >
            <span className="text-xs font-bold">1ª Quinzena</span>
            <span className="font-mono text-[10px] opacity-80">Dias 01 a 15</span>
          </button>

          <button
            type="button"
            onClick={() => setCalendarRange('q2')}
            className={`flex flex-col items-center justify-center py-2 px-2 rounded-lg transition-all cursor-pointer ${
              calendarRange === 'q2'
                ? 'bg-[#006c49] text-white shadow-xs font-bold'
                : 'text-[#45464d] hover:text-[#0d1c2f]'
            }`}
          >
            <span className="text-xs font-bold">2ª Quinzena</span>
            <span className="font-mono text-[10px] opacity-80">Dias 16 a {totalDaysInMonth}</span>
          </button>
        </div>

        {/* Filters and View Mode Controls */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
          {/* Post Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-bold text-[#45464d] mr-1 hidden sm:inline">Posto:</span>
            <button
              type="button"
              onClick={() => setSelectedPostFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                selectedPostFilter === 'all'
                  ? 'bg-[#0d1c2f] text-white shadow-2xs'
                  : 'bg-[#eff4ff] text-[#45464d] hover:bg-[#dde9ff]'
              }`}
            >
              Todos ({posts.length})
            </button>
            {posts.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPostFilter(p.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                  selectedPostFilter === p.id
                    ? 'bg-[#0d1c2f] text-white shadow-2xs'
                    : 'bg-[#eff4ff] text-[#45464d] hover:bg-[#dde9ff]'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          {/* Quick Actions & View Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenWhatsApp && onOpenWhatsApp()}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#075e54] font-bold text-xs transition border border-[#25D366]/30 cursor-pointer active:scale-95 shadow-xs"
              title="Colar escala do WhatsApp"
            >
              <WhatsAppIcon className="w-4 h-4 fill-[#25D366]" />
              <span className="hidden sm:inline">Colar WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenMultiDay(null)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#006c49] hover:bg-[#005236] text-white font-bold text-xs transition active:scale-95 shadow-xs cursor-pointer"
              title="Lançar múltiplos dias na grade"
            >
              <span className="material-symbols-outlined text-[15px]">calendar_add_on</span>
              <span>+ Vários Dias</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-0.5 bg-[#eff4ff] p-0.5 rounded-xl border border-[#dde9ff]">
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'calendar'
                    ? 'bg-[#006c49] text-white shadow-xs'
                    : 'text-[#45464d] hover:text-[#0d1c2f]'
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
                    ? 'bg-[#0d1c2f] text-white shadow-xs'
                    : 'text-[#45464d] hover:text-[#0d1c2f]'
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
                    ? 'bg-[#0d1c2f] text-white shadow-xs'
                    : 'text-[#45464d] hover:text-[#0d1c2f]'
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-[#eff4ff]">
          <div className="bg-[#eff4ff] p-2.5 rounded-xl flex flex-col border border-[#dde9ff]/60">
            <span className="font-mono text-[10px] text-[#45464d] uppercase font-bold">Carga Total</span>
            <span className="font-mono text-xs font-bold text-[#0d1c2f] mt-0.5">
              {totalHours}h ({activeGuards.length} colaboradores)
            </span>
          </div>

          <div className="bg-[#eff4ff] p-2.5 rounded-xl flex flex-col border border-[#dde9ff]/60">
            <span className="font-mono text-[10px] text-[#45464d] uppercase font-bold">Previsão Folha</span>
            <span className="font-mono text-xs font-bold text-[#0d1c2f] mt-0.5">
              R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </span>
          </div>

          <div className="bg-[#6cf8bb]/20 p-2.5 rounded-xl flex flex-col border border-[#6cf8bb]/40">
            <span className="font-mono text-[10px] text-[#00714d] uppercase font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">check_circle</span>
              Valor Já Pago
            </span>
            <span className="font-mono text-xs font-black text-[#00714d] mt-0.5">
              R$ {paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </span>
          </div>

          <div className="bg-[#ffddb8]/30 p-2.5 rounded-xl flex flex-col border border-[#ffb95f]">
            <span className="font-mono text-[10px] text-[#78350f] uppercase font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">schedule</span>
              Ainda a Pagar
            </span>
            <span className="font-mono text-xs font-black text-[#78350f] mt-0.5">
              R$ {pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: GRANDE CALENDÁRIO MENSAL (Principal e Simples de Usar) */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-3xl shadow-xs border border-[#dde9ff] overflow-hidden p-4 sm:p-5 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#eff4ff]">
            <div>
              <h3 className="text-base font-bold text-[#0d1c2f] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006c49]">calendar_month</span>
                <span>
                  Grande Calendário • {calendarRange === 'month' ? 'Mês Inteiro' : calendarRange === 'q1' ? '1ª Quinzena' : '2ª Quinzena'} ({monthInfo.formattedMonth})
                </span>
              </h3>
              <p className="text-xs text-[#76777d] mt-0.5">
                👉 Clique em qualquer data para adicionar funcionário, trocar plantão ou preencher com folguista.
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-[#006c49] bg-[#6cf8bb]/20 px-3 py-1 rounded-xl">
              {displayedDays.length} dias no painel
            </span>
          </div>

          {/* 7 Columns Weekday Header on Desktop PC */}
          <div className="hidden lg:grid grid-cols-7 gap-2.5">
            {BRAZILIAN_WEEKDAYS.map((w) => (
              <div
                key={w.id}
                className={`text-center py-2 px-1 rounded-xl text-xs font-bold uppercase tracking-wider ${
                  w.isWeekend ? 'bg-[#dde9ff]/50 text-[#0d1c2f]' : 'bg-[#eff4ff] text-[#45464d]'
                }`}
              >
                {w.full}
              </div>
            ))}
          </div>

          {/* Monthly Calendar Grid: 7 columns on Desktop, responsive on Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2.5">
            {/* Leading blanks for full month alignment */}
            {leadingBlanks.map((_, idx) => (
              <div
                key={`blank-lead-${idx}`}
                className="hidden lg:flex flex-col p-3 rounded-2xl border border-dashed border-[#dde9ff]/50 bg-[#f8f9ff]/40 min-h-[140px]"
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

              return (
                <div
                  key={d}
                  onClick={() => handleOpenDayModal(d)}
                  className={`p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2 min-h-[140px] cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] group ${
                    holiday
                      ? 'bg-amber-50/70 border-amber-300 hover:border-amber-400'
                      : isWeekend
                      ? 'bg-[#fcfaff] border-[#dde9ff] hover:border-[#6cf8bb]'
                      : 'bg-white border-[#dde9ff] hover:border-[#006c49]'
                  }`}
                  title={`Clique no dia ${d} para adicionar, trocar ou lançar folguista`}
                >
                  {/* Card Header (Day Number + Weekday + Badges) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-8 h-8 rounded-xl font-mono flex items-center justify-center font-black text-xs shadow-2xs ${
                            holiday
                              ? 'bg-amber-300 text-amber-950 border border-amber-400'
                              : isWeekend
                              ? 'bg-[#dde9ff] text-[#0d1c2f]'
                              : 'bg-[#eff4ff] text-[#006c49] group-hover:bg-[#006c49] group-hover:text-white transition-colors'
                          }`}
                        >
                          {String(d).padStart(2, '0')}
                        </div>
                        <span className="font-bold text-xs text-[#0d1c2f] capitalize lg:hidden">
                          {weekday.full}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {hasFolguista && (
                          <span
                            className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"
                            title="Dia com folguista"
                          />
                        )}
                        <span className="font-mono text-[11px] font-bold text-[#45464d] bg-[#eff4ff] px-1.5 py-0.5 rounded-md">
                          {guardsOnDay.length > 0 ? `${totalDayHours}h` : '0h'}
                        </span>
                      </div>
                    </div>

                    {holiday && (
                      <div className="mb-1 text-[10px] text-amber-900 font-bold bg-amber-100/80 px-1.5 py-0.5 rounded-md truncate">
                        🇧🇷 {holiday.name}
                      </div>
                    )}
                  </div>

                  {/* Scheduled Guards Pills */}
                  <div className="space-y-1 my-auto">
                    {guardsOnDay.slice(0, 4).map(({ guard, hours, post, isFolguista }) => {
                      const displayName = guard.name
                      return (
                        <div
                          key={guard.id}
                          className={`flex items-center justify-between px-2 py-1 rounded-lg text-[11px] font-semibold transition ${
                            isFolguista
                              ? 'bg-amber-100 text-amber-950 border border-amber-300 font-bold'
                              : 'bg-[#eff4ff] group-hover:bg-white text-[#0d1c2f] border border-[#dde9ff]/80'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                isFolguista ? 'bg-amber-600' : 'bg-[#006c49]'
                              }`}
                            />
                            <span className="truncate">{displayName}</span>
                            {post?.name && !isFolguista && (
                              <span className="text-[9px] text-[#76777d] truncate">
                                ({post.name.slice(0, 3)})
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[10px] font-bold shrink-0 ml-1">
                            {hours}h
                          </span>
                        </div>
                      )
                    })}

                    {guardsOnDay.length > 4 && (
                      <div className="text-[10px] text-center font-bold text-[#006c49]">
                        +{guardsOnDay.length - 4} outros...
                      </div>
                    )}

                    {guardsOnDay.length === 0 && (
                      <div className="py-3 text-center text-[11px] text-[#76777d] italic bg-[#f8f9ff] rounded-xl border border-dashed border-[#dde9ff]">
                        Sem plantão
                      </div>
                    )}
                  </div>

                  {/* Day Footer Action */}
                  <div className="pt-1.5 border-t border-[#eff4ff] flex items-center justify-between text-[11px]">
                    <span className="text-[#76777d] text-[10px]">
                      {guardsOnDay.length} {guardsOnDay.length === 1 ? 'vigia' : 'vigias'}
                    </span>
                    <span className="font-bold text-[#006c49] group-hover:underline flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[14px]">edit</span>
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
                className="hidden lg:flex flex-col p-3 rounded-2xl border border-dashed border-[#dde9ff]/50 bg-[#f8f9ff]/40 min-h-[140px]"
              />
            ))}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: CARDS POR PRESTADOR */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filteredGuards.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center border border-[#dde9ff] space-y-3 col-span-full">
              <span className="material-symbols-outlined text-4xl text-[#76777d]">group_off</span>
              <p className="text-sm font-bold text-[#0d1c2f]">Nenhum colaborador encontrado</p>
            </div>
          )}

          {guardRows.map(({ guard, post, qHours, qAmount, isPaid, activeDaysList }) => {
            const hasHours = qHours > 0
            const isFolguista = guard.id === 'g-folguista' || guard.name.toLowerCase() === 'folguista'

            return (
              <div
                key={guard.id}
                className={`bg-white rounded-2xl p-4 shadow-xs border transition-all flex flex-col justify-between gap-3 ${
                  isFolguista ? 'border-amber-300 bg-amber-50/30' : 'border-[#dde9ff]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isFolguista ? 'bg-amber-200 text-amber-950 font-black' : 'bg-[#dde9ff] text-[#0d1c2f]'
                      }`}>
                        {isFolguista ? 'FOL' : guard.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#0d1c2f]">{guard.name}</h4>
                          {isFolguista && (
                            <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[9px] font-black uppercase">
                              Substituto
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[#76777d]">
                          {isFolguista ? 'Plantões de Substituição' : `📍 ${post?.name || 'Geral'}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="font-mono text-sm font-bold text-[#006c49]">{qHours}h</span>
                      <span className="font-mono text-xs font-bold text-[#0d1c2f]">
                        R$ {qAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#eff4ff] flex items-center justify-between text-xs text-[#76777d]">
                    <span>{activeDaysList.length} dias alocados no período</span>
                    <button
                      type="button"
                      onClick={() => handleOpenMultiDay(guard.id)}
                      className="px-2.5 py-1 rounded-lg bg-[#eff4ff] hover:bg-[#dde9ff] text-[#006c49] font-bold text-xs flex items-center gap-1 transition"
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
        <div className="bg-white rounded-3xl shadow-xs border border-[#dde9ff] overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b border-[#eff4ff]">
            <div>
              <h3 className="text-sm font-bold text-[#0d1c2f]">Grade Completa de Dias</h3>
              <p className="text-xs text-[#76777d]">Auditoria dia a dia de todos os colaboradores</p>
            </div>
            <span className="material-symbols-outlined text-[#76777d]">swap_horiz</span>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[#eff4ff] text-[#45464d] font-mono text-[10px] uppercase">
                  <th className="py-2.5 px-3 sticky left-0 bg-[#eff4ff] shadow-[1px_0_4px_rgba(0,0,0,0.05)] z-10">
                    Prestador
                  </th>
                  {displayedDays.map((d) => {
                    const weekday = getWeekday(year, month, d)
                    const holiday = getHoliday(year, month, d)
                    return (
                      <th
                        key={d}
                        onClick={() => handleOpenDayModal(d)}
                        className={`py-2 px-1 text-center min-w-[34px] cursor-pointer hover:bg-[#dde9ff] transition ${
                          holiday
                            ? 'bg-amber-100 text-amber-900 border-b-2 border-amber-400'
                            : weekday.isWeekend
                            ? 'bg-[#e5eeff] text-[#2c3e50]'
                            : ''
                        }`}
                        title={`Dia ${d} (${weekday.full}) - Clique para editar`}
                      >
                        <div>{String(d).padStart(2, '0')}</div>
                        <div className="text-[8px] opacity-75">{weekday.short}</div>
                      </th>
                    )
                  })}
                  <th className="py-2.5 px-2 text-center">Horas</th>
                  <th className="py-2.5 px-3 text-right">Total R$</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eff4ff]">
                {guardRows.map(({ guard, post, qHours, qAmount, guardShifts }) => (
                  <tr key={guard.id} className="hover:bg-[#f8f9ff] transition-colors">
                    <td className="py-2 px-3 font-semibold text-[#0d1c2f] sticky left-0 bg-white shadow-[1px_0_4px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[140px]">{guard.name}</span>
                        {post?.name && (
                          <span className="text-[9px] text-[#76777d]">({post.name.slice(0, 3)})</span>
                        )}
                      </div>
                    </td>

                    {displayedDays.map((d) => {
                      const h = guardShifts[d]
                      const hasVal = h !== undefined && h !== null
                      return (
                        <td
                          key={d}
                          onClick={() => handleOpenDayModal(d)}
                          className="py-1 px-1 text-center font-mono text-[11px] cursor-pointer hover:bg-emerald-50 transition"
                        >
                          {hasVal && Number(h) > 0 ? (
                            <span className="font-bold text-[#006c49] bg-emerald-50 px-1 py-0.5 rounded">
                              {h}h
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      )
                    })}

                    <td className="py-2 px-2 text-center font-mono font-bold text-[#006c49]">
                      {qHours}h
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-[#0d1c2f]">
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
        <div className="max-w-7xl mx-auto bg-[#131b2e] text-white rounded-2xl p-3.5 shadow-xl flex items-center justify-between gap-3 backdrop-blur-md border border-white/10 pointer-events-auto">
          <div className="flex flex-col min-w-0">
            <span className="font-mono text-[10px] text-[#bec6e0] flex items-center gap-1.5 font-semibold uppercase">
              <span className="inline-block w-2 h-2 rounded-full bg-[#6cf8bb]"></span>
              <span>{monthInfo.formattedMonth}</span>
              <span>•</span>
              <span className="text-[#6cf8bb]">{calendarRange === 'month' ? 'Mês Inteiro' : calendarRange === 'q1' ? '1ª Quinzena' : '2ª Quinzena'}</span>
              <span>({totalHours}h totais)</span>
            </span>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="font-mono text-xs font-bold text-[#6cf8bb]">
                ✓ Pago: R$ {paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </span>
              <span className="font-mono text-xs font-bold text-[#ffddb8]">
                ⏳ Pendente: R$ {pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenMultiDay(null)}
              className="h-9 px-3.5 rounded-xl bg-[#006c49] hover:bg-[#005236] text-white flex items-center gap-1 text-xs font-bold transition active:scale-95 shadow-sm cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-[#dde9ff] flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-[#131b2e] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#006c49] text-white flex items-center justify-center font-black font-mono text-base border border-[#6cf8bb]/40 shadow-xs">
                  {String(dayEditModal.day).padStart(2, '0')}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 flex-wrap">
                    <span>
                      Dia {dayEditModal.day} de {monthInfo.monthName} ({getWeekday(year, month, dayEditModal.day).full})
                    </span>
                    {getHoliday(year, month, dayEditModal.day) && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-bold text-[10px]">
                        🇧🇷 {getHoliday(year, month, dayEditModal.day).name}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-[#bec6e0] mt-0.5">
                    Adicione funcionários, troque quem está no dia ou lance um folguista
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDayEditModal({ isOpen: false, day: null })}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-4">
              {/* Quick Actions Row */}
              <div className="flex items-center gap-2.5">
                {/* 1-Click Folguista Button */}
                <button
                  type="button"
                  onClick={() => handleAddFolguistaToDay(dayEditModal.day)}
                  className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
                  title="Adiciona um substituto/folguista nesta data sem precisar saber o nome"
                >
                  <span className="material-symbols-outlined text-[20px]">person_pin</span>
                  <span>+ Preencher com Folguista (Substituto)</span>
                </button>
              </div>

              {/* Autocomplete Input (Start typing and it auto-completes) */}
              <div className="relative">
                <label className="text-xs font-bold text-[#0d1c2f] flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-[#006c49]">person_search</span>
                    <span>
                      {swappingGuardId
                        ? 'Selecione quem vai substituir este vigilante:'
                        : 'Adicionar funcionário (digite para autocompletar):'}
                    </span>
                  </span>
                  {swappingGuardId && (
                    <button
                      type="button"
                      onClick={() => setSwappingGuardId(null)}
                      className="text-[11px] text-red-600 font-bold hover:underline"
                    >
                      Cancelar troca
                    </button>
                  )}
                </label>

                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-[#76777d] text-[20px]">
                    search
                  </span>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={daySearchQuery}
                    onChange={(e) => setDaySearchQuery(e.target.value)}
                    placeholder="Digite o nome (ex: Carvalho, Gomes, Novaes, Folguista)..."
                    className="w-full h-12 pl-10 pr-10 bg-[#eff4ff] text-[#0d1c2f] rounded-2xl text-xs sm:text-sm font-semibold border border-[#dde9ff] focus:outline-none focus:border-[#006c49] focus:bg-white focus:shadow-xs transition"
                  />
                  {daySearchQuery && (
                    <button
                      type="button"
                      onClick={() => setDaySearchQuery('')}
                      className="absolute right-3 text-[#76777d] hover:text-[#0d1c2f] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  )}
                </div>

                {/* Floating Autocomplete Dropdown */}
                {daySearchQuery.trim().length > 0 && (
                  <div className="absolute top-full left-0 w-full mt-1.5 bg-white rounded-2xl shadow-2xl border border-[#dde9ff] z-30 max-h-56 overflow-y-auto p-1.5 space-y-1 animate-in fade-in">
                    {matchingGuards.length === 0 ? (
                      <div className="p-3 text-center text-xs text-[#76777d] italic">
                        Nenhum funcionário encontrado com "{daySearchQuery}".
                      </div>
                    ) : (
                      matchingGuards.map((g) => {
                        const post = posts.find((p) => p.id === g.postId)
                        const isFolguista = g.id === 'g-folguista' || g.name.toLowerCase() === 'folguista'
                        return (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => handleSelectGuardForDay(g, dayEditModal.day)}
                            className="w-full p-2.5 rounded-xl hover:bg-[#eff4ff] text-left flex items-center justify-between transition cursor-pointer group"
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                                  isFolguista
                                    ? 'bg-amber-200 text-amber-950 font-black'
                                    : 'bg-[#dde9ff] text-[#0d1c2f]'
                                }`}
                              >
                                {isFolguista ? 'FOL' : g.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <span className="text-xs font-bold text-[#0d1c2f] block group-hover:text-[#006c49]">
                                  {g.fullName || g.name}
                                </span>
                                <span className="text-[10px] text-[#76777d]">
                                  {isFolguista ? '🔄 Substituto Geral' : `📍 ${post?.name || 'Posto Geral'}`}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-[#006c49] bg-[#eff4ff] px-2 py-0.5 rounded-md">
                                +{g.defaultShiftHours || 3}h
                              </span>
                              <span className="material-symbols-outlined text-[18px] text-[#76777d] group-hover:text-[#006c49]">
                                add_circle
                              </span>
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Currently Scheduled Guards on this Day */}
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#0d1c2f] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#006c49] text-[18px]">group</span>
                    <span>Escalados para o Dia {dayEditModal.day} ({modalDayGuards.length})</span>
                  </h4>
                  <span className="font-mono text-xs font-bold text-[#006c49] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Total: {modalDayTotalHours}h
                  </span>
                </div>

                {modalDayGuards.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl border-2 border-dashed border-[#dde9ff] bg-[#f8f9ff] text-[#76777d] text-xs space-y-1">
                    <p className="font-semibold text-[#0d1c2f]">Ninguém escalado nesta data.</p>
                    <p className="text-[11px]">
                      Comece a digitar um nome acima ou clique em "+ Preencher com Folguista".
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {modalDayGuards.map(({ guard, hours, post, note, isFolguista }) => {
                      const isBeingSwapped = swappingGuardId === guard.id

                      return (
                        <div
                          key={guard.id}
                          className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                            isBeingSwapped
                              ? 'border-[#006c49] bg-emerald-50/50 shadow-sm'
                              : isFolguista
                              ? 'bg-amber-50/80 border-amber-300'
                              : 'bg-white border-[#dde9ff] shadow-xs'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                                isFolguista
                                  ? 'bg-amber-200 text-amber-950 font-black'
                                  : 'bg-[#eff4ff] text-[#006c49]'
                              }`}
                            >
                              {isFolguista ? 'FOL' : guard.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#0d1c2f]">
                                  {guard.fullName || guard.name}
                                </span>
                                {isFolguista && (
                                  <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[9px] font-black uppercase">
                                    Folguista
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-[#76777d]">
                                {isFolguista ? 'Substituto do plantão' : `📍 ${post?.name || 'Posto Geral'}`}
                                {note ? ` • 📝 ${note}` : ''}
                              </span>
                            </div>
                          </div>

                          {/* Hours Controls and Quick Actions */}
                          <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                            {/* Hours Increment/Decrement */}
                            <div className="flex items-center gap-1 bg-[#eff4ff] p-1 rounded-xl border border-[#dde9ff]">
                              <button
                                type="button"
                                onClick={() =>
                                  setShiftHours(guard.id, dayEditModal.day, Math.max(1, hours - 1), note)
                                }
                                className="w-6 h-6 rounded-lg bg-white text-[#0d1c2f] font-bold text-xs flex items-center justify-center hover:bg-[#dde9ff] cursor-pointer"
                                title="Diminuir 1h"
                              >
                                -
                              </button>
                              <span className="font-mono text-xs font-bold px-1.5 text-[#0d1c2f]">
                                {hours}h
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setShiftHours(guard.id, dayEditModal.day, hours + 1, note)
                                }
                                className="w-6 h-6 rounded-lg bg-white text-[#0d1c2f] font-bold text-xs flex items-center justify-center hover:bg-[#dde9ff] cursor-pointer"
                              >
                                +
                              </button>
                            </div>

                            {/* "Virou Folguista" button for regular guards */}
                            {!isFolguista && (
                              <button
                                type="button"
                                onClick={() => handleReplaceWithFolguista(guard.id, dayEditModal.day, hours)}
                                className="px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                                title="Substituir este vigilante por um Folguista"
                              >
                                <span className="material-symbols-outlined text-[15px]">swap_horiz</span>
                                <span>Virou Folguista</span>
                              </button>
                            )}

                            {/* "Trocar" button */}
                            <button
                              type="button"
                              onClick={() => {
                                setSwappingGuardId(guard.id)
                                setDaySearchQuery('')
                                searchInputRef.current?.focus()
                              }}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                                isBeingSwapped
                                  ? 'bg-[#006c49] text-white'
                                  : 'bg-[#eff4ff] hover:bg-[#dde9ff] text-[#0d1c2f]'
                              }`}
                              title="Trocar por outro funcionário"
                            >
                              <span className="material-symbols-outlined text-[15px]">sync_alt</span>
                              <span>{isBeingSwapped ? 'Trocando...' : 'Trocar'}</span>
                            </button>

                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={() => setShiftHours(guard.id, dayEditModal.day, null)}
                              className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition cursor-pointer"
                              title="Remover deste dia"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 bg-[#f8f9ff] border-t border-[#eff4ff] flex items-center justify-between">
              <span className="text-[11px] text-[#76777d]">
                ✓ Salvo automaticamente em tempo real
              </span>
              <button
                type="button"
                onClick={() => setDayEditModal({ isOpen: false, day: null })}
                className="px-5 py-2.5 rounded-xl bg-[#0d1c2f] hover:bg-[#1a2d47] text-white text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
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
    </div>
  )
}
