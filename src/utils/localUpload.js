import { INITIAL_POSTS, INITIAL_GUARDS, INITIAL_SHIFTS, INITIAL_PAYMENTS } from '../data/initialData.js'
import { isValidMonthKey } from './months.js'
import { clampHours, isSafeKey } from './safety.js'

// ==============================================================================
// ENVIO ÚNICO DOS DADOS DESTE APARELHO PARA A NUVEM
// O banco ficou pausado e cada aparelho seguiu trabalhando só com a cópia local.
// Antes da primeira leitura da nuvem, cada aparelho envia (sem apagar nada) o que
// tem guardado; assim os aparelhos se somam em vez de um sobrescrever o outro.
// Aparelho que só tem os dados de exemplo da planilha não envia nada.
// ==============================================================================
export const LOCAL_UPLOAD_FLAG = 'g2_cloud_upload_v1'

function stableJson(value) {
  if (Array.isArray(value)) return '[' + value.map(stableJson).join(',') + ']'
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map((k) => JSON.stringify(k) + ':' + stableJson(value[k])).join(',') + '}'
  }
  return JSON.stringify(value)
}

function readLocalJson(storage, key, fallback) {
  try {
    const raw = storage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

async function upsertInChunks(supabase, table, rows, onConflict) {
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase.from(table).upsert(rows.slice(i, i + 500), onConflict ? { onConflict } : undefined)
    if (error) throw new Error(`${table}: ${error.message}`)
  }
}

export async function uploadLocalDataOnce({ supabase, storage, keys, guardToDb, postToDb }) {
  try {
    if (storage.getItem(LOCAL_UPLOAD_FLAG) === 'done') return true
  } catch {
    return true
  }

  const posts = readLocalJson(storage, keys.POSTS, null)
  const guards = readLocalJson(storage, keys.GUARDS, null)
  const shifts = readLocalJson(storage, keys.SHIFTS, null)
  const payments = readLocalJson(storage, keys.PAYMENTS, null)
  const notes = readLocalJson(storage, keys.SHIFT_NOTES, {})

  const isOnlyTemplate =
    (!guards || stableJson(guards) === stableJson(INITIAL_GUARDS)) &&
    (!posts || stableJson(posts) === stableJson(INITIAL_POSTS)) &&
    (!shifts || stableJson(shifts) === stableJson(INITIAL_SHIFTS)) &&
    (!payments || stableJson(payments) === stableJson(INITIAL_PAYMENTS)) &&
    Object.keys(notes || {}).length === 0

  if (!isOnlyTemplate) {
    const now = new Date().toISOString()

    // Só vai o que difere da base de exemplo: o que este aparelho nunca alterou
    // não pode sobrescrever o que o outro aparelho mudou.
    const templatePosts = new Map(INITIAL_POSTS.map((p) => [p.id, stableJson(postToDb(p))]))
    const templateGuards = new Map(INITIAL_GUARDS.map((g) => [g.id, stableJson(guardToDb(g))]))
    const postRows = (Array.isArray(posts) ? posts : [])
      .filter((p) => p && isSafeKey(p.id))
      .map(postToDb)
      .filter((row) => templatePosts.get(row.id) !== stableJson(row))
    const guardRows = (Array.isArray(guards) ? guards : [])
      .filter((g) => g && isSafeKey(g.id))
      .map(guardToDb)
      .filter((row) => templateGuards.get(row.id) !== stableJson(row))

    const shiftRows = []
    Object.entries(shifts || {}).forEach(([month, byGuard]) => {
      if (!isValidMonthKey(month) || !byGuard || typeof byGuard !== 'object') return
      Object.entries(byGuard).forEach(([guardId, byDay]) => {
        if (!isSafeKey(guardId) || !byDay || typeof byDay !== 'object') return
        Object.entries(byDay).forEach(([day, hours]) => {
          const d = Number(day)
          if (!Number.isInteger(d) || d < 1 || d > 31) return
          if (hours === null || hours === undefined || hours === '') return
          const templateHours = INITIAL_SHIFTS[month]?.[guardId]?.[day]
          if (templateHours !== undefined && clampHours(templateHours) === clampHours(hours)) return
          shiftRows.push({ month, guard_id: guardId, day: d, hours: clampHours(hours), updated_at: now })
        })
      })
    })

    const noteRows = []
    Object.entries(notes || {}).forEach(([month, byGuard]) => {
      if (!isValidMonthKey(month) || !byGuard || typeof byGuard !== 'object') return
      Object.entries(byGuard).forEach(([guardId, byDay]) => {
        if (!isSafeKey(guardId) || !byDay || typeof byDay !== 'object') return
        Object.entries(byDay).forEach(([day, note]) => {
          const d = Number(day)
          if (!Number.isInteger(d) || d < 1 || d > 31) return
          if (typeof note !== 'string' || !note.trim()) return
          noteRows.push({ month, guard_id: guardId, day: d, note: note.trim(), updated_at: now })
        })
      })
    })

    const paymentRows = []
    Object.entries(payments || {}).forEach(([key, p]) => {
      if (!isSafeKey(key) || !p) return
      if (INITIAL_PAYMENTS[key] && stableJson(INITIAL_PAYMENTS[key]) === stableJson(p)) return
      const parts = key.split('_')
      if (parts.length < 3) return
      const month = parts[0]
      const quinzena = parts[parts.length - 1]
      const guardId = parts.slice(1, -1).join('_')
      if (!isValidMonthKey(month) || !['q1', 'q2'].includes(quinzena)) return
      paymentRows.push({
        key,
        month,
        guard_id: guardId,
        quinzena,
        status: p.status || 'PAID',
        paid_at: p.paidAt || now,
        notes: p.notes || '',
        updated_at: now,
      })
    })

    try {
      await upsertInChunks(supabase, 'posts', postRows)
      await upsertInChunks(supabase, 'guards', guardRows)
      await upsertInChunks(supabase, 'shifts', shiftRows, 'month,guard_id,day')
      await upsertInChunks(supabase, 'shift_notes', noteRows, 'month,guard_id,day')
      await upsertInChunks(supabase, 'payments', paymentRows)
    } catch (e) {
      // Não marca como enviado e não deixa a leitura da nuvem sobrescrever este aparelho
      console.warn('Envio dos dados locais falhou; tentará de novo na próxima sincronização:', e)
      return false
    }
  }

  try {
    storage.setItem(LOCAL_UPLOAD_FLAG, 'done')
  } catch {}
  return true
}
