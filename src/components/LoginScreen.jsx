import React, { useState } from 'react'
import { G2Logo } from './G2Logo'
import { useApp } from '../context/AppContext'

export function LoginScreen() {
  const { login, authError, isSupabaseConfigured } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    setErrorMsg('')
    setIsSubmitting(true)

    // Autenticação feita no servidor (Supabase Auth). Nenhuma senha é conferida no navegador.
    const { error } = await login(email, password, rememberMe)
    if (error) {
      setErrorMsg(error)
      setIsSubmitting(false)
    }
    // Em caso de sucesso, o AppContext carrega o perfil e troca de tela.
  }

  const shownError =
    errorMsg ||
    authError ||
    (!isSupabaseConfigured
      ? 'Sistema sem conexão configurada com o servidor. Contate o administrador.'
      : '')

  return (
    <div className="bg-page text-ink min-h-screen flex flex-col justify-center items-center px-4 py-8 relative">
      <main className="flex flex-col relative w-full max-w-md bg-page">
        <div className="flex flex-col w-full pb-8">
          {/* Header Brand */}
          <div className="flex flex-col items-center text-center pt-2 pb-6">
            <div className="relative w-56 h-28 mb-4 bg-white rounded-2xl shadow-md flex items-center justify-center p-2.5 border border-line hover:shadow-lg transition-shadow">
              <G2Logo className="w-full h-full object-contain scale-110" showBadge={true} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-field-strong rounded-full mb-2">
              <span className="w-2 h-2 rounded-full bg-brand"></span>
              <span className="text-xs text-ink-soft font-semibold">
                Gestão Operacional de Bicos
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-ink">
              G2 Atacado de Bebidas
            </h1>
            <p className="text-sm text-ink-soft max-w-xs mt-1">
              Painel de Controle de Escalas, Horas e Diárias
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-5 flex flex-col gap-4 border border-line">
            <div className="flex items-center justify-between pb-2 border-b border-field">
              <div>
                <h2 className="text-sm font-bold text-ink">Acesso de Gerência</h2>
                <p className="text-xs text-ink-muted">Entre com seu e-mail e senha pessoais</p>
              </div>
              <span className="material-symbols-outlined text-brand text-[24px]">
                admin_panel_settings
              </span>
            </div>

            {shownError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 animate-in fade-in">
                <span className="material-symbols-outlined text-[18px] shrink-0 text-red-600">
                  error
                </span>
                <span>{shownError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              {/* E-mail */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ink" htmlFor="login-email">
                  E-mail
                </label>
                <div className="relative flex items-center bg-field rounded-xl focus-within:bg-white focus-within:shadow-sm border border-transparent focus-within:border-brand transition-all">
                  <span className="material-symbols-outlined text-ink-muted ml-3.5 mr-2 text-[20px]">
                    account_circle
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@empresa.com"
                    className="w-full h-12 bg-transparent pr-4 text-sm text-ink placeholder:text-ink-muted focus:outline-none font-medium"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ink" htmlFor="login-password">
                  Senha
                </label>
                <div className="relative flex items-center bg-field rounded-xl focus-within:bg-white focus-within:shadow-sm border border-transparent focus-within:border-brand transition-all">
                  <span className="material-symbols-outlined text-ink-muted ml-3.5 mr-2 text-[20px]">
                    lock
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    className="w-full h-12 bg-transparent pr-12 text-sm text-ink placeholder:text-ink-muted focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 w-9 h-9 flex items-center justify-center text-ink-muted hover:text-ink cursor-pointer"
                    title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="bg-field/60 border border-line rounded-xl p-3 flex flex-col gap-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-brand accent-brand cursor-pointer shrink-0"
                  />
                  <span className="text-xs font-semibold text-ink">
                    Manter conectado neste dispositivo
                  </span>
                </label>
                <span className="text-xs text-ink-muted pl-6.5 leading-tight">
                  Use apenas em dispositivo pessoal. Sem esta opção, a sessão termina ao fechar o navegador.
                </span>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isSubmitting || !isSupabaseConfigured}
                className="w-full h-12 mt-1 rounded-xl bg-ink hover:bg-navy-hover text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-all cursor-pointer disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-[20px] animate-spin">
                      progress_activity
                    </span>
                    <span>Entrando...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">login</span>
                    <span>Entrar no Sistema</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Security Footer */}
          <div className="flex flex-col items-center justify-center gap-2 text-center pt-4">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-field text-ink-soft border border-line/80">
              <span className="material-symbols-outlined text-[15px] text-brand">lock</span>
              <span className="font-mono text-xs">
                G2 Operacional • Acesso Restrito aos Gestores
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
