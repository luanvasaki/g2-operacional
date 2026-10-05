import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { MultiDayAssignModal } from './MultiDayAssignModal'
import { GuardScheduleEditModal } from './GuardScheduleEditModal'
import { WhatsAppIcon } from './icons/WhatsAppIcon'
import { getHoliday, getWeekday, getMonthInfo } from '../utils/brazilianCalendar'

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

  const [activeQuinzena, setActiveQuinzena] = useState(1) // 1 or 2
  const [viewMode, setViewMode] = useState('calendar') // 'calendar', 'cards' or 'table'
  const [fastEditModal, setFastEditModal] = useState(null) // { guard, day, hours }
  const [scheduleModalGuard, setScheduleModalGuard] = useState(null)
  const [multiDayModal, setMultiDayModal] = useState({ isOpen: false, guardId: null })

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
  const currentQuinzenaDays = activeQuinzena === 1 ? daysQ1 : daysQ2

  const activeGuards = guards.filter((g) => g.active)

  // Calculate totals for active quinzena
  const guardRows = activeGuards.map((guard) => {
    const post = posts.find((p) => p.id === guard.postId)
    const calc = getGuardCalculations(guard.id)
    const guardShifts = shifts[selectedMonth]?.[guard.id] || {}

    const qHours = activeQuinzena === 1 ? calc.q1Hours : calc.q2Hours
    const qAmount = activeQuinzena === 1 ? calc.q1Total : calc.q2Total

    // List of active days in this quinzena
    const activeDaysList = []
    currentQuinzenaDays.forEach((d) => {
      const h = guardShifts[d]
      if (h !== undefined && h !== null && Number(h) > 0) {
        activeDaysList.push(d)
      }
    })

    const qKey = activeQuinzena === 1 ? 'q1' : 'q2'
    const payment = getPaymentStatus(guard.id, qKey)
    const isPaid = payment.status === 'PAID'

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

  const totalHours = guardRows.reduce((acc, r) => acc + r.qHours, 0)
  const totalAmount = guardRows.reduce((acc, r) => acc + r.qAmount, 0)
  const paidAmount = guardRows.filter((r) => r.isPaid).reduce((acc, r) => acc + r.qAmount, 0)
  const pendingAmount = guardRows.filter((r) => !r.isPaid).reduce((acc, r) => acc + r.qAmount, 0)

  // Open shift & overtime edit sheet
  const handleOpenFastEdit = (guard, defaultDay) => {
    const targetG = guard || activeGuards[0]
    if (!targetG) return
    const day = defaultDay || currentQuinzenaDays[0] || 1
    const defaultH = targetG?.defaultShiftHours || 3
    const existingVal = shifts[selectedMonth]?.[targetG?.id]?.[day]
    const initialHours = existingVal !== undefined && existingVal !== null ? Number(existingVal) : defaultH
    const currentNote = getShiftNote ? getShiftNote(targetG?.id, day) : ''
    setFastEditModal({
      guard: targetG,
      day: day,
      hours: initialHours,
      note: currentNote || '',
    })
  }

  const handleSaveFastEdit = () => {
    if (fastEditModal && fastEditModal.guard) {
      setShiftHours(
        fastEditModal.guard.id,
        fastEditModal.day,
        fastEditModal.hours,
        fastEditModal.note
      )
      setFastEditModal(null)
    }
  }

  return (
    <div className="flex flex-col w-full pb-28 space-y-4 max-w-xl mx-auto">
      {/* Cycle Control & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#dde9ff] space-y-3">
        {/* Month and Rate Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 bg-[#eff4ff] px-3 py-1.5 rounded-xl border border-[#dde9ff]/60">
            <span className="material-symbols-outlined text-[18px] text-[#45464d]">
              calendar_today
            </span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-bold text-xs text-[#0d1c2f] outline-none cursor-pointer capitalize"
            >
              <option value="2026-08">Agosto 2026</option>
              <option value="2026-09">Setembro 2026</option>
              <option value="2026-10">Outubro 2026</option>
              <option value="2026-11">Novembro 2026</option>
              <option value="2026-12">Dezembro 2026</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#6cf8bb]/20 px-3 py-1.5 rounded-xl border border-[#6cf8bb]/30">
            <span className="font-mono text-xs text-[#00714d]">Hora Base:</span>
            <span className="font-mono text-xs text-[#00714d] font-bold">
              R$ {defaultHourlyRate.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>

        {/* Quinzena Toggle Pills */}
        <div className="grid grid-cols-2 gap-1 bg-[#eff4ff] p-1 rounded-xl">
          <button
            onClick={() => setActiveQuinzena(1)}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all ${
              activeQuinzena === 1
                ? 'bg-white text-[#0d1c2f] shadow-xs font-bold'
                : 'text-[#45464d] hover:text-[#0d1c2f]'
            }`}
          >
            <span className="text-xs font-bold">1ª Quinzena</span>
            <span className="font-mono text-[10px] text-[#76777d]">Dias 01 a 15</span>
          </button>

          <button
            onClick={() => setActiveQuinzena(2)}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all ${
              activeQuinzena === 2
                ? 'bg-white text-[#0d1c2f] shadow-xs font-bold'
                : 'text-[#45464d] hover:text-[#0d1c2f]'
            }`}
          >
            <span className="text-xs font-bold">2ª Quinzena</span>
            <span className="font-mono text-[10px] text-[#76777d]">
              Dias 16 a {totalDaysInMonth}
            </span>
          </button>
        </div>

        {/* Month Reference Banner */}
        <div className="flex items-center justify-between px-1 pt-1 text-xs">
          <span className="font-mono text-[11px] text-[#006c49] font-black uppercase flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px]">calendar_month</span>
            <span>Mês de Referência: <strong>{monthInfo.formattedMonth}</strong> ({activeQuinzena === 1 ? '1ª Quinzena' : '2ª Quinzena'})</span>
          </span>
          <span className="font-mono text-[10px] text-[#76777d]">
            {activeGuards.length} vigias ativos
          </span>
        </div>

        {/* Quinzena Summary Metrics Ribbon - Differentiating Paid vs To Pay */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="bg-[#eff4ff] p-2.5 rounded-xl flex flex-col border border-[#dde9ff]/60">
            <span className="font-mono text-[10px] text-[#45464d] uppercase font-bold">Carga Total</span>
            <span className="font-mono text-xs font-bold text-[#0d1c2f] mt-0.5">
              {totalHours}h ({activeGuards.length} vig.)
            </span>
          </div>

          <div className="bg-[#eff4ff] p-2.5 rounded-xl flex flex-col border border-[#dde9ff]/60">
            <span className="font-mono text-[10px] text-[#45464d] uppercase font-bold">Previsão Total</span>
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

      {/* Operational Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#0d1c2f]">Planilha de Escala</span>
          <span className="bg-[#dde9ff] text-[#0d1c2f] font-mono text-[10px] px-2 py-0.5 rounded-full font-bold">
            {activeGuards.length} Colaboradores
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => onOpenWhatsApp?.()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#006c49] font-bold text-xs border border-[#25D366]/30 transition active:scale-95 shadow-2xs"
            title="Importar escala colada do WhatsApp"
          >
            <WhatsAppIcon className="w-3.5 h-3.5 fill-[#25D366]" />
            <span>Colar WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenMultiDay(null)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#006c49] hover:bg-[#005236] text-white font-bold text-xs transition active:scale-95 shadow-xs"
            title="Lançar múltiplos dias na grade"
          >
            <span className="material-symbols-outlined text-[15px]">calendar_add_on</span>
            <span>Vários Dias</span>
          </button>

          {/* View Mode Toggle (Calendar vs Cards vs Table) */}
          <div className="flex items-center gap-0.5 bg-[#eff4ff] p-0.5 rounded-xl border border-[#dde9ff]">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === 'calendar'
                  ? 'bg-[#006c49] text-white shadow-xs'
                  : 'text-[#45464d] hover:text-[#0d1c2f]'
              }`}
              title="Visualização em Calendário"
            >
              <span className="material-symbols-outlined text-[17px]">calendar_month</span>
              <span className="hidden sm:inline">Calendário</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === 'cards'
                  ? 'bg-black text-white shadow-xs'
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
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                viewMode === 'table'
                  ? 'bg-black text-white shadow-xs'
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

      {/* VIEW MODE: Calendário Geral Quinzenal (Grade Visual de Fácil Leitura) */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-2xl shadow-xs border border-[#dde9ff] overflow-hidden p-3.5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#eff4ff]">
            <div>
              <h3 className="text-sm font-bold text-[#0d1c2f] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#006c49] text-[18px]">calendar_month</span>
                <span>Calendário Geral • {activeQuinzena === 1 ? '1ª Quinzena (Dias 01 a 15)' : `2ª Quinzena (Dias 16 a ${totalDaysInMonth})`}</span>
              </h3>
              <p className="text-xs text-[#76777d]">
                Visão unificada dos plantões do dia • Clique em qualquer dia para ver ou lançar
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-[#006c49] bg-[#6cf8bb]/20 px-2.5 py-1 rounded-xl">
              {monthInfo.formattedMonth}
            </span>
          </div>

          {/* Grid of days in this Quinzena */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {currentQuinzenaDays.map((d) => {
              const weekday = getWeekday(year, month, d)
              const holiday = getHoliday(year, month, d)
              const isWeekend = weekday.isWeekend

              // Who works today
              const guardsOnDay = activeGuards.filter((g) => {
                const h = shifts[selectedMonth]?.[g.id]?.[d]
                return h !== undefined && h !== null && Number(h) > 0
              }).map((g) => ({
                guard: g,
                hours: Number(shifts[selectedMonth]?.[g.id]?.[d]),
                post: posts.find((p) => p.id === g.postId),
                note: getShiftNote ? getShiftNote(g.id, d) : '',
              }))

              const totalDayHours = guardsOnDay.reduce((acc, curr) => acc + curr.hours, 0)

              return (
                <div
                  key={d}
                  className={`p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${
                    holiday
                      ? 'bg-amber-50/70 border-amber-300'
                      : isWeekend
                      ? 'bg-[#fcfaff] border-[#dde9ff]'
                      : 'bg-white border-[#dde9ff] hover:border-[#6cf8bb]'
                  }`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl font-mono flex items-center justify-center font-black text-xs ${
                        holiday
                          ? 'bg-amber-200 text-amber-900 border border-amber-300'
                          : isWeekend
                          ? 'bg-[#e5eeff] text-[#0d1c2f]'
                          : 'bg-[#eff4ff] text-[#006c49]'
                      }`}>
                        {String(d).padStart(2, '0')}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-[#0d1c2f] block leading-none capitalize">
                          {weekday.full}
                        </span>
                        {holiday && (
                          <span className="text-[10px] text-amber-900 font-bold flex items-center gap-0.5 mt-0.5" title={holiday.name}>
                            <span>🇧🇷</span>
                            <span className="truncate max-w-[130px]">{holiday.name}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="font-mono text-[11px] font-bold text-[#45464d]">
                      {guardsOnDay.length > 0 ? `${guardsOnDay.length} vig. (${totalDayHours}h)` : 'Sem plantão'}
                    </span>
                  </div>

                  {/* Scheduled Guards on this Day */}
                  <div className="space-y-1.5">
                    {guardsOnDay.map(({ guard, hours, post, note }) => {
                      const isOvertime = hours > (guard.defaultShiftHours || 3)
                      const displayName = guard.fullName || guard.name
                      return (
                        <div
                          key={guard.id}
                          onClick={() => handleOpenFastEdit(guard, d)}
                          className={`flex items-start justify-between p-2 rounded-xl text-xs font-semibold cursor-pointer transition active:scale-[0.98] border gap-2 ${
                            isOvertime
                              ? 'bg-amber-100/80 border-amber-300 text-amber-900 shadow-2xs'
                              : 'bg-[#eff4ff] hover:bg-[#dde9ff] text-[#0d1c2f] border-[#dde9ff]/80'
                          }`}
                          title={`Clique para editar horas de ${displayName} no dia ${d}`}
                        >
                          <div className="flex items-start gap-2 min-w-0 flex-1">
                            <span className="w-2 h-2 rounded-full bg-[#006c49] shrink-0 mt-1"></span>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="font-bold text-[#0d1c2f] leading-snug break-words">
                                {displayName}
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-[#76777d] font-normal leading-none mt-1">
                                {post?.name && (
                                  <span className="bg-white/80 border border-[#dde9ff] px-1.5 py-0.5 rounded text-[#45464d] font-medium">
                                    📍 {post.name}
                                  </span>
                                )}
                                {note && (
                                  <span className="bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                                    <span>📝</span>
                                    <span>{note}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end shrink-0 pl-1">
                            <span className="font-mono text-xs font-black text-[#006c49] bg-white px-2 py-0.5 rounded-lg border border-[#dde9ff] shadow-2xs">
                              {hours}h
                            </span>
                            {isOvertime && (
                              <span className="text-[10px] font-bold text-amber-800 mt-0.5">
                                ★ Extra
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {guardsOnDay.length === 0 && (
                      <div className="py-2 text-center text-xs text-[#76777d] italic bg-[#f8f9ff] rounded-xl border border-dashed border-[#dde9ff]">
                        Nenhum vigia escalado
                      </div>
                    )}
                  </div>

                  {/* Action on this day */}
                  <div className="flex items-center justify-end pt-1 border-t border-[#eff4ff]">
                    <button
                      type="button"
                      onClick={() => handleOpenFastEdit(activeGuards[0], d)}
                      className="text-[11px] font-bold text-[#006c49] hover:text-[#005236] flex items-center gap-0.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">add_circle</span>
                      <span>Lançar / Ajustar</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 1: Interactive Roster Cards (Stitch mobile cards) */}
      {viewMode === 'cards' && (
        <div className="flex flex-col space-y-2.5">
          {activeGuards.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center border border-[#dde9ff] space-y-3">
              <span className="material-symbols-outlined text-4xl text-[#76777d]">group_off</span>
              <p className="text-sm font-bold text-[#0d1c2f]">Nenhum prestador ativo encontrado</p>
              <p className="text-xs text-[#76777d]">Adicione novos prestadores na aba Equipe para lançar horas na escala.</p>
              <button
                type="button"
                onClick={onOpenNewGuardModal}
                className="px-4 py-2 bg-[#006c49] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#005236]"
              >
                Cadastrar Prestador
              </button>
            </div>
          )}

          {guardRows.map(({ guard, post, qHours, qAmount, isPaid, activeDaysList, guardShifts }) => {
            const hasHours = qHours > 0
            return (
              <div
                key={guard.id}
                className="bg-white rounded-2xl p-3.5 shadow-xs border border-[#dde9ff] hover:border-[#6cf8bb] transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-[#dde9ff] flex items-center justify-center text-[#0d1c2f] font-bold text-xs shrink-0">
                      {guard.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-[#0d1c2f] leading-snug break-words">
                          {guard.fullName || guard.name}
                        </h2>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#eff4ff] text-[#45464d] border border-[#dde9ff]/80">
                          📍 {post?.name || 'Posto'} • {guard.defaultShiftHours || 3}h
                        </span>
                      </div>
                      {/* Visual Day-by-Day Quinzena Grid */}
                      <div className="grid grid-cols-5 sm:grid-cols-8 gap-1 mt-2">
                        {currentQuinzenaDays.map((d) => {
                          const h = guardShifts[d]
                          const hasVal = h !== undefined && h !== null && Number(h) > 0
                          const isOvertime = Number(h) > (guard.defaultShiftHours || 3)
                          const note = getShiftNote ? getShiftNote(guard.id, d) : ''
                          const weekday = getWeekday(year, month, d)
                          const holiday = getHoliday(year, month, d)

                          return (
                            <button
                              key={d}
                              type="button"
                              onClick={() => handleOpenFastEdit(guard, d)}
                              title={
                                holiday
                                  ? `Dia ${d} (${weekday.short}) - 🇧🇷 Feriado Nacional: ${holiday.name} • ${hasVal ? `${h}h` : 'Folga'}${note ? ` (${note})` : ''}`
                                  : note
                                  ? `Dia ${d} (${weekday.short}): ${hasVal ? `${h}h` : 'Folga'} (${note})`
                                  : `Dia ${d} (${weekday.short}): ${hasVal ? `${h}h` : 'Folga'}`
                              }
                              className={`p-1 rounded-xl text-center font-mono flex flex-col items-center justify-center transition active:scale-95 cursor-pointer border ${
                                holiday
                                  ? 'bg-amber-100/90 text-amber-900 border-amber-300'
                                  : isOvertime
                                  ? 'bg-[#ffb95f]/30 text-[#854d0e] border-[#ffb95f]'
                                  : hasVal
                                  ? 'bg-[#006c49]/10 text-[#006c49] border-[#006c49]/30 font-bold'
                                  : 'bg-[#f8f9ff] text-[#76777d] border-transparent hover:border-[#dde9ff]'
                              }`}
                            >
                              <span className="text-[9px] text-[#76777d] uppercase font-sans font-bold leading-none">
                                {weekday.short}
                              </span>
                              <span className="text-xs font-black leading-tight mt-0.5">
                                {String(d).padStart(2, '0')}
                              </span>
                              <span className={`text-[10px] font-black leading-none mt-0.5 ${hasVal ? (isOvertime ? 'text-[#b45309]' : 'text-[#006c49]') : 'text-slate-300'}`}>
                                {hasVal ? `${h}h` : '-'}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="font-mono text-xs text-[#76777d] block font-semibold">
                      {qHours}h
                    </span>
                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                        isPaid
                          ? 'bg-[#6cf8bb]/20 text-[#00714d] border border-[#6cf8bb]/40'
                          : hasHours
                          ? 'bg-[#ffddb8] text-[#2a1700]'
                          : 'bg-[#eff4ff] text-[#76777d]'
                      }`}
                    >
                      {isPaid ? '✓ Pago: ' : 'A Pagar: '}R$ {qAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({monthInfo.monthName.slice(0, 3)}/{year})
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        togglePaymentStatus(guard.id, activeQuinzena === 1 ? 'q1' : 'q2')
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition active:scale-95 shadow-xs ${
                        isPaid
                          ? 'bg-[#006c49] text-white border border-[#6cf8bb] hover:bg-[#005236]'
                          : 'bg-[#006c49] hover:bg-[#005236] text-white'
                      }`}
                      title={isPaid ? `Pagamento de ${guard.name} marcado como PAGO. Clique novamente para retirar o pagamento e reabrir.` : `Clique para pagar ${guard.name} (${monthInfo.formattedMonth})`}
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        {isPaid ? 'check_circle' : 'payments'}
                      </span>
                      <span>{isPaid ? '✓ Pago' : 'Pagar'}</span>
                    </button>
                  </div>
                </div>

                {/* Mini tracker & fast launch buttons */}
                <div className="mt-3 pt-2.5 border-t border-[#eff4ff] flex items-center justify-between text-xs text-[#76777d]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#006c49]"></span>
                    <span>{activeDaysList.length} dias alocados</span>
                  </span>

                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <button
                      type="button"
                      onClick={() => setScheduleModalGuard(guard)}
                      className="bg-[#eff4ff] hover:bg-[#dde9ff] text-[#006c49] border border-[#dde9ff] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 text-xs transition active:scale-95 cursor-pointer shadow-2xs"
                      title="Editar a escala completa deste prestador"
                    >
                      <span className="material-symbols-outlined text-[15px]">edit_calendar</span>
                      <span>Editar Escala</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenMultiDay(guard.id)}
                      className="bg-[#006c49] hover:bg-[#005236] text-white px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 text-xs transition active:scale-95 shadow-xs cursor-pointer"
                      title="Lançar múltiplos dias para este segurança"
                    >
                      <span className="material-symbols-outlined text-[15px]">calendar_add_on</span>
                      <span>Vários Dias</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenFastEdit(guard)}
                      className="bg-[#eff4ff] hover:bg-[#dde9ff] text-[#0d1c2f] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 text-xs transition active:scale-95 border border-[#dde9ff] cursor-pointer"
                      title="Ajustar horas ou lançar hora extra para qualquer dia"
                    >
                      <span className="material-symbols-outlined text-[15px] text-[#006c49]">more_time</span>
                      <span>Ajustar / Extra</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* VIEW MODE 2: Horizontal Scrollable Spreadsheet Table */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl shadow-xs border border-[#dde9ff] overflow-hidden">
          <div className="p-3.5 flex items-center justify-between border-b border-[#eff4ff]">
            <div>
              <h3 className="text-sm font-bold text-[#0d1c2f]">Grade Completa de Dias</h3>
              <p className="text-xs text-[#76777d]">
                Deslize horizontalmente para auditar cada dia
              </p>
            </div>
            <span className="material-symbols-outlined text-[#76777d]">swap_horiz</span>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-[#eff4ff] text-[#45464d] font-mono text-[10px] uppercase">
                  <th className="py-2.5 px-3 sticky left-0 bg-[#eff4ff] shadow-[1px_0_4px_rgba(0,0,0,0.05)] z-10">
                    Prestador
                  </th>
                  {currentQuinzenaDays.map((d) => {
                    const weekday = getWeekday(year, month, d)
                    const holiday = getHoliday(year, month, d)
                    return (
                      <th
                        key={d}
                        className={`py-2 px-1 text-center min-w-[34px] transition ${
                          holiday
                            ? 'bg-amber-100 text-amber-900 border-b-2 border-amber-400'
                            : weekday.isWeekend
                            ? 'bg-[#e5eeff] text-[#2c3e50]'
                            : ''
                        }`}
                        title={
                          holiday
                            ? `Dia ${d} (${weekday.full}) • 🇧🇷 Feriado Nacional: ${holiday.name}`
                            : `Dia ${d} (${weekday.full})`
                        }
                      >
                        <div className="flex flex-col items-center">
                          <span className="font-mono text-xs font-bold leading-none">
                            {String(d).padStart(2, '0')}
                          </span>
                          <span className="text-[9px] uppercase font-sans leading-none mt-0.5">
                            {weekday.short}
                          </span>
                          {holiday && (
                            <span className="text-[8px] leading-none mt-0.5">🇧🇷</span>
                          )}
                        </div>
                      </th>
                    )
                  })}
                  <th className="py-2.5 px-2 text-center font-bold">Total Horas</th>
                  <th className="py-2.5 px-3 text-right font-bold bg-[#ffddb8]/50 text-[#2a1700]">
                    Total a Pagar ({monthInfo.monthName.slice(0, 3)}/{year})
                  </th>
                  <th className="py-2.5 px-2 text-center font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eff4ff] text-[#0d1c2f] font-mono text-xs">
                {guardRows.map(({ guard, qHours, qAmount, isPaid, guardShifts }) => (
                  <tr key={guard.id} className="hover:bg-[#f8f9ff]">
                    <td className="py-2 px-3 font-sans font-bold sticky left-0 bg-white shadow-[1px_0_4px_rgba(0,0,0,0.05)] z-10 whitespace-nowrap">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="leading-snug break-words max-w-[180px] sm:max-w-none">
                          {guard.fullName || guard.name}
                        </span>
                        <button
                          onClick={() => handleOpenMultiDay(guard.id)}
                          className="text-[#006c49] hover:bg-[#6cf8bb]/30 p-1 rounded transition"
                          title="Lançar em vários dias"
                        >
                          <span className="material-symbols-outlined text-[15px]">calendar_add_on</span>
                        </button>
                      </div>
                    </td>

                    {currentQuinzenaDays.map((d) => {
                      const h = guardShifts[d]
                      const hasVal = h !== undefined && h !== null && h !== ''
                      const isZero = Number(h) === 0
                      const isOvertime = Number(h) > (guard.defaultShiftHours || 3)
                      const note = getShiftNote ? getShiftNote(guard.id, d) : ''
                      return (
                        <td
                          key={d}
                          onClick={() => handleOpenFastEdit(guard, d)}
                          className={`py-2 px-1 text-center cursor-pointer font-bold hover:bg-[#6cf8bb]/30 transition ${
                            hasVal
                              ? isZero
                                ? 'text-slate-400'
                                : isOvertime
                                ? 'bg-[#ffb95f]/30 text-[#854d0e] font-black'
                                : 'text-[#006c49] font-extrabold'
                              : 'text-slate-300'
                          }`}
                          title={
                            note
                              ? `Dia ${d}: ${h}h (${note}) - Clique para ajustar`
                              : isOvertime
                              ? `Dia ${d}: ${h}h (Hora Extra) - Clique para ajustar`
                              : `Dia ${d}: ${hasVal ? `${h}h` : 'Folga'} - Clique para ajustar`
                          }
                        >
                          <div className="flex items-center justify-center gap-0.5">
                            <span>{hasVal ? (isZero ? '0' : `${h}h`) : '-'}</span>
                            {isOvertime && <span className="text-[9px] text-[#b45309]">★</span>}
                          </div>
                        </td>
                      )
                    })}

                    <td className="py-2 px-2 text-center font-bold">{qHours}h</td>
                    <td className="py-2 px-3 text-right font-bold text-[#2a1700] bg-[#ffddb8]/30 whitespace-nowrap">
                      R$ {qAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-2 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => togglePaymentStatus(guard.id, activeQuinzena === 1 ? 'q1' : 'q2')}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl font-bold text-xs transition active:scale-95 shadow-xs ${
                          isPaid
                            ? 'bg-[#006c49] text-white border border-[#6cf8bb] hover:bg-[#005236]'
                            : 'bg-[#006c49] hover:bg-[#005236] text-white'
                        }`}
                        title={isPaid ? `Pagamento marcado como PAGO. Clique novamente para retirar o pagamento e reabrir.` : `Clique para pagar (${monthInfo.monthName.slice(0, 3)}/${year})`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {isPaid ? 'check_circle' : 'payments'}
                        </span>
                        <span>{isPaid ? '✓ Pago' : 'Pagar'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Realtime Tactical Bottom Bar (Total & Quick Dispatch) */}
      <div className="fixed bottom-16 left-0 w-full px-4 z-30">
        <div className="max-w-xl mx-auto bg-[#131b2e] text-white rounded-2xl p-3.5 shadow-xl flex items-center justify-between gap-2 backdrop-blur-md border border-white/10">
          <div className="flex flex-col min-w-0">
            <span className="font-mono text-[10px] text-[#bec6e0] flex items-center gap-1 font-semibold uppercase">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#6cf8bb]"></span>
              Folha de {monthInfo.formattedMonth} • {activeQuinzena === 1 ? '1ª Quinzena' : '2ª Quinzena'} ({totalHours}h)
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-xs font-bold text-[#6cf8bb]" title="Total já liquidado">
                ✓ Pago: R$ {paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </span>
              <span className="text-white/30">•</span>
              <span className="font-mono text-xs font-bold text-[#ffddb8]" title="Total ainda a pagar">
                ⏳ A Pagar: R$ {pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={exportBackupJSON}
              className="h-9 px-3 rounded-xl bg-white/15 hover:bg-white/20 text-white flex items-center gap-1 text-xs font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">ios_share</span>
              <span className="hidden sm:inline">Exportar</span>
            </button>
            <button
              onClick={() => handleOpenFastEdit(activeGuards[0])}
              className="h-9 px-3.5 rounded-xl bg-[#006c49] hover:bg-[#005236] text-white flex items-center gap-1 text-xs font-bold transition-transform active:scale-95 shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>Lançar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Ajustar Plantão & Horas Extras (Overtime & Dobra) */}
      {fastEditModal && (() => {
        const guardDefaultHours = fastEditModal.guard.defaultShiftHours || 3
        const isOvertime = fastEditModal.hours > guardDefaultHours
        const extraHours = isOvertime ? fastEditModal.hours - guardDefaultHours : 0
        const guardRate = fastEditModal.guard.hourlyRate || defaultHourlyRate
        const totalDayAmount = fastEditModal.hours * guardRate
        const extraAmount = extraHours * guardRate
        const guardPost = posts.find((p) => p.id === fastEditModal.guard.postId)

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
            <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-5 space-y-4 animate-in slide-in-from-bottom duration-200 border border-[#dde9ff] shadow-2xl max-h-[92vh] overflow-y-auto">
              {/* Grabber handle */}
              <div className="w-12 h-1.5 bg-[#dde9ff] rounded-full mx-auto mb-1 sm:hidden"></div>

              <div className="flex items-center justify-between border-b border-[#eff4ff] pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#ffb95f]/30 flex items-center justify-center text-[#854d0e] font-black">
                    <span className="material-symbols-outlined text-[22px]">more_time</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0d1c2f] flex items-center gap-1.5">
                      <span>Ajustar Plantão: {fastEditModal.guard.name}</span>
                      {isOvertime && (
                        <span className="px-1.5 py-0.5 rounded bg-[#ffb95f] text-[#422006] text-[10px] font-black uppercase">
                          Hora Extra
                        </span>
                      )}
                    </h4>
                    <span className="text-xs text-[#76777d]">
                      Posto {guardPost?.name || 'Geral'} • Carga Padrão: {guardDefaultHours}h
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setFastEditModal(null)}
                  className="w-8 h-8 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#45464d] hover:bg-[#dde9ff] transition"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <div className="space-y-3.5">
                {/* Guard Selector */}
                {activeGuards.length > 1 && (
                  <div>
                    <label className="text-xs font-bold text-[#0d1c2f] block mb-1">
                      Prestador / Vigia:
                    </label>
                    <select
                      value={fastEditModal.guard.id}
                      onChange={(e) => {
                        const selectedG = activeGuards.find((g) => g.id === e.target.value) || fastEditModal.guard
                        const defH = selectedG.defaultShiftHours || 3
                        const dayVal = shifts[selectedMonth]?.[selectedG.id]?.[fastEditModal.day]
                        const h = dayVal !== undefined && dayVal !== null ? Number(dayVal) : defH
                        const n = getShiftNote ? getShiftNote(selectedG.id, fastEditModal.day) : ''
                        setFastEditModal({
                          ...fastEditModal,
                          guard: selectedG,
                          hours: h,
                          note: n,
                        })
                      }}
                      className="w-full h-10 px-3 text-xs bg-[#eff4ff] text-[#0d1c2f] rounded-xl border border-[#dde9ff] font-bold focus:outline-none focus:ring-1 focus:ring-[#006c49] cursor-pointer"
                    >
                      {activeGuards.map((g) => {
                        const p = posts.find((item) => item.id === g.postId)
                        return (
                          <option key={g.id} value={g.id}>
                            {g.name} — {p?.name || 'Posto'} ({g.defaultShiftHours || 3}h/plantão)
                          </option>
                        )
                      })}
                    </select>
                  </div>
                )}

                {/* Day Picker */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#0d1c2f]">
                      Dia do Mês Selecionado:
                    </label>
                    <span className="font-mono text-xs font-bold text-[#006c49] bg-[#6cf8bb]/20 px-2 py-0.5 rounded-full">
                      Dia {String(fastEditModal.day).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 sm:grid-cols-8 gap-1 max-h-28 overflow-y-auto p-1.5 bg-[#eff4ff] rounded-xl border border-[#dde9ff]/60">
                    {currentQuinzenaDays.map((d) => {
                      const dayH = shifts[selectedMonth]?.[fastEditModal.guard.id]?.[d]
                      const hasHours = dayH !== undefined && Number(dayH) > 0
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            const existingVal = shifts[selectedMonth]?.[fastEditModal.guard.id]?.[d]
                            const newH = existingVal !== undefined && existingVal !== null ? Number(existingVal) : guardDefaultHours
                            const newNote = getShiftNote ? getShiftNote(fastEditModal.guard.id, d) : ''
                            setFastEditModal({
                              ...fastEditModal,
                              day: d,
                              hours: Number(newH),
                              note: newNote || '',
                            })
                          }}
                          className={`py-1.5 rounded-lg text-center font-mono text-xs font-bold transition flex flex-col items-center justify-center ${
                            fastEditModal.day === d
                              ? 'bg-[#006c49] text-white shadow-xs'
                              : hasHours
                              ? 'bg-white text-[#0d1c2f] hover:bg-[#dde9ff]'
                              : 'bg-white/60 text-[#76777d] hover:bg-white'
                          }`}
                        >
                          <span>{String(d).padStart(2, '0')}</span>
                          {hasHours && (
                            <span className={`text-[9px] ${fastEditModal.day === d ? 'text-[#6cf8bb]' : 'text-[#006c49]'}`}>
                              {dayH}h
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Overtime Quick Add Buttons (Trabalhou a mais) */}
                <div className="p-3 bg-[#fffbeb] rounded-2xl border border-[#fef3c7] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#92400e] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[17px]">hourglass_top</span>
                      <span>Ficou trabalhando a mais? Adicione Horas Extras:</span>
                    </span>
                    <span className="text-[10px] text-[#b45309] font-mono font-bold">1 Clique</span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: '+1h Extra', extra: 1 },
                      { label: '+2h Extras', extra: 2 },
                      { label: '+3h Extras', extra: 3 },
                      { label: '+4h Dobra', extra: 4 },
                    ].map((btn) => (
                      <button
                        key={btn.extra}
                        type="button"
                        onClick={() =>
                          setFastEditModal({
                            ...fastEditModal,
                            hours: guardDefaultHours + btn.extra,
                          })
                        }
                        className="py-1.5 px-1 bg-white hover:bg-amber-100 text-[#78350f] border border-amber-300 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition text-center"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stepper & Exact Hours Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#0d1c2f]">
                      Total de Horas Trabalhadas no Dia:
                    </label>
                    {isOvertime ? (
                      <span className="font-mono text-xs font-bold text-[#b45309] bg-[#ffb95f]/30 px-2 py-0.5 rounded-full">
                        🔥 +{extraHours}h além da escala normal
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-[#006c49] font-bold">
                        Carga Normal ({guardDefaultHours}h)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFastEditModal({
                          ...fastEditModal,
                          hours: Math.max(0, fastEditModal.hours - 1),
                        })
                      }
                      className="w-12 h-12 rounded-2xl bg-[#eff4ff] hover:bg-[#dde9ff] text-[#0d1c2f] font-bold text-lg flex items-center justify-center transition active:scale-90 border border-[#dde9ff]"
                    >
                      -
                    </button>

                    <div className="flex-1 h-12 bg-white rounded-2xl border-2 border-[#006c49] flex items-center justify-center font-mono font-black text-xl text-[#0d1c2f] shadow-xs">
                      <input
                        type="number"
                        min="0"
                        max="24"
                        value={fastEditModal.hours}
                        onChange={(e) =>
                          setFastEditModal({
                            ...fastEditModal,
                            hours: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="w-full text-center bg-transparent outline-none font-bold text-lg"
                      />
                      <span className="pr-3 text-xs text-[#76777d] font-normal font-sans">horas</span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setFastEditModal({
                          ...fastEditModal,
                          hours: fastEditModal.hours + 1,
                        })
                      }
                      className="w-12 h-12 rounded-2xl bg-[#006c49] hover:bg-[#005236] text-white font-bold text-lg flex items-center justify-center transition active:scale-90 shadow-xs"
                    >
                      +
                    </button>
                  </div>

                  {/* Preset Pills */}
                  <div className="grid grid-cols-6 gap-1 mt-2">
                    {[0, 3, 4, 6, 7, 12].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setFastEditModal({ ...fastEditModal, hours: h })}
                        className={`py-1 rounded-lg text-xs font-mono font-bold transition border ${
                          fastEditModal.hours === h
                            ? 'bg-[#131b2e] text-white border-[#131b2e]'
                            : 'bg-[#eff4ff] text-[#45464d] border-[#dde9ff] hover:bg-[#dde9ff]'
                        }`}
                      >
                        {h === 0 ? 'Folga' : `${h}h`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Motivo / Justificativa da Hora Extra */}
                <div>
                  <label className="text-xs font-bold text-[#0d1c2f] block mb-1">
                    Motivo / Observação do Ajuste (Opcional):
                  </label>
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {['Dobra de Plantão', 'Cobriu Falta', 'Ficou até Fechar', 'Reforço Portaria'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() =>
                          setFastEditModal({
                            ...fastEditModal,
                            note: fastEditModal.note ? `${fastEditModal.note} • ${tag}` : tag,
                          })
                        }
                        className="text-[10px] font-semibold bg-[#eff4ff] hover:bg-[#dde9ff] text-[#0d1c2f] px-2 py-0.5 rounded-lg border border-[#dde9ff] transition"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={fastEditModal.note || ''}
                    onChange={(e) =>
                      setFastEditModal({ ...fastEditModal, note: e.target.value })
                    }
                    placeholder="Ex: Ficou 2h a mais fechando a loja..."
                    className="w-full h-10 px-3 text-xs bg-[#f8f9ff] text-[#0d1c2f] rounded-xl border border-[#dde9ff] focus:outline-none focus:ring-1 focus:ring-[#006c49]"
                  />
                </div>

                {/* Demonstrativo Financeiro da Diária */}
                <div className="bg-[#131b2e] text-white p-3 rounded-2xl flex items-center justify-between border border-white/10 shadow-sm">
                  <div>
                    <span className="text-[10px] text-[#bec6e0] font-mono uppercase">
                      Diária do Dia {fastEditModal.day}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-white font-bold mt-0.5">
                      <span>{fastEditModal.hours} horas</span>
                      <span className="text-[#bec6e0] font-normal">× R$ {guardRate},00/h</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-base font-black text-[#6cf8bb]">
                      R$ {totalDayAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    {isOvertime && (
                      <span className="block text-[10px] font-mono text-[#ffb95f]">
                        (+ R$ {extraAmount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} extras)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setFastEditModal(null)}
                  className="w-1/3 py-2.5 rounded-xl bg-[#eff4ff] text-[#45464d] text-xs font-semibold hover:bg-[#dde9ff] transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveFastEdit}
                  className="w-2/3 py-2.5 rounded-xl bg-[#006c49] hover:bg-[#005236] text-white text-xs font-bold shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>Salvar Ajuste do Dia {fastEditModal.day}</span>
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Multi-Day Bulk Assignment Modal */}
      <MultiDayAssignModal
        isOpen={multiDayModal.isOpen}
        initialGuardId={multiDayModal.guardId}
        onClose={() => setMultiDayModal({ isOpen: false, guardId: null })}
      />

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
