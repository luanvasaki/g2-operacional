import React, { useState } from 'react'
import { G2Logo } from './G2Logo'
import { useApp } from '../context/AppContext'

export function LoginScreen() {
  const { login } = useApp()
  const [identifier, setIdentifier] = useState('supervisor@g2seguranca.com.br')
  const [password, setPassword] = useState('123456')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  const handleLogin = (e) => {
    e.preventDefault()
    login({
      id: 'usr-admin',
      name: 'Supervisor Silva',
      role: 'Supervisor / Mestre Operacional',
      email: identifier,
    })
  }

  const handleDemoLogin = () => {
    login({
      id: 'usr-demo',
      name: 'Supervisor Silva',
      role: 'Supervisor / Mestre Operacional',
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

          {/* Quick Metrics Bento */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#eff4ff] shadow-xs border border-[#dde9ff]/60">
              <div className="w-8 h-8 rounded-lg bg-[#e6eeff] flex items-center justify-center text-[#0d1c2f]">
                <span className="material-symbols-outlined text-[18px]">payments</span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[11px] text-[#45464d]">Fechamento</span>
                <span className="text-sm font-semibold text-[#0d1c2f] leading-tight">
                  Diário & Quinzenal
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#eff4ff] shadow-xs border border-[#dde9ff]/60">
              <div className="w-8 h-8 rounded-lg bg-[#e6eeff] flex items-center justify-center text-[#0d1c2f]">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[11px] text-[#45464d]">Auditoria</span>
                <span className="text-sm font-semibold text-[#0d1c2f] leading-tight">
                  100% Blindada
                </span>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-md p-5 mb-5 flex flex-col gap-4 border border-[#dde9ff]">
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              {/* Identifier */}
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-xs font-semibold text-[#0d1c2f] flex items-center justify-between"
                  htmlFor="login-identifier"
                >
                  <span>E-mail ou Telefone</span>
                  <span className="text-[11px] text-[#76777d] font-normal">
                    Gestor ou Mestre
                  </span>
                </label>
                <div className="relative flex items-center bg-[#eff4ff] rounded-xl focus-within:bg-white focus-within:shadow-sm border border-transparent focus-within:border-[#6cf8bb] transition-all">
                  <span className="material-symbols-outlined text-[#76777d] ml-3.5 mr-2 text-[20px]">
                    badge
                  </span>
                  <input
                    id="login-identifier"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="supervisor@g2seguranca.com.br"
                    className="w-full h-12 bg-transparent pr-4 text-sm text-[#0d1c2f] placeholder:text-[#76777d] focus:outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label
                    className="text-xs font-semibold text-[#0d1c2f]"
                    htmlFor="login-password"
                  >
                    Senha de Acesso
                  </label>
                  <button
                    type="button"
                    className="text-xs text-[#006c49] font-semibold hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative flex items-center bg-[#eff4ff] rounded-xl focus-within:bg-white focus-within:shadow-sm border border-transparent focus-within:border-[#6cf8bb] transition-all">
                  <span className="material-symbols-outlined text-[#76777d] ml-3.5 mr-2 text-[20px]">
                    lock
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha de 6 dígitos"
                    className="w-full h-12 bg-transparent pr-12 text-sm text-[#0d1c2f] placeholder:text-[#76777d] focus:outline-none"
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
                  <span className="text-xs text-[#0d1c2f]">Lembrar este dispositivo</span>
                </label>
                <span className="font-mono text-[10px] text-[#00714d] bg-[#6cf8bb]/30 px-2 py-0.5 rounded-full font-bold">
                  Sessão Segura
                </span>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className="w-full h-12 mt-1 rounded-xl bg-[#000000] hover:bg-slate-900 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">login</span>
                <span>Entrar na Plataforma</span>
              </button>
            </form>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-1 mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-px bg-[#dde9ff]"></div>
            </div>
            <span className="relative px-3 bg-[#f8f9ff] text-xs text-[#45464d] font-medium">
              ou acesse rapidamente com
            </span>
          </div>

          {/* Quick Access */}
          <div className="flex flex-col gap-3 mb-6">
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full h-12 rounded-xl bg-white text-[#0d1c2f] font-semibold text-sm shadow-sm flex items-center justify-between px-4 border border-[#dde9ff] hover:bg-[#eff4ff] active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#6cf8bb]/40 text-[#00714d] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">fingerprint</span>
                </div>
                <span className="text-xs font-semibold">Biometria / Face ID</span>
              </div>
              <span className="material-symbols-outlined text-[#76777d] text-[18px]">
                arrow_forward_ios
              </span>
            </button>

            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full h-12 rounded-xl bg-[#e6eeff] hover:bg-[#dde9ff] text-[#0d1c2f] font-semibold text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-[20px] text-[#006c49]">play_circle</span>
              <span>Explorar Demonstração Interativa</span>
            </button>
          </div>

          {/* Footer Security Badges */}
          <div className="flex flex-col items-center justify-center gap-2 text-center pt-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eff4ff] text-[#45464d] border border-[#dde9ff]/80">
              <span className="material-symbols-outlined text-[15px] text-[#006c49]">encrypted</span>
              <span className="font-mono text-[11px]">
                Criptografia bancária AES-256 e LGPD Compliant
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-[#76777d]">
              <span>G2 Bicos & Diárias</span>
              <span>•</span>
              <span>Versão 1.0.4</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#006c49]"></span>
                Servidores Operacionais
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
