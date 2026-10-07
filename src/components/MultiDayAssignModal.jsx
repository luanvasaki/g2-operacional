import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { getHoliday } from '../utils/brazilianCalendar'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function MultiDayAssignModal({ isOpen, initialGuardId, onClose }) {
  const {
    selectedMonth,
    guards,
    posts,
    shifts,
    defaultHourlyRate,
    setMultiDayShifts,
  } = useApp()

  const activeGuards = guards.filter((g) => g.active)

  // Guard(s) selection
  const [targetGuardId, setTargetGuardId] = useState(
    initialGuardId || activeGuards[0]?.id || ''
  )
  const [isMultiGuardMode, setIsMultiGuardMode] = useState(false)
  const [selectedGuardIds, setSelectedGuardIds] = useState(
    initialGuardId ? [initialGuardId] : [activeGuards[0]?.id].filter(Boolean)
  )

  // Shift hours
  const currentGuard = activeGuards.find((g) => g.id === targetGuardId)
  const [hours, setHours] = useState(currentGuard?.defaultShiftHours || 3)

  // Selected Days
  const [selectedDays, setSelectedDays] = useState([])

  // Calculate days in month & weekday alignment
  const [yearStr, monthStr] = selectedMonth.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr) // 1-indexed
  const totalDays = new Date(year, month, 0).getDate()
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay() // 0 = Dom, 1 = Seg...

  // Reset or initialize when modal opens or target changes
  useEffect(() => {
    if (isOpen) {
      const gid = initialGuardId || activeGuards[0]?.id || ''
      setTargetGuardId(gid)
      setSelectedGuardIds([gid])
      const g = activeGuards.find((x) => x.id === gid)
      if (g) {
        setHours(g.defaultShiftHours || 3)
      }
      setSelectedDays([])
    }
  }, [isOpen, initialGuardId])

  if (!isOpen) return null

  // Month name in Portuguese
  const monthName = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  // Existing shifts for current single guard
  const existingShifts = shifts[selectedMonth]?.[targetGuardId] || {}

  // Toggle single day
  const toggleDay = (d) => {
    setSelectedDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b)
    )
  }

  // Preset Filters
  const selectAll = () => {
    setSelectedDays(Array.from({ length: totalDays }, (_, i) => i + 1))
  }

  const clearSelection = () => {
    setSelectedDays([])
  }

  const selectWeekdays = () => {
    const days = []
    for (let d = 1; d <= totalDays; d++) {
      const dayOfWeek = new Date(year, month - 1, d).getDay()
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        days.push(d)
      }
    }
    setSelectedDays(days)
  }

  const selectWeekends = () => {
    const days = []
    for (let d = 1; d <= totalDays; d++) {
      const dayOfWeek = new Date(year, month - 1, d).getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        days.push(d)
      }
    }
    setSelectedDays(days)
  }

  const selectEvenDays = () => {
    const days = []
    for (let d = 1; d <= totalDays; d++) {
      if (d % 2 === 0) days.push(d)
    }
    setSelectedDays(days)
  }

  const selectOddDays = () => {
    const days = []
    for (let d = 1; d <= totalDays; d++) {
      if (d % 2 !== 0) days.push(d)
    }
    setSelectedDays(days)
  }

  const selectQuinzena1 = () => {
    const days = []
    for (let d = 1; d <= 15; d++) days.push(d)
    setSelectedDays(days)
  }

  const selectQuinzena2 = () => {
    const days = []
    for (let d = 16; d <= totalDays; d++) days.push(d)
    setSelectedDays(days)
  }

  const holidaysInMonth = []
  for (let d = 1; d <= totalDays; d++) {
    if (getHoliday(year, month, d)) holidaysInMonth.push(d)
  }

  const selectHolidays = () => {
    setSelectedDays(holidaysInMonth)
  }

  // Multi-guard toggling
  const toggleGuardSelect = (gid) => {
    setSelectedGuardIds((prev) =>
      prev.includes(gid) ? prev.filter((id) => id !== gid) : [...prev, gid]
    )
  }

  const selectAllGuards = () => {
    setSelectedGuardIds(activeGuards.map((g) => g.id))
  }

  // Handle Save
  const handleSave = () => {
    if (selectedDays.length === 0) {
      alert('Selecione ao menos 1 dia no calendário para realizar o lançamento.')
      return
    }

    const targetIds = isMultiGuardMode
      ? selectedGuardIds
      : [targetGuardId].filter(Boolean)

    if (targetIds.length === 0) {
      alert('Selecione ao menos 1 colaborador.')
      return
    }

    setMultiDayShifts(targetIds, selectedDays, hours)
    onClose()
  }

  // Financial summary
  const guardsCount = isMultiGuardMode ? selectedGuardIds.length : 1
  const totalHoursCount = selectedDays.length * hours * guardsCount
  const totalEstimatedAmount = totalHoursCount * defaultHourlyRate

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0d1c2f]/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-[#dde9ff] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#eff4ff] flex items-center justify-between bg-[#131b2e] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#6cf8bb]/20 flex items-center justify-center text-[#6cf8bb] border border-[#6cf8bb]/30">
              <span className="material-symbols-outlined text-[22px]">calendar_add_on</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Lançar em Vários Dias</span>
                <span className="px-2 py-0.5 rounded-full bg-[#6cf8bb] text-[#002113] text-[10px] font-bold uppercase">
                  Agilidade
                </span>
              </h2>
              <p className="text-[11px] text-[#bec6e0] capitalize">
                {monthName} • R$ {defaultHourlyRate},00/h
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[#bec6e0] hover:text-white transition"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Section 1: Guard Selection */}
          <div className="bg-[#eff4ff]/60 p-3.5 rounded-2xl border border-[#dde9ff]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#0d1c2f] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[17px] text-[#006c49]">person</span>
                <span>Colaborador</span>
              </label>

              <button
                type="button"
                onClick={() => setIsMultiGuardMode(!isMultiGuardMode)}
                className="text-[11px] text-[#006c49] font-bold hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[15px]">
                  {isMultiGuardMode ? 'person' : 'group_add'}
                </span>
                <span>{isMultiGuardMode ? 'Modo 1 Colaborador' : 'Múltiplos Colaboradores'}</span>
              </button>
            </div>

            {!isMultiGuardMode ? (
              <select
                value={targetGuardId}
                onChange={(e) => {
                  setTargetGuardId(e.target.value)
                  const g = activeGuards.find((x) => x.id === e.target.value)
                  if (g) setHours(g.defaultShiftHours || 3)
                }}
                className="w-full bg-white text-[#0d1c2f] font-bold text-xs p-2.5 rounded-xl border border-[#dde9ff] focus:outline-none focus:ring-2 focus:ring-[#006c49]"
              >
                {activeGuards.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.defaultShiftHours || 3}h padrão)
                  </option>
                ))}
              </select>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#45464d] font-semibold">
                    {selectedGuardIds.length} selecionado(s) de {activeGuards.length}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllGuards}
                      className="text-[#006c49] font-bold hover:underline"
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedGuardIds([])}
                      className="text-[#76777d] font-bold hover:underline"
                    >
                      Nenhum
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-1 bg-white rounded-xl border border-[#dde9ff]">
                  {activeGuards.map((g) => {
                    const isChecked = selectedGuardIds.includes(g.id)
                    return (
                      <label
                        key={g.id}
                        className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer transition ${
                          isChecked
                            ? 'bg-[#6cf8bb]/20 text-[#006c49] font-bold border border-[#6cf8bb]/40'
                            : 'bg-white text-[#45464d] hover:bg-[#eff4ff]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleGuardSelect(g.id)}
                          className="rounded text-[#006c49] focus:ring-0"
                        />
                        <span className="truncate">{g.name}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Shift Hours */}
          <div>
            <label className="text-xs font-bold text-[#0d1c2f] flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[17px] text-[#006c49]">schedule</span>
                <span>Carga Horária nos Dias Selecionados</span>
              </span>
              <span className="font-mono text-xs text-[#006c49] font-bold bg-[#6cf8bb]/20 px-2 py-0.5 rounded-full">
                {hours} Horas / dia
              </span>
            </label>

            <div className="grid grid-cols-4 gap-2">
              {[
                { h: 3, label: '3 Horas', sub: 'Noturno' },
                { h: 4, label: '4 Horas', sub: 'Reforço' },
                { h: 7, label: '7 Horas', sub: 'Plantão' },
                { h: 0, label: '0h (Folga)', sub: 'Limpar' },
              ].map((opt) => (
                <button
                  key={opt.h}
                  type="button"
                  onClick={() => setHours(opt.h)}
                  className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center transition border ${
                    hours === opt.h
                      ? 'bg-[#131b2e] text-white border-[#131b2e] shadow-xs'
                      : 'bg-[#eff4ff] text-[#45464d] border-[#dde9ff] hover:bg-[#dde9ff]'
                  }`}
                >
                  <span className="font-bold text-xs">{opt.label}</span>
                  <span className="text-[9px] opacity-75 font-mono">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Quick Filter Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#0d1c2f] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[17px] text-[#006c49]">auto_awesome</span>
                <span>Atalhos de Seleção de Dias</span>
              </label>
              <span className="font-mono text-[10px] text-[#76777d]">1 Toque</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={selectWeekdays}
                className="px-2.5 py-1 text-[11px] font-semibold bg-[#eff4ff] hover:bg-[#dde9ff] text-[#0d1c2f] rounded-lg border border-[#dde9ff] transition"
              >
                💼 Seg a Sex
              </button>
              <button
                type="button"
                onClick={selectWeekends}
                className="px-2.5 py-1 text-[11px] font-semibold bg-[#eff4ff] hover:bg-[#dde9ff] text-[#0d1c2f] rounded-lg border border-[#dde9ff] transition"
              >
                🏖️ Sáb e Dom
              </button>
              <button
                type="button"
                onClick={selectEvenDays}
                className="px-2.5 py-1 text-[11px] font-semibold bg-[#eff4ff] hover:bg-[#dde9ff] text-[#0d1c2f] rounded-lg border border-[#dde9ff] transition"
              >
                🔢 Dias Pares
              </button>
              <button
                type="button"
                onClick={selectOddDays}
                className="px-2.5 py-1 text-[11px] font-semibold bg-[#eff4ff] hover:bg-[#dde9ff] text-[#0d1c2f] rounded-lg border border-[#dde9ff] transition"
              >
                🔢 Dias Ímpares
              </button>
              <button
                type="button"
                onClick={selectQuinzena1}
                className="px-2.5 py-1 text-[11px] font-semibold bg-[#eff4ff] hover:bg-[#dde9ff] text-[#0d1c2f] rounded-lg border border-[#dde9ff] transition"
              >
                1ª Quinzena (1-15)
              </button>
              <button
                type="button"
                onClick={selectQuinzena2}
                className="px-2.5 py-1 text-[11px] font-semibold bg-[#eff4ff] hover:bg-[#dde9ff] text-[#0d1c2f] rounded-lg border border-[#dde9ff] transition"
              >
                2ª Quinzena (16-{totalDays})
              </button>
              {holidaysInMonth.length > 0 && (
                <button
                  type="button"
                  onClick={selectHolidays}
                  className="px-2.5 py-1 text-[11px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg border border-amber-300 transition flex items-center gap-1"
                  title="Selecionar todos os feriados nacionais deste mês"
                >
                  <span>🇧🇷 Feriados</span>
                  <span className="font-mono text-[9px] bg-amber-200 px-1 rounded font-bold">
                    {holidaysInMonth.length}
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={selectAll}
                className="px-2.5 py-1 text-[11px] font-bold bg-[#6cf8bb]/30 hover:bg-[#6cf8bb]/50 text-[#006c49] rounded-lg border border-[#6cf8bb]/50 transition"
              >
                ✓ Todos ({totalDays})
              </button>
              {selectedDays.length > 0 && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-200 transition"
                >
                  ✕ Limpar
                </button>
              )}
            </div>
          </div>

          {/* Section 4: Calendar Grid */}
          <div className="bg-white rounded-2xl p-3.5 border border-[#dde9ff] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#0d1c2f]">
                Selecione ou clique nos dias desejados:
              </span>
              <span className="font-mono text-xs font-bold text-[#006c49]">
                {selectedDays.length} {selectedDays.length === 1 ? 'dia' : 'dias'} marcados
              </span>
            </div>

            {/* Weekday Labels (Brazilian standard: Dom..Sáb) */}
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] text-[#76777d] font-bold mb-1.5">
              {WEEKDAYS.map((w, idx) => (
                <div
                  key={w}
                  className={idx === 0 || idx === 6 ? 'text-[#ffb95f]' : 'text-[#76777d]'}
                >
                  {w}
                </div>
              ))}
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 gap-1">
              {/* Blank spacers for first day of week */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`spacer-${i}`} className="h-10 rounded-xl bg-transparent" />
              ))}

              {/* Days 1 to totalDays */}
              {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => {
                const isSelected = selectedDays.includes(d)
                const existingH = existingShifts[d]
                const hasExisting = existingH !== undefined && Number(existingH) > 0
                const dayOfWeek = new Date(year, month - 1, d).getDay()
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                const holiday = getHoliday(year, month, d)

                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    title={
                      holiday
                        ? `Dia ${d} (${WEEKDAYS[dayOfWeek]}) • 🇧🇷 Feriado Nacional: ${holiday.name}`
                        : `Dia ${d} (${WEEKDAYS[dayOfWeek]})`
                    }
                    className={`h-11 rounded-xl flex flex-col items-center justify-center relative transition-all active:scale-90 border ${
                      isSelected
                        ? 'bg-[#006c49] text-white border-[#006c49] shadow-sm font-bold scale-[1.02]'
                        : holiday
                        ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 font-bold'
                        : hasExisting
                        ? 'bg-[#eff4ff] text-[#0d1c2f] border-[#dde9ff] hover:border-[#006c49]'
                        : isWeekend
                        ? 'bg-[#fcfaff] text-[#45464d] border-[#dde9ff]/50 hover:bg-[#eff4ff]'
                        : 'bg-white text-[#45464d] border-[#dde9ff]/70 hover:bg-[#eff4ff]'
                    }`}
                  >
                    <div className="flex items-center gap-0.5">
                      <span className="text-xs leading-none font-bold">
                        {String(d).padStart(2, '0')}
                      </span>
                      {holiday && <span className="text-[8px] leading-none">🇧🇷</span>}
                    </div>

                    {/* Badge for existing or new status */}
                    <span
                      className={`text-[9px] font-mono leading-none mt-0.5 ${
                        isSelected
                          ? 'text-[#6cf8bb] font-bold'
                          : hasExisting
                          ? 'text-[#006c49] font-bold'
                          : 'text-transparent'
                      }`}
                    >
                      {isSelected ? `${hours}h` : hasExisting ? `${existingH}h` : '•'}
                    </span>

                    {/* Tiny Check indicator when selected */}
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#6cf8bb] text-[#002113] flex items-center justify-center text-[9px] font-black shadow-xs">
                        ✓
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Section 5: Dynamic Summary Card */}
          <div className="bg-[#131b2e] text-white p-3.5 rounded-2xl flex items-center justify-between border border-white/10 shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] text-[#bec6e0] font-mono uppercase">
                Resumo da Escala
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-bold text-sm text-white">
                  {selectedDays.length} {selectedDays.length === 1 ? 'dia' : 'dias'}
                </span>
                <span className="text-xs text-[#bec6e0]">× {hours}h</span>
                {isMultiGuardMode && (
                  <span className="text-xs text-[#bec6e0]">× {guardsCount} colab.</span>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-[#6cf8bb] font-mono uppercase font-bold">
                Impacto Calculado
              </span>
              <div className="font-mono text-xs font-bold text-white mt-0.5">
                {totalHoursCount}h • R${' '}
                {totalEstimatedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Sticky Footer */}
        <div className="p-4 border-t border-[#eff4ff] bg-white flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-[#dde9ff] text-[#45464d] font-bold text-xs hover:bg-[#eff4ff] transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={selectedDays.length === 0}
            className={`flex-2 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95 ${
              selectedDays.length > 0
                ? 'bg-[#006c49] hover:bg-[#005236] text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>
              {selectedDays.length > 0
                ? `Confirmar em ${selectedDays.length} ${
                    selectedDays.length === 1 ? 'Dia' : 'Dias'
                  }`
                : 'Selecione os dias'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
