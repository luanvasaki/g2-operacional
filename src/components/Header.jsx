import React from 'react'
import { G2Logo } from './G2Logo'
import { useApp } from '../context/AppContext'

export function Header({ activeTab, onGoHome }) {
  const { currentUser, logout, isSupabaseConfigured, isSyncing } = useApp()

  const getTabTitle = (tab) => {
    switch (tab) {
      case 'dashboard':
        return 'Dashboard'
      case 'quinzena-horas':
        return 'Horas'
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
    <header className="fixed top-0 w-full z-40 bg-[#f8f9ff]/85 backdrop-blur-xl border-b border-[#dde9ff]/80 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="max-w-4xl mx-auto h-16 px-4 flex items-center justify-between gap-2">
        {/* Brand & Page Info - Click to go Home/Dashboard */}
        <button
          type="button"
          onClick={onGoHome}
          className="flex items-center gap-3 min-w-0 text-left hover:opacity-85 active:scale-95 transition cursor-pointer"
          title="Clique para voltar à tela inicial (Dashboard)"
        >
          <G2Logo className="h-11 sm:h-12 w-auto shrink-0 drop-shadow-xs" />
          <div className="flex flex-col truncate">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-[#76777d] uppercase tracking-wider font-semibold">
                G2 Diárias
              </span>
              {isSupabaseConfigured && (
                <span
                  title={isSyncing ? 'Sincronizando com Supabase...' : 'Conectado à nuvem Supabase'}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  <span className={`w-1 h-1 rounded-full bg-emerald-500 ${isSyncing ? 'animate-ping' : ''}`} />
                  {isSyncing ? 'Sincronizando' : 'Nuvem'}
                </span>
              )}
            </div>
            <h1 className="text-sm font-bold text-[#0d1c2f] truncate leading-tight">
              {getTabTitle(activeTab)}
            </h1>
          </div>
        </button>

        {/* Right Tools (Notifications & Profile) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            aria-label="Notificações"
            className="w-10 h-10 flex items-center justify-center rounded-full text-[#45464d] hover:text-[#0d1c2f] hover:bg-[#eff4ff] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
          </button>

          <button
            onClick={logout}
            className="flex items-center gap-2 p-1 pl-2 rounded-full bg-[#eff4ff] hover:bg-[#dde9ff] border border-[#dde9ff] transition-all"
            title="Clique para sair"
          >
            <span className="text-[11px] font-semibold text-[#0d1c2f] hidden sm:inline">
              {currentUser?.name?.split(' ')[0] || 'Gestor'}
            </span>
            <div className="w-7 h-7 rounded-full bg-[#006c49] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {currentUser?.name?.charAt(0) || 'G'}
            </div>
          </button>
        </div>
      </div>
    </header>
  )
}
