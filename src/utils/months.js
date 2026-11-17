// Utilitários de mês (formato "YYYY-MM"), sempre baseados na data real do aparelho.

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const MONTH_KEY_RE = /^\d{4}-(0[1-9]|1[0-2])$/

export function isValidMonthKey(key) {
  return typeof key === 'string' && MONTH_KEY_RE.test(key)
}

export function toMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/** Mês corrente de verdade (ex.: em 17/11/2026 → "2026-11"). */
export function getCurrentMonthKey() {
  return toMonthKey(new Date())
}

/** Soma/subtrai meses: shiftMonthKey("2026-01", -1) → "2025-12". */
export function shiftMonthKey(key, delta) {
  const [y, m] = key.split('-').map(Number)
  return toMonthKey(new Date(y, m - 1 + delta, 1))
}

/** "2026-11" → "Novembro 2026" */
export function formatMonthLabel(key) {
  const [y, m] = key.split('-').map(Number)
  return `${MONTH_NAMES[m - 1]} ${y}`
}

/**
 * Lista de meses para os seletores: do mais recente ao mais antigo,
 * de `ahead` meses à frente até `back` meses atrás do mês atual.
 * Inclui o mês selecionado mesmo que esteja fora dessa faixa.
 */
export function buildMonthOptions({ selected, back = 6, ahead = 2 } = {}) {
  const current = getCurrentMonthKey()
  const keys = []
  for (let d = ahead; d >= -back; d--) keys.push(shiftMonthKey(current, d))
  if (isValidMonthKey(selected) && !keys.includes(selected)) {
    keys.push(selected)
    keys.sort().reverse()
  }
  return keys.map((value) => ({
    value,
    label: value === current ? `${formatMonthLabel(value)} (Mês Atual)` : formatMonthLabel(value),
    isCurrent: value === current,
  }))
}
