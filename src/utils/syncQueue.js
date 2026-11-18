// ==============================================================================
// FILA DE ENVIO PARA A NUVEM
// Toda alteração feita no aparelho entra primeiro nesta fila (guardada no próprio
// aparelho) e só sai dela quando o banco confirma que gravou. Se estiver sem
// internet ou com o banco pausado, a alteração fica esperando e é reenviada depois.
// Enquanto houver algo na fila, o app NÃO substitui os dados do aparelho pelos da
// nuvem — assim nada lançado no aparelho se perde.
// ==============================================================================
export const SYNC_QUEUE_KEY = 'g2_pending_sync_v1'
export const SYNC_FAILED_KEY = 'g2_sync_failed_v1'

const dayKey = (r) => `${r.month}|${r.guard_id}|${Number(r.day)}`

const TABLES = {
  posts: { pk: (r) => r.id, match: (r) => ({ id: r.id }) },
  guards: { pk: (r) => r.id, match: (r) => ({ id: r.id }) },
  shifts: {
    pk: dayKey,
    match: (r) => ({ month: r.month, guard_id: r.guard_id, day: Number(r.day) }),
    onConflict: 'month,guard_id,day',
  },
  shift_notes: {
    pk: dayKey,
    match: (r) => ({ month: r.month, guard_id: r.guard_id, day: Number(r.day) }),
    onConflict: 'month,guard_id,day',
  },
  payments: { pk: (r) => r.key, match: (r) => ({ key: r.key }) },
  app_settings: { pk: (r) => r.key, match: (r) => ({ key: r.key }) },
}

const BATCH_SIZE = 500

// Erros que não se resolvem tentando de novo (dado recusado pelo banco).
// Falta de internet, banco pausado, sessão expirada etc. continuam na fila.
function isPermanentError(error) {
  return /^2[23]/.test(String(error?.code || ''))
}

function readJson(storage, key, fallback) {
  try {
    const raw = storage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : fallback
    return parsed && typeof parsed === 'object' ? parsed : fallback
  } catch {
    return fallback
  }
}

export function createSyncQueue({ supabase, storage }) {
  // Cópia em memória é a referência; o storage é o que sobrevive ao fechar o app
  let ops = readJson(storage, SYNC_QUEUE_KEY, {})
  let seq = Object.values(ops).reduce((max, op) => Math.max(max, Number(op?.seq) || 0), 0)
  let lastError = null
  const listeners = new Set()

  const persist = () => {
    try {
      storage.setItem(SYNC_QUEUE_KEY, JSON.stringify(ops))
    } catch (e) {
      console.warn('Não foi possível guardar a fila de envio no aparelho:', e)
    }
  }

  const notify = () => {
    const state = { pending: Object.keys(ops).length, lastError }
    listeners.forEach((fn) => {
      try {
        fn(state)
      } catch {}
    })
  }

  const recordFailed = (op, error) => {
    try {
      const failed = readJson(storage, SYNC_FAILED_KEY, [])
      const list = Array.isArray(failed) ? failed : []
      list.push({ ...op, error: String(error?.message || error), at: new Date().toISOString() })
      storage.setItem(SYNC_FAILED_KEY, JSON.stringify(list.slice(-200)))
    } catch {}
    console.warn('Alteração recusada pelo banco (guardada em', SYNC_FAILED_KEY + '):', op, error)
  }

  // ops: [{ table, action: 'upsert' | 'delete', row }]
  function enqueue(newOps) {
    let changed = false
    for (const op of newOps || []) {
      const def = TABLES[op?.table]
      if (!def || !op.row || (op.action !== 'upsert' && op.action !== 'delete')) continue
      const key = `${op.table}|${def.pk(op.row)}`
      // A última alteração do mesmo item vale; mantém a posição original na fila
      const previous = ops[key]
      ops[key] = { table: op.table, action: op.action, row: op.row, seq: previous ? previous.seq : ++seq, v: ++seq }
      changed = true
    }
    if (changed) {
      persist()
      notify()
    }
  }

  async function send(table, action, rows) {
    const def = TABLES[table]
    try {
      const res =
        action === 'upsert'
          ? await supabase.from(table).upsert(rows, def.onConflict ? { onConflict: def.onConflict } : undefined)
          : await supabase.from(table).delete().match(def.match(rows[0]))
      return res?.error || null
    } catch (e) {
      return e || new Error('falha de rede')
    }
  }

  // Remove da fila só o que não foi alterado de novo enquanto era enviado
  function settle(batch) {
    for (const [key, op] of batch) {
      if (ops[key] && ops[key].v === op.v) delete ops[key]
    }
    persist()
  }

  async function runFlush() {
    const entries = Object.entries(ops).sort((a, b) => a[1].seq - b[1].seq)
    let i = 0
    while (i < entries.length) {
      const [, first] = entries[i]
      const batch = [entries[i]]
      if (first.action === 'upsert') {
        let j = i + 1
        while (
          j < entries.length &&
          batch.length < BATCH_SIZE &&
          entries[j][1].table === first.table &&
          entries[j][1].action === 'upsert'
        ) {
          batch.push(entries[j])
          j++
        }
      }

      const error = await send(first.table, first.action, batch.map(([, op]) => op.row))
      if (!error) {
        settle(batch)
      } else if (isPermanentError(error)) {
        // Um item recusado não pode travar os outros: manda um por um
        for (const entry of batch) {
          const err = batch.length === 1 ? error : await send(entry[1].table, entry[1].action, [entry[1].row])
          if (!err) {
            settle([entry])
          } else if (isPermanentError(err)) {
            recordFailed(entry[1], err)
            settle([entry])
          } else {
            lastError = err
            notify()
            return false
          }
        }
      } else {
        lastError = error
        notify()
        return false
      }
      i += batch.length
    }
    lastError = null
    notify()
    return Object.keys(ops).length === 0
  }

  // Um envio por vez; chamadas durante um envio aguardam e rodam uma única vez depois
  let running = null
  let queued = null
  function start() {
    running = runFlush()
      .catch((e) => {
        lastError = e
        notify()
        return false
      })
      .finally(() => {
        running = null
      })
    return running
  }
  function flush() {
    if (!supabase) return Promise.resolve(Object.keys(ops).length === 0)
    if (queued) return queued
    if (running) {
      queued = running.then(() => {
        queued = null
        return start()
      })
      return queued
    }
    return start()
  }

  return {
    enqueue,
    flush,
    pendingCount: () => Object.keys(ops).length,
    getLastError: () => lastError,
    subscribe(fn) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
  }
}
