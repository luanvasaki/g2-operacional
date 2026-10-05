import React from 'react'

export function G2Logo({ className = 'h-11 w-auto', showBadge = false }) {
  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <img
        src="/logo-g2.png"
        alt="G2 Atacado de Bebidas"
        className={`${className} object-contain transition-transform`}
        onError={(e) => {
          // Fallback to jpg if png fails
          e.currentTarget.src = '/logo-g2.jpg'
        }}
      />
      {showBadge && (
        <div className="absolute -bottom-1 -right-1 bg-[#6cf8bb] text-[#00714d] px-1.5 py-0.5 rounded-full flex items-center shadow-xs">
          <span className="material-symbols-outlined text-[13px]">bolt</span>
        </div>
      )}
    </div>
  )
}
