import { createClient } from '@supabase/supabase-js'

// Credenciais vêm SOMENTE de variáveis de ambiente (.env local ou Vercel).
// A chave anon é pública por natureza; a proteção dos dados é feita pelo
// Supabase Auth + políticas RLS (ver supabase-security.sql).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('seu-projeto') &&
  !supabaseAnonKey.includes('sua-chave')
)

if (!isSupabaseConfigured) {
  console.error(
    'Supabase não configurado: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env (ou nas variáveis da Vercel).'
  )
}

// "Manter conectado": com a flag ligada a sessão fica no localStorage;
// sem ela, fica no sessionStorage e expira ao fechar o navegador.
export const REMEMBER_KEY = 'g2_remember_session'

function safe(fn, fallback = null) {
  try {
    return fn()
  } catch {
    return fallback
  }
}

const sessionAwareStorage = {
  getItem: (key) =>
    safe(() => localStorage.getItem(key)) ?? safe(() => sessionStorage.getItem(key)),
  setItem: (key, value) => {
    const remember = safe(() => localStorage.getItem(REMEMBER_KEY) === 'true', false)
    if (remember) {
      safe(() => localStorage.setItem(key, value))
      safe(() => sessionStorage.removeItem(key))
    } else {
      safe(() => sessionStorage.setItem(key, value))
      safe(() => localStorage.removeItem(key))
    }
  },
  removeItem: (key) => {
    safe(() => localStorage.removeItem(key))
    safe(() => sessionStorage.removeItem(key))
  },
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage: sessionAwareStorage,
      },
    })
  : null
