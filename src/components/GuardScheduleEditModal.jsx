import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { getHoliday, getWeekday } from '../utils/brazilianCalendar'

export function GuardScheduleEditModal({ guard, isOpen, onClose }) {
  const {
    selectedMonth,
    posts,
    shifts,
    defaultHourlyRate,
    setShiftHours,
    updateGuard,
    getShiftNote,
    getPaymentStatus,
    togglePaymentStatus,
  } = useApp()

  if (!isOpen || !guard) return null

  const post = posts.find((p) => p.id === guard.postId)
  const [yearStr, monthStr] = selectedMonth.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)
  const totalDays = new Date(year, month, 0).getDate()

  // State for rate and days
  const [rate, setRate] = useState(guard.hourlyRate || defaultHourlyRate || 40)
  const [daysHours, setDaysHours] = useState({})
  const [daysNotes, setDaysNotes] = useState({})
  const [activeQuinzenaFilter, setActiveQuinzenaFilter] = useState('all') // 'all', 'q1', 'q2'
  const [toastMsg, setToastMsg] = useState('')

  // Load existing shifts for this guard in selectedMonth
  useEffect(() => {
    const existing = shifts[selectedMonth]?.[guard.id] || {}
    const hoursMap = {}
    const notesMap = {}

    for (let d = 1; d <= totalDays; d++) {
      hoursMap[d] = existing[d] !== undefined && existing[d] !== null ? Number(existing[d]) : 0
      notesMap[d] = getShiftNote ? getShiftNote(guard.id, d) : ''
    }

    setDaysHours(hoursMap)
    setDaysNotes(notesMap)
    setRate(guard.hourlyRate || defaultHourlyRate || 40)
  }, [guard, selectedMonth, totalDays, shifts])

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 2500)
  }

  // Financial Calculations in real time
  let q1Hours = 0
  let q2Hours = 0

  for (let d = 1; d <= 15; d++) {
    q1Hours += Number(daysHours[d] || 0)
  }
  for (let d = 16; d <= totalDays; d++) {
    q2Hours += Number(daysHours[d] || 0)
  }

  const totalHours = q1Hours + q2Hours
  const numRate = Number(rate) || 40
  const q1Amount = q1Hours * numRate
  const q2Amount = q2Hours * numRate
  const totalAmount = totalHours * numRate

  // Stepper handlers
  const handleStepDay = (day, delta) => {
    const current = Number(daysHours[day] || 0)
    const next = Math.max(0, Math.min(24, current + delta))
    setDaysHours((prev) => ({ ...prev, [day]: next }))
  }

  const handleSetDayHours = (day, h) => {
    setDaysHours((prev) => ({ ...prev, [day]: h }))
  }

  const handleSetDayNote = (day, note) => {
    setDaysNotes((prev) => ({ ...prev, [day]: note }))
  }

  // Batch Presets for this guard
  const handleApplyPattern = (pattern) => {
    const next = { ...daysHours }
    for (let d = 1; d <= totalDays; d++) {
      if (pattern === 'even') {
        next[d] = d % 2 === 0 ? 3 : 0
      } else if (pattern === 'odd') {
        next[d] = d % 2 !== 0 ? 3 : 0
      } else if (pattern === 'all') {
        next[d] = 3
      } else if (pattern === 'clear') {
        next[d] = 0
      }
    }
    setDaysHours(next)
    showToast(
      pattern === 'clear'
        ? 'Todos os dias zerados!'
        : `Padrão ${pattern === 'even' ? 'dias pares' : pattern === 'odd' ? 'dias ímpares' : 'todos os dias'} aplicado (3h)!`
    )
  }

  // Payment statuses
  const statusQ1 = getPaymentStatus ? getPaymentStatus(guard.id, 'q1') : { status: 'PENDING' }
  const statusQ2 = getPaymentStatus ? getPaymentStatus(guard.id, 'q2') : { status: 'PENDING' }
  const isQ1Paid = statusQ1.status === 'PAID'
  const isQ2Paid = statusQ2.status === 'PAID'

  // Save all changes
  const handleSave = () => {
    // 1. Update hourly rate if changed
    if (Number(rate) !== guard.hourlyRate) {
      updateGuard(guard.id, { hourlyRate: Number(rate) })
    }

    // 2. Save each day to shifts & notes
    for (let d = 1; d <= totalDays; d++) {
      const h = Number(daysHours[d] || 0)
      const note = daysNotes[d] || ''
      setShiftHours(guard.id, d, h, note)
    }

    showToast('Escala e valores salvos com sucesso!')
    setTimeout(() => {
      onClose()
    }, 600)
  }

  // Save all hours and immediately settle payment for chosen quinzena
  const handleSaveAndPay = (qKey) => {
    // 1. Update hourly rate if changed
    if (Number(rate) !== guard.hourlyRate) {
      updateGuard(guard.id, { hourlyRate: Number(rate) })
    }

    // 2. Save each day to shifts & notes
    for (let d = 1; d <= totalDays; d++) {
      const h = Number(daysHours[d] || 0)
      const note = daysNotes[d] || ''
      setShiftHours(guard.id, d, h, note)
    }

    // 3. Mark as paid
    const cur = getPaymentStatus(guard.id, qKey)
    if (cur.status !== 'PAID') {
      togglePaymentStatus(guard.id, qKey)
    }

    const qLabel = qKey === 'q1' ? '1ª Quinzena' : '2ª Quinzena'
    const qVal = qKey === 'q1' ? q1Amount : q2Amount
    showToast(`Escala salva e ${qLabel} marcada como PAGA (R$ ${qVal.toFixed(2).replace('.', ',')})!`)
  }

  // Days list according to filter
  const displayedDays = []
  for (let d = 1; d <= totalDays; d++) {
    if (activeQuinzenaFilter === 'q1' && d > 15) continue
    if (activeQuinzenaFilter === 'q2' && d < 16) continue
    displayedDays.push(d)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0d1c2f]/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-[#dde9ff] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#eff4ff] flex items-center justify-between bg-[#131b2e] text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#006c49] flex items-center justify-center text-[#6cf8bb] shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[24px]">edit_calendar</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">
                  Editar Escala & Valores: {guard.name}
                </h2>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-[#6cf8bb]">
                  📍 {post?.name || 'Geral'}
                </span>
              </div>
              <p className="text-[11px] text-[#bec6e0]">
                Ajuste os plantões, horas trabalhadas e valor em reais (R$)
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Toast */}
          {toastMsg && (
            <div className="p-2.5 bg-[#006c49] text-white rounded-xl text-xs font-bold text-center animate-in fade-in shadow-md">
              {toastMsg}
            </div>
          )}

          {/* Section 1: Hourly Rate (Quantos Reais por Hora) */}
          <div className="p-3.5 bg-[#eff4ff] rounded-2xl border border-[#dde9ff] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-[#0d1c2f] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-[#006c49]">payments</span>
                <span>Valor da Hora deste Prestador (R$/hora)</span>
              </span>
              <p className="text-[11px] text-[#76777d]">
                Define quantos reais ele recebe por cada hora cumprida de plantão
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#76777d]">
                  R$
                </span>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-24 h-10 pl-9 pr-2 bg-white text-[#0d1c2f] font-mono font-bold text-sm rounded-xl border border-[#dde9ff] focus:outline-none focus:ring-2 focus:ring-[#006c49]"
                />
              </div>

              {/* Quick Rate Presets */}
              <div className="flex gap-1">
                {[35, 40, 45, 50].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRate(r)}
                    className={`px-2 py-1.5 rounded-lg font-mono text-xs font-bold transition border ${
                      Number(rate) === r
                        ? 'bg-[#006c49] text-white border-[#006c49]'
                        : 'bg-white text-[#45464d] border-[#dde9ff] hover:bg-[#dde9ff]'
                    }`}
                  >
                    R${r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Real-time Live Financial Summary */}
          <div className="grid grid-cols-3 gap-2 bg-[#131b2e] text-white p-3.5 rounded-2xl border border-white/10 shadow-sm">
            <div className="flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-[#bec6e0] font-semibold uppercase tracking-wider block">
                  1ª Quinzena (1 a 15)
                </span>
                <span className="font-mono text-sm font-bold text-white mt-0.5 block">
                  {q1Hours}h
                </span>
                <span className="font-mono text-xs font-bold text-[#6cf8bb] block">
                  R$ {q1Amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isQ1Paid) {
                    togglePaymentStatus(guard.id, 'q1')
                  } else {
                    handleSaveAndPay('q1')
                  }
                }}
                className={`mt-2 py-1 px-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 active:scale-95 cursor-pointer border ${
                  isQ1Paid
                    ? 'bg-[#006c49] text-white border-[#6cf8bb]'
                    : 'bg-[#6cf8bb] hover:bg-[#57e4a8] text-[#002113] border-transparent shadow-xs'
                }`}
                title={isQ1Paid ? 'Clique para estornar pagamento' : 'Salvar horas e marcar 1ª Quinzena como Paga'}
              >
                <span className="material-symbols-outlined text-[13px]">
                  {isQ1Paid ? 'check_circle' : 'payments'}
                </span>
                <span>{isQ1Paid ? '✓ PAGO' : 'Pagar 1ª Q'}</span>
              </button>
            </div>

            <div className="flex flex-col justify-between border-x border-white/10 px-2 sm:px-3">
              <div>
                <span className="text-[10px] text-[#bec6e0] font-semibold uppercase tracking-wider block">
                  2ª Quinzena (16 a {totalDays})
                </span>
                <span className="font-mono text-sm font-bold text-white mt-0.5 block">
                  {q2Hours}h
                </span>
                <span className="font-mono text-xs font-bold text-[#6cf8bb] block">
                  R$ {q2Amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isQ2Paid) {
                    togglePaymentStatus(guard.id, 'q2')
                  } else {
                    handleSaveAndPay('q2')
                  }
                }}
                className={`mt-2 py-1 px-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 active:scale-95 cursor-pointer border ${
                  isQ2Paid
                    ? 'bg-[#006c49] text-white border-[#6cf8bb]'
                    : 'bg-[#6cf8bb] hover:bg-[#57e4a8] text-[#002113] border-transparent shadow-xs'
                }`}
                title={isQ2Paid ? 'Clique para estornar pagamento' : 'Salvar horas e marcar 2ª Quinzena como Paga'}
              >
                <span className="material-symbols-outlined text-[13px]">
                  {isQ2Paid ? 'check_circle' : 'payments'}
                </span>
                <span>{isQ2Paid ? '✓ PAGO' : 'Pagar 2ª Q'}</span>
              </button>
            </div>

            <div className="flex flex-col justify-between text-right">
              <div>
                <span className="text-[10px] text-[#bec6e0] font-semibold uppercase tracking-wider block">
                  Total do Mês
                </span>
                <span className="font-mono text-sm font-black text-[#6cf8bb] mt-0.5 block">
                  {totalHours}h
                </span>
                <span className="font-mono text-sm font-black text-[#6cf8bb] block">
                  R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <span className="text-[9px] text-[#bec6e0] font-mono mt-2 block">
                {isQ1Paid && isQ2Paid ? '✓ Mês Quitado' : (isQ1Paid || isQ2Paid) ? '1 Quinzena Paga' : '⏳ Em Aberto'}
              </span>
            </div>
          </div>

          {/* Section 3: Pattern Fast Tools & Quinzena Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-[#eff4ff] p-1 rounded-xl border border-[#dde9ff] w-fit">
              {[
                { id: 'all', label: 'Mês Todo' },
                { id: 'q1', label: '1ª Quinzena' },
                { id: 'q2', label: '2ª Quinzena' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveQuinzenaFilter(f.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    activeQuinzenaFilter === f.id
                      ? 'bg-[#006c49] text-white shadow-xs'
                      : 'text-[#45464d] hover:bg-[#dde9ff]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Quick Automation Chips */}
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => handleApplyPattern('even')}
                className="px-2 py-1 rounded-lg bg-[#eff4ff] hover:bg-[#dde9ff] text-[#0d1c2f] font-bold text-[11px] border border-[#dde9ff]"
              >
                Pares (3h)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPattern('odd')}
                className="px-2 py-1 rounded-lg bg-[#eff4ff] hover:bg-[#dde9ff] text-[#0d1c2f] font-bold text-[11px] border border-[#dde9ff]"
              >
                Ímpares (3h)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPattern('all')}
                className="px-2 py-1 rounded-lg bg-[#eff4ff] hover:bg-[#dde9ff] text-[#006c49] font-bold text-[11px] border border-[#dde9ff]"
              >
                Todos 3h
              </button>
              <button
                type="button"
                onClick={() => handleApplyPattern('clear')}
                className="px-2 py-1 rounded-lg bg-[#eff4ff] hover:bg-red-50 text-red-600 font-bold text-[11px] border border-[#dde9ff]"
              >
                Zerar
              </button>
            </div>
          </div>

          {/* Section 4: Daily Shifts List (Quantas Horas e Quantos Reais em Cada Dia) */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {displayedDays.map((d) => {
              const h = Number(daysHours[d] || 0)
              const dayTotal = h * numRate
              const isOvertime = h > 3
              const note = daysNotes[d] || ''

              // Brazilian Weekday & Holiday
              const weekday = getWeekday(year, month, d)
              const holiday = getHoliday(year, month, d)

              return (
                <div
                  key={d}
                  className={`p-2.5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    holiday
                      ? 'bg-amber-50/80 border-amber-300'
                      : h > 0
                      ? isOvertime
                        ? 'bg-amber-50/60 border-amber-300'
                        : 'bg-white border-[#dde9ff]'
                      : 'bg-slate-50/80 border-slate-200 opacity-75'
                  }`}
                >
                  {/* Day Info */}
                  <div className="flex items-center gap-2.5 min-w-[130px] flex-wrap">
                    <span className="font-mono text-xs font-black text-[#0d1c2f]">
                      Dia {String(d).padStart(2, '0')}
                    </span>
                    <span className="font-mono text-[10px] text-[#76777d] uppercase font-bold">
                      ({weekday.short})
                    </span>

                    {holiday && (
                      <span
                        className="text-[9px] bg-amber-200 text-amber-900 border border-amber-300 font-extrabold px-1.5 py-0.2 rounded-full flex items-center gap-1"
                        title={`Feriado Nacional: ${holiday.name}`}
                      >
                        <span>🇧🇷</span>
                        <span className="truncate max-w-[120px]">{holiday.name}</span>
                      </span>
                    )}

                    {isOvertime && !holiday && (
                      <span className="text-[9px] bg-amber-200 text-amber-900 border border-amber-300 font-extrabold px-1.5 py-0.2 rounded-full">
                        ★ +{h - 3}h Extra
                      </span>
                    )}

                    {h === 0 && (
                      <span className="text-[10px] text-slate-400 font-medium italic">
                        Folga
                      </span>
                    )}
                  </div>

                  {/* Note / Justification Input */}
                  <div className="flex-1 max-w-xs">
                    <input
                      type="text"
                      placeholder="Motivo / Obs (ex: Dobra, Cobriu Silva)..."
                      value={note}
                      onChange={(e) => handleSetDayNote(d, e.target.value)}
                      className="w-full text-[11px] px-2.5 py-1 bg-white rounded-lg border border-[#dde9ff] text-[#0d1c2f] focus:outline-none focus:ring-1 focus:ring-[#006c49]"
                    />
                  </div>

                  {/* Stepper (- / +) and Quick Chips + Day Total */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                    {/* Stepper */}
                    <div className="flex items-center bg-[#eff4ff] border border-[#dde9ff] rounded-xl p-0.5 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => handleStepDay(d, -1)}
                        className="w-6 h-6 rounded-lg bg-white hover:bg-[#dde9ff] text-[#0d1c2f] font-black text-xs flex items-center justify-center transition active:scale-95 shadow-2xs"
                        title="Diminuir 1 hora (-1h)"
                      >
                        -
                      </button>

                      <span
                        className={`w-8 text-center font-mono text-xs font-black ${
                          h === 0
                            ? 'text-slate-400'
                            : isOvertime
                            ? 'text-amber-800'
                            : 'text-[#006c49]'
                        }`}
                      >
                        {h}h
                      </span>

                      <button
                        type="button"
                        onClick={() => handleStepDay(d, 1)}
                        className="w-6 h-6 rounded-lg bg-[#006c49] hover:bg-[#005236] text-white font-black text-xs flex items-center justify-center transition active:scale-95 shadow-2xs"
                        title="Aumentar 1 hora (+1h)"
                      >
                        +
                      </button>
                    </div>

                    {/* Quick Preset Chips */}
                    <div className="flex items-center gap-0.5">
                      {[0, 3, 4, 6].map((presetH) => (
                        <button
                          key={presetH}
                          type="button"
                          onClick={() => handleSetDayHours(d, presetH)}
                          className={`h-6 px-1.5 rounded-md font-mono text-[10px] font-bold transition ${
                            h === presetH
                              ? 'bg-[#006c49] text-white shadow-2xs'
                              : 'bg-[#eff4ff] text-[#45464d] hover:bg-[#dde9ff]'
                          }`}
                        >
                          {presetH === 0 ? '0h' : `${presetH}h`}
                        </button>
                      ))}
                    </div>

                    {/* Real-time Subtotal for this day */}
                    <div className="min-w-[65px] text-right font-mono text-xs font-bold text-[#006c49]">
                      {h > 0 ? `R$ ${dayTotal.toFixed(0)}` : 'R$ 0'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#eff4ff] bg-[#f8f9ff] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#76777d]">Total:</span>
            <strong className="text-[#0d1c2f] font-mono">{totalHours}h</strong>
            <span className="text-[#76777d]">•</span>
            <strong className="text-[#006c49] font-mono text-sm">
              R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#dde9ff] text-xs font-bold text-[#45464d] hover:bg-[#eff4ff] transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 bg-[#006c49] hover:bg-[#005236] text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition active:scale-98"
            >
              <span className="material-symbols-outlined text-[17px]">save</span>
              <span>Salvar Escala & Valores</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
