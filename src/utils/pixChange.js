// Aviso de chave PIX trocada recentemente (proteção contra golpe de troca de PIX).
// A data da troca é gravada pelo próprio banco (supabase-hardening.sql), o app só lê.

export const PIX_WARNING_DAYS = 30

/** Retorna { changedAt, previousKey } se a chave PIX mudou nos últimos 30 dias; senão null. */
export function getRecentPixChange(guard, now = new Date()) {
  if (!guard?.pixChangedAt) return null
  const changedAt = new Date(guard.pixChangedAt)
  if (Number.isNaN(changedAt.getTime())) return null
  const ageDays = (now - changedAt) / 86400000
  if (ageDays < 0 || ageDays > PIX_WARNING_DAYS) return null
  return { changedAt, previousKey: guard.pixPreviousKey || '' }
}

export const formatPixChangeDate = (date) =>
  date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
