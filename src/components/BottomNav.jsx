import React from 'react'
import { useApp } from '../context/AppContext'

export function BottomNav({ activeTab, setActiveTab }) {
  const { getPendingPaymentsSummary } = useApp()
  const { pendingCount } = getPendingPaymentsSummary ? getPendingPaymentsSummary('both') : { pendingCount: 0 }

  const navItems = [
    { id: 'dashboard', label: 'Início', icon: 'dashboard' },
    { id: 'quinzena-horas', label: 'Horas', icon: 'calendar_month' },
    { id: 'prestadores', label: 'Equipe', icon: 'group' },
    { id: 'pagamentos', label: 'Pagamentos', icon: 'payments' },
    { id: 'configuracoes', label: 'Ajustes', icon: 'settings' },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 w-full z-40 bg-white/95 backdrop-blur-xl border-t border-[#dde9ff] shadow-[0_-2px_12px_rgba(13,28,47,0.06)] print:hidden">
      <div className="max-w-md mx-auto flex justify-around items-center h-16 px-1">
        {navItems.map((item) => {
          const isActive =
            activeTab === item.id ||
            (item.id === 'pagamentos' && activeTab === 'extratos-recibos')
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] transition-all cursor-pointer relative ${
                isActive
                  ? 'text-[#006c49] font-bold scale-105'
                  : 'text-[#45464d] hover:text-[#0d1c2f]'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
                {item.id === 'pagamentos' && pendingCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 bg-amber-500 text-white font-mono text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-pulse"
                    title={`${pendingCount} pagamentos pendentes`}
                  >
                    {pendingCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium leading-none">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
