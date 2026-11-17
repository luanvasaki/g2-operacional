// Proteções simples para dados que vêm do banco ou de digitação.

const RESERVED_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

/** Falso para nomes que, usados como chave de objeto, alterariam o próprio JavaScript. */
export const isSafeKey = (key) => !RESERVED_KEYS.has(String(key))

/** Horas de um dia: sempre entre 0 e 24 (texto inválido vira 0). */
export const clampHours = (hours) => {
  const n = Number(hours)
  return Number.isFinite(n) ? Math.min(24, Math.max(0, n)) : 0
}
