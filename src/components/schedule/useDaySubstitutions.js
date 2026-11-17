import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { INITIAL_SHIFTS } from '../../data/initialData'

/**
 * Regras de escala do dia: quem trabalha em cada dia e as substituições por
 * folguista (com histórico salvo no aparelho para permitir "Desfazer").
 * Usado pela grade/calendário e pelo modal "Gerenciar plantão do dia".
 */
export function useDaySubstitutions({ activeGuards, showUndoToast }) {
  const { selectedMonth, guards, shifts, setShiftHours, getShiftNote } = useApp()

  // Persistent substitution history for instant undo
  const [substitutionHistory, setSubstitutionHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('g2_substitution_history')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('g2_substitution_history', JSON.stringify(substitutionHistory))
    } catch (e) {
      console.warn(e)
    }
  }, [substitutionHistory])

  // Get guards on a specific day
  const getGuardsOnDay = (d) => {
    // 1. Colaboradores regulares que trabalharam no dia (horas > 0)
    const regular = activeGuards
      .filter((g) => {
        if (g.id === 'g-folguista' || g.name?.toLowerCase() === 'folguista') return false
        const h = shifts[selectedMonth]?.[g.id]?.[d]
        return h !== undefined && h !== null && Number(h) > 0
      })
      .map((g) => ({
        guard: g,
        hours: Number(shifts[selectedMonth]?.[g.id]?.[d]),
        note: getShiftNote ? getShiftNote(g.id, d) : '',
        isFolguista: false,
      }))

    // 2. Verifica se houve substituição por Folguista de fora nesta data
    const folguistaShift = shifts[selectedMonth]?.['g-folguista']?.[d]
    const key = `${selectedMonth}_${d}`
    const hasFolguista =
      (folguistaShift !== undefined && folguistaShift !== null) ||
      Boolean(substitutionHistory[key]?.origGuardId)

    if (hasFolguista) {
      const folguistaGuard = guards.find((g) => g.id === 'g-folguista') || {
        id: 'g-folguista',
        name: 'Folguista',
        active: true,
      }
      regular.push({
        guard: folguistaGuard,
        hours: 0, // Substituto de fora: somente é contado zero naquele dia
        note: getShiftNote ? getShiftNote('g-folguista', d) : '',
        isFolguista: true,
      })
    }

    return regular
  }

  // Helper to identify who was substituted by Folguista on day d
  const getOriginalGuardForFolguista = (d) => {
    if (!d) return null
    const key = `${selectedMonth}_${d}`

    // 1. Check substitutionHistory (in-memory & localStorage)
    if (substitutionHistory[key]?.origGuardId) {
      const found = guards.find((g) => g.id === substitutionHistory[key].origGuardId)
      if (found) {
        return {
          guard: found,
          hours: substitutionHistory[key].origHours || found.defaultShiftHours || 3,
        }
      }
    }

    // 2. Check shift note of folguista on this day
    const note = getShiftNote ? getShiftNote('g-folguista', d) : ''
    if (note && note.includes('orig:')) {
      const match = note.match(/orig:([^:|]+):?(\d+)?/)
      if (match) {
        const origId = match[1]
        const origHours = match[2] ? Number(match[2]) : null
        const found = guards.find((g) => g.id === origId)
        if (found) {
          return {
            guard: found,
            hours: origHours || found.defaultShiftHours || 3,
          }
        }
      }
    }

    // 3. Fallback: Check INITIAL_SHIFTS for this month & day
    // Find guard in INITIAL_SHIFTS that had hours on day d, but now has 0 / null
    // Só usa a escala-modelo do PRÓPRIO mês (nunca a de outro mês)
    const initialMonthShifts = INITIAL_SHIFTS[selectedMonth] || {}
    for (const [gid, dayMap] of Object.entries(initialMonthShifts)) {
      if (gid === 'g-folguista') continue
      const initHours = dayMap[d]
      if (initHours && initHours > 0) {
        const currentHours = shifts[selectedMonth]?.[gid]?.[d]
        if (!currentHours || Number(currentHours) === 0) {
          const found = guards.find((g) => g.id === gid)
          if (found) {
            return {
              guard: found,
              hours: initHours,
            }
          }
        }
      }
    }

    // 4. Fallback: Any guard configured in INITIAL_SHIFTS on this day
    for (const [gid, dayMap] of Object.entries(initialMonthShifts)) {
      if (gid === 'g-folguista') continue
      const initHours = dayMap[d]
      if (initHours && initHours > 0) {
        const found = guards.find((g) => g.id === gid)
        if (found) {
          return {
            guard: found,
            hours: initHours,
          }
        }
      }
    }

    return null
  }

  // Undo Folguista and restore original guard schedule
  const handleUndoFolguista = (d) => {
    if (!d) return
    const original = getOriginalGuardForFolguista(d)

    // Remove folguista
    setShiftHours('g-folguista', d, null, '')

    // Restore original guard if found
    if (original?.guard) {
      setShiftHours(original.guard.id, d, original.hours || 3, '')
      showUndoToast({
        message: `✓ Escala restaurada! ${original.guard.name} voltou ao dia ${d} (${original.hours}h).`,
        onUndo: null,
      })
    } else {
      showUndoToast({
        message: `✓ Folguista removido do dia ${d}.`,
        onUndo: null,
      })
    }

    // Remove from substitution history
    setSubstitutionHistory((prev) => {
      const next = { ...prev }
      delete next[`${selectedMonth}_${d}`]
      return next
    })
  }

  // Quick "+ Preencher com Folguista"
  const handleAddFolguistaToDay = (d, onAddedDirect) => {
    if (!d) return
    const currentDayGuards = getGuardsOnDay(d)
    const existingRegularGuard = currentDayGuards.find((item) => !item.isFolguista)

    if (existingRegularGuard) {
      handleReplaceWithFolguista(existingRegularGuard.guard.id, d, existingRegularGuard.hours)
    } else {
      setShiftHours('g-folguista', d, 0, 'Substituto')
      onAddedDirect?.()
      showUndoToast({
        message: `Folguista externo cobriu o dia ${d} (contado 0h).`,
        onUndo: () => handleUndoFolguista(d),
      })
    }
  }

  // Replace a specific regular guard with Folguista
  const handleReplaceWithFolguista = (guardId, d, currentHours = 3) => {
    if (!d || !guardId) return
    const origGuard = guards.find((g) => g.id === guardId)
    const origName = origGuard?.name || 'Colaborador'
    const hours = currentHours || origGuard?.defaultShiftHours || 3

    // Record in substitution history
    const key = `${selectedMonth}_${d}`
    setSubstitutionHistory((prev) => ({
      ...prev,
      [key]: {
        origGuardId: guardId,
        origHours: hours,
        origGuardName: origName,
        timestamp: Date.now(),
      },
    }))

    // Save substitution in shifts:
    // O colaborador fixo não trabalhou -> horas zeradas (não recebe)
    setShiftHours(guardId, d, null)
    // Substituto externo cobriu -> contado 0h (não gera custo na folha)
    setShiftHours('g-folguista', d, 0, `Substituindo ${origName}|orig:${guardId}:${hours}`)

    // Show toast with immediate 1-click Undo
    showUndoToast({
      message: `${origName} não trabalhou no dia ${d} (trocado por folguista de fora • 0h).`,
      onUndo: () => handleUndoFolguista(d),
    })
  }

  // Restore the day's original schedule from INITIAL_SHIFTS
  const handleRestoreDayDefault = (d) => {
    if (!d) return
    const initialMonthShifts = INITIAL_SHIFTS[selectedMonth]

    // Mês sem escala-modelo: não apagar a escala real do dia.
    // Apenas desfaz a substituição (devolve o colaborador original, se houver).
    if (!initialMonthShifts) {
      handleUndoFolguista(d)
      return
    }

    // Remove folguista
    setShiftHours('g-folguista', d, null, '')

    // Restore guards from template
    activeGuards.forEach((g) => {
      const initHours = initialMonthShifts[g.id]?.[d]
      if (initHours !== undefined && initHours !== null && initHours > 0) {
        setShiftHours(g.id, d, initHours, '')
      } else {
        setShiftHours(g.id, d, null, '')
      }
    })

    // Clean substitution history for this day
    setSubstitutionHistory((prev) => {
      const next = { ...prev }
      delete next[`${selectedMonth}_${d}`]
      return next
    })

    showUndoToast({
      message: `✓ Escala original do dia ${d} restaurada com sucesso!`,
      onUndo: null,
    })
  }

  return {
    getGuardsOnDay,
    getOriginalGuardForFolguista,
    handleUndoFolguista,
    handleAddFolguistaToDay,
    handleReplaceWithFolguista,
    handleRestoreDayDefault,
  }
}
