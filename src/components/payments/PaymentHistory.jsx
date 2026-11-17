import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { formatCurrencyBR } from '../../utils/brazilianCalendar'
import { buildMonthOptions } from '../../utils/months'

/** Histórico geral de pagamentos confirmados (auditoria do gestor). */
export function PaymentHistory({ records, showToast }) {
  const { selectedMonth, setSelectedMonth, togglePaymentStatus } = useApp()
  const [historySearch, setHistorySearch] = useState('')
  const [historyMonthFilter, setHistoryMonthFilter] = useState('all')
  const [showHistory, setShowHistory] = useState(true)

  const filteredHistory = records.filter((rec) => {
    const matchMonth = historyMonthFilter === 'all' || rec.month === historyMonthFilter
    const matchSearch =
      !historySearch.trim() ||
      rec.guardName.toLowerCase().includes(historySearch.toLowerCase()) ||
      rec.guardFullName.toLowerCase().includes(historySearch.toLowerCase()) ||
      rec.pixKey.toLowerCase().includes(historySearch.toLowerCase())
    return matchMonth && matchSearch
  })

  return (
      <section className="bg-white rounded-3xl p-5 shadow-xs border border-line flex flex-col gap-4 mt-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-field pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand text-white flex items-center justify-center font-black shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[24px]">verified</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-ink">
                  Histórico Geral de Pagamentos Confirmados
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-brand font-mono text-xs font-bold border border-emerald-200">
                  {records.length} Pagamentos Registrados
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-0.5">
                Auditoria completa: consulte quando cada pagamento foi feito, chave PIX utilizada e mês de competência correspondente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative min-w-[200px]">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-ink-muted">
                search
              </span>
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Buscar prestador..."
                className="w-full text-xs pl-9 pr-3 py-2 bg-page border border-line rounded-xl outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            {/* Filter by Month */}
            <select
              value={historyMonthFilter}
              onChange={(e) => setHistoryMonthFilter(e.target.value)}
              className="text-xs font-bold px-3 py-2 bg-page border border-line rounded-xl text-ink outline-none cursor-pointer"
            >
              <option value="all">Todos os Meses</option>
              {buildMonthOptions({ selected: historyMonthFilter, back: 12, ahead: 0 }).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-field text-ink hover:bg-line transition cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">
                {showHistory ? 'expand_less' : 'expand_more'}
              </span>
              <span>{showHistory ? 'Recolher' : 'Expandir'}</span>
            </button>
          </div>
        </div>

        {showHistory && (
          <>
            {filteredHistory.length === 0 ? (
              <div className="py-8 text-center text-ink-muted flex flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[36px] text-on-navy">
                  receipt_long
                </span>
                <p className="text-sm font-semibold">Nenhum pagamento encontrado com os filtros selecionados.</p>
                <p className="text-xs">Selecione "Todos os Meses" ou limpe a busca para visualizar os registros.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-line">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-field text-ink border-b border-line">
                      <th className="py-3 px-3.5 font-black">Data / Horário</th>
                      <th className="py-3 px-3.5 font-black">Prestador</th>
                      <th className="py-3 px-3.5 font-black">Competência</th>
                      <th className="py-3 px-3.5 font-black">Quinzena</th>
                      <th className="py-3 px-3.5 font-black">Horas</th>
                      <th className="py-3 px-3.5 font-black">Valor Quitado</th>
                      <th className="py-3 px-3.5 font-black">Chave PIX</th>
                      <th className="py-3 px-3.5 font-black">Status</th>
                      <th className="py-3 px-3.5 font-black text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-field bg-white">
                    {filteredHistory.map((rec) => {
                      let dateStr = 'Gravado na Nuvem'
                      if (rec.paidAt) {
                        try {
                          const d = new Date(rec.paidAt)
                          if (!isNaN(d.getTime())) {
                            dateStr = d.toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          }
                        } catch {}
                      }

                      return (
                        <tr key={rec.key} className="hover:bg-page transition-colors">
                          <td className="py-3 px-3.5 font-mono text-xs text-ink-soft whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[15px] text-emerald-600">
                                event_available
                              </span>
                              <span>{dateStr}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3.5 font-bold text-ink">
                            <span>{rec.guardName}</span>
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-field text-brand border border-line">
                              {rec.monthName}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap text-ink-soft font-semibold">
                            {rec.quinzena === 'q1' ? '1ª Quinzena (01 a 15)' : '2ª Quinzena (16 ao fim)'}
                          </td>
                          <td className="py-3 px-3.5 font-mono font-bold text-ink">
                            {rec.hours > 0 ? `${rec.hours}h` : '—'}
                          </td>
                          <td className="py-3 px-3.5 font-mono font-black text-emerald-700 whitespace-nowrap">
                            {rec.amount > 0 ? formatCurrencyBR(rec.amount) : 'Quitado'}
                          </td>
                          <td className="py-3 px-3.5 font-mono text-xs text-ink-soft">
                            {rec.pixKey ? (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(rec.pixKey)
                                  showToast(`Chave PIX de ${rec.guardName} copiada!`)
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-field hover:bg-line text-ink transition cursor-pointer"
                                title="Copiar PIX"
                              >
                                <span className="material-symbols-outlined text-[13px]">content_copy</span>
                                <span className="truncate max-w-[120px]">{rec.pixKey}</span>
                              </button>
                            ) : (
                              <span className="text-on-navy italic">Sem PIX</span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <span className="material-symbols-outlined text-[13px]">check_circle</span>
                              PAGO
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {rec.month !== selectedMonth && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedMonth(rec.month)}
                                  className="px-2 py-1 rounded-lg bg-field hover:bg-line text-ink font-bold text-[11px] transition cursor-pointer"
                                  title="Ver folha desta competência"
                                >
                                  Ver Folha
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Deseja reabrir e marcar como PENDENTE a ${rec.quinzena === 'q1' ? '1ª' : '2ª'} Quinzena de ${rec.guardName} (${rec.monthName})?`)) {
                                    togglePaymentStatus(rec.guardId, rec.quinzena, rec.month)
                                    showToast(`Pagamento de ${rec.guardName} reaberto (Pendente).`)
                                  }
                                }}
                                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] transition cursor-pointer border border-rose-200"
                                title="Desfazer marcação de pago"
                              >
                                Reabrir
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
  )
}
