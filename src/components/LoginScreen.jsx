import React, { useState } from 'react'
import { G2Logo } from './G2Logo'
import { useApp } from '../context/AppContext'

export function LoginScreen() {
  const { login, managerPassword } = useApp()
  const [managerName, setManagerName] = useState(() => {
    try {
      return localStorage.getItem('g2_last_manager_name') || ''
    } catch {
      return ''
    }
  })
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const handleLogin = (e) => {
    e.preventDefault()
    setErrorMsg('')

    const effectivePass = managerPassword || 'g22026'
    // Allow either the configured manager password or standard fallback '123456' / 'g22026'
    const isCorrect =
      password.trim() === effectivePass.trim() ||
      password.trim() === '123456' ||
      password.trim() === 'g22026'

    if (!isCorrect) {
      setErrorMsg('Senha incorreta! Digite a senha oficial da G2 ou solicite à administração.')
      return
    }

    const name = managerName.trim() || 'Gerente Operacional'
    if (rememberMe) {
      try {
        localStorage.setItem('g2_last_manager_name', name)
      } catch (err) {
        console.warn(err)
      }
    }

    login({
      id: `usr-${Date.now()}`,
      name: name,
      role: 'Gerente / Supervisor Operacional',
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@g2operacional.com`,
    })
  }

  const handleQuickLogin = () => {
    const name = managerName.trim() || 'Supervisor Silva'
    login({
      id: `usr-${Date.now()}`,
      name: name,
      role: 'Supervisor Operacional',
      email: 'gestor.g2@operacional.com',
    })
  }

  return (
    <div className="bg-[#f8f9ff] text-[#0d1c2f] min-h-screen flex flex-col justify-center items-center px-4 py-8 relative">
      <main className="flex flex-col relative w-full max-w-md bg-[#f8f9ff]">
        <div className="flex flex-col w-full pb-8">
          {/* Header Brand */}
          <div className="flex flex-col items-center text-center pt-2 pb-6">
            <div className="relative w-56 h-28 mb-4 bg-white rounded-2xl shadow-md flex items-center justify-center p-2.5 border border-[#dde9ff] hover:shadow-lg transition-shadow">
              <G2Logo className="w-full h-full object-contain scale-110" showBadge={true} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#e6eeff] rounded-full mb-2">
              <span className="w-2 h-2 rounded-full bg-[#006c49]"></span>
              <span className="font-mono text-[11px] text-[#45464d] uppercase tracking-wider font-semibold">
                Gestão Inteligente de Equipes
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[#0d1c2f]">
              G2 Operacional
            </h1>
            <p className="text-sm text-[#45464d] max-w-xs mt-1">
              Controle de Diárias, Horas e Pagamentos de Bicos
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-md p-5 mb-5 flex flex-col gap-4 border border-[#dde9ff]">
            <div className="flex items-center justify-between pb-2 border-b border-[#eff4ff]">
              <div>
                <h2 className="text-sm font-bold text-[#0d1c2f]">Acesso de Gerência</h2>
                <p className="text-xs text-[#76777d]">Digite seu nome e a senha oficial da G2</p>
              </div>
              <span className="material-symbols-outlined text-[#006c49] text-[22px]">
                admin_panel_settings
              </span>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 animate-in fade-in">
                <span className="material-symbols-outlined text-[18px] shrink-0 text-red-600">
                  error
                </span>
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              {/* Manager Name */}
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-xs font-semibold text-[#0d1c2f] flex items-center justify-between"
                  htmlFor="manager-name"
                >
                  <span>Seu Nome ou Cargo</span>
                  <span className="text-[11px] text-[#76777d] font-normal">
                    Como você aparecerá no app
                  </span>
                </label>
                <div className="relative flex items-center bg-[#eff4ff] rounded-xl focus-within:bg-white focus-within:shadow-sm border border-transparent focus-within:border-[#006c49] transition-all">
                  <span className="material-symbols-outlined text-[#76777d] ml-3.5 mr-2 text-[20px]">
                    person
                  </span>
                  <input
                    id="manager-name"
                    type="text"
                    required
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="Ex: Carlos Gerente, Supervisor Silva..."
                    className="w-full h-12 bg-transparent pr-4 text-sm text-[#0d1c2f] placeholder:text-[#76777d] focus:outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-xs font-semibold text-[#0d1c2f]"
                  htmlFor="login-password"
                >
                  Senha Oficial da G2
                </label>
                <div className="relative flex items-center bg-[#eff4ff] rounded-xl focus-within:bg-white focus-within:shadow-sm border border-transparent focus-within:border-[#006c49] transition-all">
                  <span className="material-symbols-outlined text-[#76777d] ml-3.5 mr-2 text-[20px]">
                    lock
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite a senha oficial da G2"
                    className="w-full h-12 bg-transparent pr-12 text-sm text-[#0d1c2f] placeholder:text-[#76777d] focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 w-9 h-9 flex items-center justify-center text-[#76777d] hover:text-[#0d1c2f]"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#006c49] accent-[#006c49] cursor-pointer"
                  />
                  <span className="text-xs text-[#0d1c2f]">Lembrar neste aparelho</span>
                </label>
                <span className="font-mono text-[10px] text-[#00714d] bg-[#6cf8bb]/30 px-2 py-0.5 rounded-full font-bold">
                  Sessão Segura
                </span>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className="w-full h-12 mt-1 rounded-xl bg-[#0d1c2f] hover:bg-[#1a2d47] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">login</span>
                <span>Entrar no Sistema</span>
              </button>
            </form>
          </div>

          {/* Quick Access Helper */}
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleQuickLogin}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-[#eff4ff] text-[#0d1c2f] font-semibold text-xs shadow-xs flex items-center justify-between border border-[#dde9ff] transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#006c49] text-[18px]">
                  bolt
                </span>
                <span>Entrar Direto (Acesso Rápido de Teste)</span>
              </div>
              <span className="material-symbols-outlined text-[#76777d] text-[16px]">
                arrow_forward
              </span>
            </button>
          </div>

          {/* Security Footer */}
          <div className="flex flex-col items-center justify-center gap-2 text-center pt-6">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eff4ff] text-[#45464d] border border-[#dde9ff]/80">
              <span className="material-symbols-outlined text-[15px] text-[#006c49]">lock</span>
              <span className="font-mono text-[11px]">
                G2 Operacional • Acesso Restrito aos Gestores
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
