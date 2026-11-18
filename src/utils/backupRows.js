import { isValidMonthKey } from './months.js'
import { clampHours, isSafeKey } from './safety.js'

// ==============================================================================
// Converte um arquivo de backup (G2_Backup_*.json) em gravações para a nuvem.
// Só inclui/atualiza linhas (nunca apaga nada que esteja no banco).
// ==============================================================================

function eachDay(byMonth, fn) {
  if (!byMonth || typeof byMonth !== 'object') return
  Object.entries(byMonth).forEach(([month, byGuard]) => {
    if (!isValidMonthKey(month) || !byGuard || typeof byGuard !== 'object') return
    Object.entries(byGuard).forEach(([guardId, byDay]) => {
      if (!isSafeKey(guardId) || !byDay || typeof byDay !== 'object') return
      Object.entries(byDay).forEach(([day, value]) => {
        const d = Number(day)
        if (!Number.isInteger(d) || d < 1 || d > 31) return
        fn(month, guardId, d, value)
      })
    })
  })
}

export function backupToCloudOps(data, { guardToDb, postToDb, now = new Date().toISOString() }) {
  const ops = []
  if (Array.isArray(data.posts)) {
    data.posts.filter((p) => p && isSafeKey(p.id)).forEach((p) => ops.push({ table: 'posts', action: 'upsert', row: postToDb(p) }))
  }
  if (Array.isArray(data.guards)) {
    data.guards.filter((g) => g && isSafeKey(g.id)).forEach((g) => ops.push({ table: 'guards', action: 'upsert', row: guardToDb(g) }))
  }
  eachDay(data.shifts, (month, guardId, day, hours) => {
    if (hours === null || hours === undefined || hours === '') return
    ops.push({ table: 'shifts', action: 'upsert', row: { month, guard_id: guardId, day, hours: clampHours(hours), updated_at: now } })
  })
  eachDay(data.shiftNotes, (month, guardId, day, note) => {
    if (typeof note !== 'string' || !note.trim()) return
    ops.push({ table: 'shift_notes', action: 'upsert', row: { month, guard_id: guardId, day, note: note.trim(), updated_at: now } })
  })
  if (data.payments && typeof data.payments === 'object') {
    Object.entries(data.payments).forEach(([key, p]) => {
      if (!isSafeKey(key) || !p || typeof p !== 'object') return
      const parts = key.split('_')
      if (parts.length < 3) return
      const month = parts[0]
      const quinzena = parts[parts.length - 1]
      const guardId = parts.slice(1, -1).join('_')
      if (!isValidMonthKey(month) || !['q1', 'q2'].includes(quinzena) || !isSafeKey(guardId)) return
      ops.push({
        table: 'payments',
        action: 'upsert',
        row: {
          key,
          month,
          guard_id: guardId,
          quinzena,
          status: p.status === 'PENDING' ? 'PENDING' : 'PAID',
          paid_at: p.paidAt || now,
          notes: typeof p.notes === 'string' ? p.notes : '',
          updated_at: now,
        },
      })
    })
  }
  if (Number(data.defaultHourlyRate) > 0) {
    ops.push({ table: 'app_settings', action: 'upsert', row: { key: 'hourly_rate', value: String(Number(data.defaultHourlyRate)), updated_at: now } })
  }
  if (Number(data.budgetCeiling) > 0) {
    ops.push({ table: 'app_settings', action: 'upsert', row: { key: 'budget_ceiling', value: String(Number(data.budgetCeiling)), updated_at: now } })
  }
  return ops
}
