import React from 'react'
import { G2Logo } from './G2Logo'
import { useApp } from '../context/AppContext'

export function Header({ activeTab, setActiveTab, onGoHome, onOpenQuickHub }) {
  const { currentUser, logout, isSupabaseConfigured, isSyncing, getPendingPaymentsSummary } = useApp()
  const { pendingCount } = getPendingPaymentsSummary ? getPendingPaymentsSummary('both') : { pendingCount: 0 }

  const navTabs = [
    { id: 'dashboard', label: 'Início', icon: 'dashboard' },
    { id: 'quinzena-horas', label: 'Escala & Horas', icon: 'calendar_month' },
    { id: 'prestadores', label: 'Equipe / Bicos', icon: 'group' },
    { id: 'pagamentos', label: 'Pagamentos PIX', icon: 'payments', badge: pendingCount },
    { id: 'configuracoes', label: 'Ajustes', icon: 'settings' },
  ]

  const getTabTitle = (tab) => {
    switch (tab) {
      case 'dashboard':
        return 'Painel Geral'
      case 'quinzena-horas':
        return 'Escala & Horas'
      case 'prestadores':
        return 'Prestadores'
      case 'pagamentos':
      case 'extratos-recibos':
        return 'Pagamentos PIX'
      case 'configuracoes':
        return 'Ajustes'
      default:
        return 'G2 Operacional'
    }
  }

  return (
    <header className="fixed top-0 w-full z-40 bg-[#f8f9ff]/90 backdrop-blur-xl border-b border-[#dde9ff]/80 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="max-w-[1920px] 2xl:max-w-full mx-auto h-16 px-3 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 flex items-center justify-between gap-3">
        {/* Brand & Page Info - Click to go Home/Dashboard */}
        <button
          type="button"
          onClick={onGoHome}
          className="flex items-center gap-2.5 sm:gap-3 shrink-0 text-left hover:opacity-90 active:scale-95 transition cursor-pointer"
          title="Clique para voltar ao Início"
        >
          <G2Logo className="h-10 sm:h-12 w-auto shrink-0 drop-shadow-xs" />
          <div className="flex flex-col truncate">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-[#76777d] uppercase tracking-wider font-semibold">
                G2 Atacadista
              </span>
              {isSupabaseConfigured && (
                <span
                  title={isSyncing ? 'Sincronizando com a nuvem...' : 'Conectado à nuvem'}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  <span className={`w-1 h-1 rounded-full bg-emerald-500 ${isSyncing ? 'animate-ping' : ''}`} />
                  {isSyncing ? 'Sincronizando...' : 'Nuvem Conectada'}
                </span>
              )}
            </div>
            <h1 className="text-xs sm:text-sm font-bold text-[#0d1c2f] truncate leading-tight md:hidden">
              {getTabTitle(activeTab)}
            </h1>
            <span className="hidden md:inline font-bold text-xs text-[#0d1c2f]">
              Controle Operacional
            </span>
          </div>
        </button>

        {/* DESKTOP NAVIGATION TABS (Visible on PC / Tablet >= 768px) */}
        {setActiveTab && (
          <nav className="hidden md:flex items-center gap-1 bg-[#eff4ff]/80 p-1 rounded-2xl border border-[#dde9ff]">
            {navTabs.map((tab) => {
              const isActive =
                activeTab === tab.id ||
                (tab.id === 'pagamentos' && activeTab === 'extratos-recibos')

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                    isActive
                      ? 'bg-[#0d1c2f] text-white shadow-xs'
                      : 'text-[#45464d] hover:text-[#0d1c2f] hover:bg-white/60'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[18px]"
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>

                  {tab.badge > 0 && (
                    <span
                      className={`min-w-[18px] h-[18px] px-1 font-mono text-[10px] font-black rounded-full flex items-center justify-center ${
                        isActive
                          ? 'bg-amber-400 text-slate-900'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        )}

        {/* Right Tools (Quick Action on PC, Notifications & User Chip) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Launch Action Button on PC */}
          {onOpenQuickHub && (
            <button
              type="button"
              onClick={onOpenQuickHub}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-[#006c49] hover:bg-[#005236] text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
              title="Ações Rápidas (Cadastro, Escala, Plantão)"
            >
              <span className="material-symbols-outlined text-[17px]">bolt</span>
              <span>Ação Rápida</span>
            </button>
          )}

          {/* User profile & Sair button */}
          <div className="flex items-center gap-1.5 bg-[#eff4ff] border border-[#dde9ff] rounded-full p-1 pl-2.5 shadow-2xs">
            <span className="text-xs font-bold text-[#0d1c2f] hidden sm:inline">
              {currentUser?.name?.split(' ')[0] || 'Luan'}
            </span>
            <div className="w-6 h-6 rounded-full bg-[#006c49] text-white flex items-center justify-center font-bold text-[11px] shadow-xs">
              {currentUser?.name?.charAt(0) || 'L'}
            </div>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer ml-0.5"
              title="Sair do sistema (exigirá senha novamente)"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span className="text-[11px]">Sair</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
