import React from 'react'
import { getRecentPixChange, formatPixChangeDate } from '../../utils/pixChange'

/**
 * Alerta exibido antes de pagar quando a chave PIX do prestador foi trocada há pouco.
 * compact: versão de uma linha para listas.
 */
export function PixChangeWarning({ guard, compact = false }) {
  const change = getRecentPixChange(guard)
  if (!change) return null
  const date = formatPixChangeDate(change.changedAt)

  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[11px] font-bold text-warn-ink bg-amber-100 border border-amber-300 rounded-md px-1.5 py-0.5"
        title={change.previousKey ? `Chave anterior: ${change.previousKey}` : undefined}
      >
        <span className="material-symbols-outlined text-[13px] leading-none">warning</span>
        PIX trocado em {date}
      </span>
    )
  }

  return (
    <div role="alert" className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-300 text-warn-ink">
      <span className="material-symbols-outlined text-[20px] text-warn shrink-0">warning</span>
      <div className="text-xs leading-snug">
        <p className="font-bold">Chave PIX alterada em {date}</p>
        <p className="mt-0.5">
          Confirme com o prestador (por ligação ou pessoalmente) antes de pagar.
          {change.previousKey && (
            <>
              {' '}Chave anterior: <span className="font-mono font-semibold">{change.previousKey}</span>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
