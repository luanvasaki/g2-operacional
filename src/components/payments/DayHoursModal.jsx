import React from 'react'
import { useApp } from '../../context/AppContext'

/** Modal de ajuste rápido de horas / hora extra de um dia. */
export function DayHoursModal({ dayEditModal, setDayEditModal, rate }) {
  const { setShiftHours } = useApp()
  if (!dayEditModal) return null

  return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
        <div className="w-full max-w-sm bg-white rounded-3xl p-5 space-y-4 shadow-2xl border border-line">
          <div className="flex items-center justify-between border-b border-field pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center font-black">
                <span className="material-symbols-outlined text-[18px]">more_time</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink">
                  Ajustar Dia {dayEditModal.day}
                </h4>
                <span className="text-xs text-ink-muted">
                  {dayEditModal.guard.name}
                </span>
              </div>
            </div>
            <button
              onClick={() => setDayEditModal(null)}
              className="w-7 h-7 rounded-full bg-field flex items-center justify-center text-ink-soft hover:bg-line"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-ink block mb-1">
                Horas Trabalhadas:
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDayEditModal({ ...dayEditModal, hours: Math.max(0, dayEditModal.hours - 1) })}
                  className="w-10 h-10 rounded-xl bg-field text-ink font-bold text-lg flex items-center justify-center cursor-pointer"
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={dayEditModal.hours}
                  onChange={(e) => setDayEditModal({ ...dayEditModal, hours: Math.max(0, Number(e.target.value) || 0) })}
                  className="flex-1 h-10 bg-white border border-line rounded-xl text-center font-mono font-bold text-base outline-none focus:ring-1 focus:ring-brand"
                />
                <button
                  type="button"
                  onClick={() => setDayEditModal({ ...dayEditModal, hours: dayEditModal.hours + 1 })}
                  className="w-10 h-10 rounded-xl bg-brand text-white font-bold text-lg flex items-center justify-center cursor-pointer"
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
     ? 'bg-brand text-white border-brand'
     : 'bg-field text-ink-soft border-line hover:bg-line'
     }`}
                  >
                    {h === 0 ? '0h' : `${h}h`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-ink block mb-1">
                Motivo / Observação da Hora Extra (Opcional):
              </label>
              <input
                type="text"
                placeholder="Ex: Ficou até mais tarde, Dobra..."
                value={dayEditModal.note}
                onChange={(e) => setDayEditModal({ ...dayEditModal, note: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-page border border-line rounded-xl outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            {/* Subtotal preview */}
            <div className="p-2.5 bg-navy text-white rounded-xl flex items-center justify-between text-xs">
              <span className="text-on-navy">Total deste dia:</span>
              <span className="font-mono font-black text-mint">
                R$ {(dayEditModal.hours * rate).toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setDayEditModal(null)}
              className="w-1/3 py-2 rounded-xl bg-field text-ink-soft text-xs font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                setShiftHours(dayEditModal.guard.id, dayEditModal.day, dayEditModal.hours, dayEditModal.note)
                setDayEditModal(null)
              }}
              className="w-2/3 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow-md transition active:scale-95 cursor-pointer"
            >
              Salvar Horas
            </button>
          </div>
        </div>
      </div>
  )
}
