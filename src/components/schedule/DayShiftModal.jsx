import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { getHoliday, getWeekday } from '../../utils/brazilianCalendar'

/** Modal "Gerenciar plantão do dia": quem trabalha, busca rápida, folguista. */
export function DayShiftModal({
  dayEditModal,
  setDayEditModal,
  activeGuards,
  monthInfo,
  year,
  month,
  isCurrentRealMonth,
  realDay,
  substitutions,
}) {
  const { posts, setShiftHours } = useApp()
  const [daySearchQuery, setDaySearchQuery] = useState('')
  const [swappingGuardId, setSwappingGuardId] = useState(null)
  const searchInputRef = useRef(null)
  const {
    getGuardsOnDay,
    getOriginalGuardForFolguista,
    handleUndoFolguista,
    handleReplaceWithFolguista,
    handleRestoreDayDefault,
  } = substitutions
  const handleAddFolguistaToDay = (d) =>
    substitutions.handleAddFolguistaToDay(d, () => setDaySearchQuery(''))

  // Focus search input when modal opens
  useEffect(() => {
    if (dayEditModal.isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [dayEditModal.isOpen])

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

  // Current day guards in open modal
  const modalDayGuards = dayEditModal.isOpen && dayEditModal.day ? getGuardsOnDay(dayEditModal.day) : []
  const modalDayTotalHours = modalDayGuards.reduce((acc, curr) => acc + curr.hours, 0)
  const modalDayHasFolguista = modalDayGuards.some((item) => item.isFolguista)
  const modalDayOriginalGuard = dayEditModal.isOpen && dayEditModal.day ? getOriginalGuardForFolguista(dayEditModal.day) : null

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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-line flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-navy text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand text-white flex items-center justify-center font-black font-mono text-base border border-mint/40 shadow-xs">
              {String(dayEditModal.day).padStart(2, '0')}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 flex-wrap">
                <span>
                  Dia {dayEditModal.day} de {monthInfo.monthName} ({getWeekday(year, month, dayEditModal.day).full})
                </span>
                {isCurrentRealMonth && dayEditModal.day === realDay && (
                  <span className="px-2 py-0.5 rounded-full bg-brand text-white font-black text-[11px] flex items-center gap-1 border border-emerald-400 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
                    HOJE
                  </span>
                )}
                {getHoliday(year, month, dayEditModal.day) && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-bold text-[11px]">
                    <span className="material-symbols-outlined text-[12px] leading-none">flag</span> {getHoliday(year, month, dayEditModal.day).name}
                  </span>
                )}
              </h3>
              <p className="text-xs text-on-navy mt-0.5">
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
            {modalDayHasFolguista ? (
              <button
                type="button"
                onClick={() => handleUndoFolguista(dayEditModal.day)}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-95 cursor-pointer border border-emerald-500"
                title={
                  modalDayOriginalGuard
                    ? `Clique para desfazer substituição e restaurar ${modalDayOriginalGuard.guard.name}`
                    : 'Clique para desfazer e remover o folguista'
                }
              >
                <span className="material-symbols-outlined text-[22px]">undo</span>
                <span>
                  {modalDayOriginalGuard
                    ? `Desfazer: Restaurar ${modalDayOriginalGuard.guard.name} (${modalDayOriginalGuard.hours}h)`
                    : 'Desfazer: Remover Folguista'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleAddFolguistaToDay(dayEditModal.day)}
                className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
                title="Adiciona um substituto/folguista nesta data sem precisar saber o nome"
              >
                <span className="material-symbols-outlined text-[20px]">person_pin</span>
                <span>+ Preencher com Folguista (Substituto)</span>
              </button>
            )}
          </div>

          {/* Autocomplete Input (Start typing and it auto-completes) */}
          <div className="relative">
            <label className="text-xs font-bold text-ink flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-brand">person_search</span>
                <span>
                  {swappingGuardId
                    ? 'Selecione quem vai substituir:'
                    : 'Adicionar funcionário (digite para autocompletar):'}
                </span>
              </span>
              {swappingGuardId && (
                <button
                  type="button"
                  onClick={() => setSwappingGuardId(null)}
                  className="text-xs text-red-600 font-bold hover:underline"
                >
                  Cancelar troca
                </button>
              )}
            </label>

            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-ink-muted text-[20px]">
                search
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={daySearchQuery}
                onChange={(e) => setDaySearchQuery(e.target.value)}
                placeholder="Digite o nome (ex: Carvalho, Gomes, Novaes, Folguista)..."
                className="w-full h-12 pl-10 pr-10 bg-field text-ink rounded-2xl text-xs sm:text-sm font-semibold border border-line focus:outline-none focus:border-brand focus:bg-white focus:shadow-xs transition"
              />
              {daySearchQuery && (
                <button
                  type="button"
                  onClick={() => setDaySearchQuery('')}
                  className="absolute right-3 text-ink-muted hover:text-ink cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>

            {/* Floating Autocomplete Dropdown */}
            {daySearchQuery.trim().length > 0 && (
              <div className="absolute top-full left-0 w-full mt-1.5 bg-white rounded-2xl shadow-2xl border border-line z-30 max-h-56 overflow-y-auto p-1.5 space-y-1 animate-in fade-in">
                {matchingGuards.length === 0 ? (
                  <div className="p-3 text-center text-xs text-ink-muted italic">
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
                        className="w-full p-2.5 rounded-xl hover:bg-field text-left flex items-center justify-between transition cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
     isFolguista
     ? 'bg-amber-200 text-amber-950 font-black'
     : 'bg-line text-ink'
     }`}
                          >
                            {isFolguista ? 'FOL' : g.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-ink block group-hover:text-brand">
                              {g.name}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-brand bg-field px-2 py-0.5 rounded-md">
                            +{g.defaultShiftHours || 3}h
                          </span>
                          <span className="material-symbols-outlined text-[18px] text-ink-muted group-hover:text-brand">
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
              <h4 className="text-xs font-bold text-ink flex items-center gap-1.5">
                <span className="material-symbols-outlined text-brand text-[18px]">group</span>
                <span>Escalados para o Dia {dayEditModal.day} ({modalDayGuards.length})</span>
              </h4>
              <span className="font-mono text-xs font-bold text-brand bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Total: {modalDayTotalHours}h
              </span>
            </div>

            {modalDayGuards.length === 0 ? (
              <div className="p-6 text-center rounded-2xl border-2 border-dashed border-line bg-page text-ink-muted text-xs space-y-1">
                <p className="font-semibold text-ink">Ninguém escalado nesta data.</p>
                <p className="text-xs">
                  Comece a digitar um nome acima ou clique em "+ Preencher com Folguista".
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {modalDayGuards.map(({ guard, hours, note, isFolguista }) => {
                  const isBeingSwapped = swappingGuardId === guard.id

                  return (
                    <div
                      key={guard.id}
                      className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
     isBeingSwapped
     ? 'border-brand bg-emerald-50/50 shadow-sm'
     : isFolguista
     ? 'bg-amber-50/80 border-amber-300'
     : 'bg-white border-line shadow-xs'
     }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
     isFolguista
     ? 'bg-amber-200 text-amber-950 font-black'
     : 'bg-field text-brand'
     }`}
                        >
                          {isFolguista ? 'FOL' : guard.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-ink">
                              {guard.name}
                            </span>
                            {isFolguista && (
                              <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[11px] font-black">
                                Folguista
                              </span>
                            )}
                          </div>
                          {isFolguista && (
                            <span className="text-[11px] text-amber-800 font-semibold block">
                              {modalDayOriginalGuard
                                ? `Substituindo ${modalDayOriginalGuard.guard.name} • Não trabalhou (contado 0h)`
                                : 'Substituto externo (contado 0h)'}
                            </span>
                          )}
                          {note && !note.includes('orig:') && (
                            <span className="text-[11px] text-ink-muted block">
                              {note}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Hours Controls and Quick Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                        {/* Hours Controls: regular guards have stepper, Folguista has 0h indicator */}
                        {isFolguista ? (
                          <span className="font-mono text-xs font-black px-2.5 py-1.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-300">
                            0h (Não pago)
                          </span>
                        ) : (
                          <div className="flex items-center gap-1 bg-field p-1 rounded-xl border border-line">
                            <button
                              type="button"
                              onClick={() =>
                                setShiftHours(guard.id, dayEditModal.day, Math.max(1, hours - 1), note)
                              }
                              className="w-6 h-6 rounded-lg bg-white text-ink font-bold text-xs flex items-center justify-center hover:bg-line cursor-pointer"
                              title="Diminuir 1h"
                            >
                              -
                            </button>
                            <span className="font-mono text-xs font-bold px-1.5 text-ink">
                              {hours}h
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setShiftHours(guard.id, dayEditModal.day, hours + 1, note)
                              }
                              className="w-6 h-6 rounded-lg bg-white text-ink font-bold text-xs flex items-center justify-center hover:bg-line cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        )}

                        {/* "Virou Folguista" button for regular guards OR "Voltar / Desfazer" button for Folguista */}
                        {isFolguista ? (
                          <button
                            type="button"
                            onClick={() => handleUndoFolguista(dayEditModal.day)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
                            title={
                              modalDayOriginalGuard
                                ? `Desfazer e restaurar a escala de ${modalDayOriginalGuard.guard.name}`
                                : 'Remover folguista e desfazer'
                            }
                          >
                            <span className="material-symbols-outlined text-[16px]">undo</span>
                            <span>
                              {modalDayOriginalGuard
                                ? `Voltar para ${modalDayOriginalGuard.guard.name}`
                                : 'Desfazer'}
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleReplaceWithFolguista(guard.id, dayEditModal.day, hours)}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                            title="Marca que não trabalhou e foi substituído por folguista de fora (contado 0h)"
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
     ? 'bg-brand text-white'
     : 'bg-field hover:bg-line text-ink'
     }`}
                          title="Trocar por outro funcionário"
                        >
                          <span className="material-symbols-outlined text-[15px]">sync_alt</span>
                          <span>{isBeingSwapped ? 'Trocando...' : 'Trocar'}</span>
                        </button>

                        {/* Delete button (or undo for Folguista) */}
                        <button
                          type="button"
                          onClick={() => {
                            if (isFolguista) {
                              handleUndoFolguista(dayEditModal.day)
                            } else {
                              setShiftHours(guard.id, dayEditModal.day, null)
                            }
                          }}
                          className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition cursor-pointer"
                          title={isFolguista ? 'Desfazer e restaurar escala' : 'Remover deste dia'}
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
        <div className="p-3.5 sm:p-4 bg-page border-t border-field flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-xs text-ink-muted hidden sm:inline">
              ✓ Salvo automaticamente em tempo real
            </span>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Deseja restaurar a escala padrão original para o dia ${dayEditModal.day}?`)) {
                  handleRestoreDayDefault(dayEditModal.day)
                }
              }}
              className="text-xs text-ink-muted hover:text-brand font-bold flex items-center gap-1 transition cursor-pointer hover:underline"
              title="Restaura a escala padrão deste dia conforme o planejamento original"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              <span>Restaurar Escala Original do Dia</span>
            </button>
          </div>
          <button
            type="button"
            onClick={() => setDayEditModal({ isOpen: false, day: null })}
            className="px-5 py-2.5 rounded-xl bg-ink hover:bg-navy-hover text-white text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  )
}
