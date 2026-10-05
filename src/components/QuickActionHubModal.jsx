import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { WhatsAppIcon } from './icons/WhatsAppIcon'
import { getMonthInfo } from '../utils/brazilianCalendar'

export function QuickActionHubModal({ isOpen, onClose, initialTab = 'cadastro' }) {
  const {
    selectedMonth,
    guards,
    posts,
    shifts,
    defaultHourlyRate,
    addGuard,
    applyAutoSchedule,
    copyMonthShifts,
    quickTodayCheckin,
    batchMarkPaid,
    getGuardCalculations,
    getPaymentStatus,
    togglePaymentStatus,
  } = useApp()

  const normalizeTab = (t) => (t === 'bico' ? 'cadastro' : t)
  const [activeTab, setActiveTab] = useState(normalizeTab(initialTab)) // 'cadastro', 'escala', 'hoje', 'pagamento'
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(normalizeTab(initialTab))
    }
  }, [initialTab, isOpen])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  // TAB 1: Fast Guard Creation
  const [quickGuard, setQuickGuard] = useState({
    name: '',
    fullName: '',
    postId: posts[0]?.id || 'diadema',
    phone: '',
    pixKey: '',
    pixType: 'CPF',
    hourlyRate: defaultHourlyRate,
    defaultShiftHours: 3,
  })

  const handleQuickAddGuard = (e) => {
    e.preventDefault()
    if (!quickGuard.name.trim()) return

    addGuard({
      name: quickGuard.name.trim(),
      fullName: quickGuard.fullName.trim() || quickGuard.name.trim(),
      postId: quickGuard.postId,
      phone: quickGuard.phone.trim(),
      pixKey: quickGuard.pixKey.trim(),
      pixType: quickGuard.pixType,
      hourlyRate: Number(quickGuard.hourlyRate),
      defaultShiftHours: Number(quickGuard.defaultShiftHours),
      active: true,
    })

    showToast(`Segurança ${quickGuard.name} cadastrado e pronto para a escala!`)
    setQuickGuard({
      name: '',
      fullName: '',
      postId: posts[0]?.id || 'diadema',
      phone: '',
      pixKey: '',
      pixType: 'CPF',
      hourlyRate: defaultHourlyRate,
      defaultShiftHours: 3,
    })
  }

  // TAB 2: Auto Schedule Generator
  const [scheduleTargetGuard, setScheduleTargetGuard] = useState(guards[0]?.id || '')
  const [schedulePattern, setSchedulePattern] = useState('even') // 'even', 'odd', 'all', '12x36_even', 'custom'
  const [scheduleHours, setScheduleHours] = useState(3)
  const [scheduleQuinzena, setScheduleQuinzena] = useState('both') // 'both', 'q1', 'q2'
  const [customDays, setCustomDays] = useState([])
  const [copySourceMonth, setCopySourceMonth] = useState('2026-08')

  // Keep schedule hours synced to guard's default (always 3h unless custom)
  useEffect(() => {
    if (scheduleTargetGuard) {
      const g = guards.find((x) => x.id === scheduleTargetGuard)
      if (g) {
        setScheduleHours(g.defaultShiftHours || 3)
      }
    }
  }, [scheduleTargetGuard, guards])

  const [year, month] = selectedMonth.split('-').map(Number)
  const monthInfo = getMonthInfo(year, month)
  const totalDaysInMonth = monthInfo.totalDays
  const monthDaysArray = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1)

  const handleApplySchedule = (e) => {
    e.preventDefault()
    if (!scheduleTargetGuard) return

    applyAutoSchedule({
      guardId: scheduleTargetGuard,
      pattern: schedulePattern,
      hours: scheduleHours,
      quinzena: scheduleQuinzena,
      customDays,
    })

    const guardName = guards.find((g) => g.id === scheduleTargetGuard)?.name || 'Segurança'
    showToast(`Escala de ${guardName} gerada com sucesso!`)
  }

  const handleCopyMonth = () => {
    if (window.confirm(`Deseja duplicar a escala completa de ${copySourceMonth} para ${selectedMonth}?`)) {
      copyMonthShifts(copySourceMonth, selectedMonth)
      showToast(`Escala duplicada com sucesso para ${selectedMonth}!`)
    }
  }

  const _toggleCustomDay = (d) => {
    if (customDays.includes(d)) {
      setCustomDays(customDays.filter((x) => x !== d))
    } else {
      setCustomDays([...customDays, d])
    }
  }

  // TAB 3: Today's Shift Check-in
  const [todayDay, setTodayDay] = useState(() => {
    const today = new Date().getDate()
    return Math.min(today, totalDaysInMonth)
  })

  const [todayRecords, setTodayRecords] = useState(() => {
    const map = {}
    guards.filter((g) => g.active).forEach((g) => {
      const existing = shifts?.[selectedMonth]?.[g.id]?.[todayDay]
      map[g.id] = existing !== undefined && existing !== null ? Number(existing) : 3
    })
    return map
  })

  // Whenever todayDay, selectedMonth, or activeTab changes, sync with existing shifts or default 3h
  useEffect(() => {
    if (activeTab === 'hoje') {
      const map = {}
      guards.filter((g) => g.active).forEach((g) => {
        const existing = shifts?.[selectedMonth]?.[g.id]?.[todayDay]
        map[g.id] = existing !== undefined && existing !== null ? Number(existing) : 3
      })
      setTodayRecords(map)
    }
  }, [todayDay, selectedMonth, activeTab, guards, shifts])

  const handleSaveTodayCheckin = () => {
    const records = Object.entries(todayRecords).map(([guardId, hours]) => ({
      guardId,
      hours: Number(hours),
    }))

    quickTodayCheckin(todayDay, records)
    showToast(`Plantão do Dia ${todayDay} lançado para toda a equipe!`)
  }

  // TAB 4: Batch Payments & Quick PIX
  const [payQuinzena, setPayQuinzena] = useState('q1')
  const activeGuards = guards.filter((g) => g.active)

  const handlePayGuard = (guard) => {
    if (guard.pixKey) {
      navigator.clipboard.writeText(guard.pixKey)
    }

    const status = getPaymentStatus(guard.id, payQuinzena)
    const qShort = payQuinzena === 'q1' ? '1ª Q' : '2ª Q'
    if (status.status !== 'PAID') {
      togglePaymentStatus(guard.id, payQuinzena)
      showToast(`Chave PIX copiada e ${guard.name} marcado como PAGO (${monthInfo.monthName.slice(0, 3)}/${year} • ${qShort})!`)
    } else {
      togglePaymentStatus(guard.id, payQuinzena)
      showToast(`Pagamento de ${guard.name} reaberto (${monthInfo.monthName.slice(0, 3)}/${year} • ${qShort}).`)
    }
  }

  const handleCopyOnlyPix = (guard, e) => {
    if (e) e.stopPropagation()
    if (!guard.pixKey) {
      showToast('Nenhuma chave PIX cadastrada para este colaborador.')
      return
    }
    navigator.clipboard.writeText(guard.pixKey)
    showToast(`Chave PIX de ${guard.name} copiada!`)
  }

  const handlePayAllQuinzena = () => {
    const qLabel = payQuinzena === 'q1' ? '1ª Quinzena' : '2ª Quinzena'
    if (window.confirm(`Deseja marcar TODOS os seguranças da ${qLabel} (${monthInfo.formattedMonth}) como pagos?`)) {
      const gids = activeGuards.map((g) => g.id)
      batchMarkPaid(payQuinzena, gids)
      showToast(`Todos os pagamentos da ${qLabel} (${monthInfo.formattedMonth}) foram quitados com sucesso!`)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-60 bg-[#131b2e] text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2 border border-white/10">
          <span className="material-symbols-outlined text-[#6cf8bb] text-[18px]">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="bg-white w-full sm:max-w-3xl rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto border border-[#dde9ff] animate-in slide-in-from-bottom duration-200">
        {/* Grabber handle for mobile */}
        <div className="w-12 h-1.5 bg-[#dde9ff] rounded-full mx-auto mb-2 sm:hidden"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#eff4ff]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#006c49] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[20px]">bolt</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0d1c2f]">
                Central de Operações Rápidas G2
              </h2>
              <p className="text-[11px] text-[#76777d]">
                Atalhos inteligentes para facilitar sua rotina diária
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#45464d] hover:bg-[#dde9ff]"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* 4 Feature Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-[#eff4ff] rounded-2xl my-3">
          <button
            type="button"
            onClick={() => setActiveTab('cadastro')}
            className={`py-2 px-1 rounded-xl text-center text-xs font-bold transition flex flex-col items-center gap-1 ${
              activeTab === 'cadastro'
                ? 'bg-white text-[#0d1c2f] shadow-xs'
                : 'text-[#45464d] hover:text-[#0d1c2f]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span className="text-[10px] leading-tight">Novo Bico</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('escala')}
            className={`py-2 px-1 rounded-xl text-center text-xs font-bold transition flex flex-col items-center gap-1 ${
              activeTab === 'escala'
                ? 'bg-white text-[#0d1c2f] shadow-xs'
                : 'text-[#45464d] hover:text-[#0d1c2f]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">auto_fix_high</span>
            <span className="text-[10px] leading-tight">Auto Escala</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hoje')}
            className={`py-2 px-1 rounded-xl text-center text-xs font-bold transition flex flex-col items-center gap-1 ${
              activeTab === 'hoje'
                ? 'bg-white text-[#0d1c2f] shadow-xs'
                : 'text-[#45464d] hover:text-[#0d1c2f]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">today</span>
            <span className="text-[10px] leading-tight">Lançar Hoje</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pagamento')}
            className={`py-2 px-1 rounded-xl text-center text-xs font-bold transition flex flex-col items-center gap-1 ${
              activeTab === 'pagamento'
                ? 'bg-white text-[#0d1c2f] shadow-xs'
                : 'text-[#45464d] hover:text-[#0d1c2f]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">payments</span>
            <span className="text-[10px] leading-tight">Pagar PIX</span>
          </button>
        </div>

        {/* TAB 1: CADASTRO ULTRA RÁPIDO */}
        {activeTab === 'cadastro' && (
          <form onSubmit={handleQuickAddGuard} className="space-y-3 pt-1">
            <div className="bg-[#eff4ff] p-3 rounded-2xl border border-[#dde9ff]/60">
              <span className="text-[11px] font-bold text-[#006c49] flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">info</span>
                Cadastro em 10 segundos: digite apenas o nome e posto!
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-[#0d1c2f] block mb-1">
                Nome na Escala *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Carlos, Rocha, Martins..."
                value={quickGuard.name}
                onChange={(e) => setQuickGuard({ ...quickGuard, name: e.target.value })}
                className="w-full h-11 px-3 bg-[#eff4ff] text-[#0d1c2f] font-semibold text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-[#006c49] border border-[#dde9ff]"
              />
            </div>

            {/* Posto com 1 Toque */}
            <div>
              <label className="text-xs font-bold text-[#0d1c2f] block mb-1">
                Selecione o Posto do Bico *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {posts.map((p) => {
                  const isSelected = quickGuard.postId === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setQuickGuard({ ...quickGuard, postId: p.id })}
                      className={`p-2.5 rounded-xl font-mono text-xs font-bold transition flex items-center gap-1.5 border ${
                        isSelected
                          ? 'bg-[#131b2e] text-white border-[#131b2e] shadow-xs'
                          : 'bg-[#eff4ff] text-[#45464d] border-[#dde9ff] hover:bg-[#dde9ff]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px] text-[#6cf8bb]">
                        location_on
                      </span>
                      <span className="truncate">{p.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Chave PIX e Telefone */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-[#0d1c2f] block mb-1">
                  Chave PIX
                </label>
                <input
                  type="text"
                  placeholder="CPF, celular, e-mail..."
                  value={quickGuard.pixKey}
                  onChange={(e) => setQuickGuard({ ...quickGuard, pixKey: e.target.value })}
                  className="w-full h-11 px-3 bg-[#eff4ff] text-[#0d1c2f] font-mono text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-[#006c49] border border-[#dde9ff]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#0d1c2f] flex items-center gap-1.5 mb-1">
                  <WhatsAppIcon className="w-3.5 h-3.5 fill-[#25D366]" />
                  <span>WhatsApp (Opcional)</span>
                </label>
                <input
                  type="tel"
                  placeholder="(11) 9...."
                  value={quickGuard.phone}
                  onChange={(e) => setQuickGuard({ ...quickGuard, phone: e.target.value })}
                  className="w-full h-11 px-3 bg-[#eff4ff] text-[#0d1c2f] text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-[#006c49] border border-[#dde9ff]"
                />
              </div>
            </div>

            {/* Smart Defaults Ribbon */}
            <div className="flex items-center justify-between p-2.5 bg-[#eff4ff] rounded-xl text-xs text-[#45464d]">
              <span>
                Valor da Hora: <strong className="text-[#006c49]">R$ {defaultHourlyRate},00</strong>
              </span>
              <span>
                Plantão: <strong className="text-[#006c49]">{quickGuard.defaultShiftHours}h padrão</strong>
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#006c49] hover:bg-[#005236] text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition active:scale-98"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Salvar Bico em 1 Clique</span>
            </button>
          </form>
        )}

        {/* TAB 2: GERADOR AUTOMÁTICO DE ESCALA */}
        {activeTab === 'escala' && (
          <form onSubmit={handleApplySchedule} className="space-y-3 pt-1">
            {/* WhatsApp Import Fast Button */}
            <div className="p-3 bg-[#25D366]/20 border border-[#25D366]/40 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <WhatsAppIcon className="w-5 h-5 fill-[#25D366] shrink-0" />
                <div>
                  <span className="text-xs font-bold text-[#0d1c2f] block leading-tight">
                    Recebeu a escala no WhatsApp?
                  </span>
                  <span className="text-[10px] text-[#45464d]">
                    Cole a mensagem para preencher os 30 dias automaticamente
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose()
                  window.dispatchEvent(new CustomEvent('open-whatsapp-importer'))
                }}
                className="px-2.5 py-1.5 bg-[#25D366] hover:bg-[#1faa53] text-[#002113] rounded-xl text-xs font-black shadow-xs active:scale-95 transition shrink-0"
              >
                Colar Texto
              </button>
            </div>

            <div className="bg-[#eff4ff] p-3 rounded-2xl border border-[#dde9ff]/60">
              <span className="text-[11px] font-bold text-[#006c49] flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">magic_button</span>
                Ou preencha com 1 toque escolhendo o padrão da escala:
              </span>
            </div>

            {/* Segurança Alvo */}
            <div>
              <label className="text-xs font-bold text-[#0d1c2f] block mb-1">
                Para qual segurança? *
              </label>
              <select
                value={scheduleTargetGuard}
                onChange={(e) => setScheduleTargetGuard(e.target.value)}
                className="w-full h-11 px-3 bg-[#eff4ff] text-[#0d1c2f] font-bold text-xs rounded-xl border border-[#dde9ff] focus:outline-none cursor-pointer"
              >
                {guards.filter((g) => g.active).map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({posts.find((p) => p.id === g.postId)?.name || 'Geral'})
                  </option>
                ))}
              </select>
            </div>

            {/* Padrões Rápidos de Escala */}
            <div>
              <label className="text-xs font-bold text-[#0d1c2f] block mb-1">
                Padrão da Escala (Como ele trabalha?)
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'even', label: 'Dias Pares (2, 4, 6, 8...)', icon: 'looks_two' },
                  { id: 'odd', label: 'Dias Ímpares (1, 3, 5, 7...)', icon: 'looks_one' },
                  { id: '12x36_odd', label: 'Escala 12x36 (Dia Sim, Dia Não)', icon: 'sync' },
                  { id: 'all', label: 'Todos os Dias do Ciclo', icon: 'calendar_month' },
                ].map((item) => {
                  const isSelected = schedulePattern === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSchedulePattern(item.id)}
                      className={`p-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 border text-left ${
                        isSelected
                          ? 'bg-[#131b2e] text-white border-[#131b2e] shadow-xs'
                          : 'bg-[#eff4ff] text-[#45464d] border-[#dde9ff] hover:bg-[#dde9ff]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px] text-[#6cf8bb]">
                        {item.icon}
                      </span>
                      <span className="text-[11px] leading-tight">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Horas do Plantão & Quinzena */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-[#0d1c2f] block mb-1">
                  Horas por Plantão
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {[3, 4, 8].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setScheduleHours(h)}
                      className={`py-2 rounded-xl font-mono text-xs font-bold transition border ${
                        scheduleHours === h
                          ? 'bg-[#006c49] text-white border-[#006c49]'
                          : 'bg-[#eff4ff] text-[#0d1c2f] border-[#dde9ff]'
                      }`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#0d1c2f] block mb-1">
                  Período
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'q1', label: '1ª Q' },
                    { id: 'q2', label: '2ª Q' },
                    { id: 'both', label: 'Mês' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setScheduleQuinzena(item.id)}
                      className={`py-2 rounded-xl text-xs font-bold transition border ${
                        scheduleQuinzena === item.id
                          ? 'bg-[#006c49] text-white border-[#006c49]'
                          : 'bg-[#eff4ff] text-[#0d1c2f] border-[#dde9ff]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Submit */}
            <button
              type="submit"
              className="w-full py-3 bg-[#006c49] hover:bg-[#005236] text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition active:scale-98"
            >
              <span className="material-symbols-outlined text-[18px]">auto_fix_high</span>
              <span>Aplicar Escala Automaticamente</span>
            </button>

            {/* Quick Duplicate from Previous Month */}
            <div className="pt-2 border-t border-[#eff4ff] flex items-center justify-between">
              <span className="text-xs text-[#76777d]">Ou copie a escala do mês anterior:</span>
              <button
                type="button"
                onClick={handleCopyMonth}
                className="px-3 py-1.5 bg-[#eff4ff] hover:bg-[#dde9ff] text-[#0d1c2f] rounded-xl text-xs font-bold border border-[#dde9ff] flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[15px]">content_copy</span>
                <span>Duplicar Escala</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: LANÇAMENTO RÁPIDO DO PLANTÃO DE HOJE */}
        {activeTab === 'hoje' && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between bg-[#eff4ff] p-3 rounded-2xl border border-[#dde9ff]/60">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006c49]">today</span>
                <span className="text-xs font-bold text-[#0d1c2f]">
                  Plantão do Dia:
                </span>
              </div>
              <select
                value={todayDay}
                onChange={(e) => setTodayDay(Number(e.target.value))}
                className="bg-white px-2.5 py-1 rounded-xl text-xs font-bold text-[#0d1c2f] border border-[#dde9ff] cursor-pointer"
              >
                {monthDaysArray.map((d) => (
                  <option key={d} value={d}>
                    Dia {String(d).padStart(2, '0')}/{month}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Helper and Batch Buttons */}
            <div className="flex items-center justify-between text-xs text-[#76777d]">
              <span className="text-[11px]">
                Padrão: <strong className="text-[#006c49]">3h</strong>. Ajuste no <strong>(+)</strong> ou <strong>(-)</strong>:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const map = {}
                    guards.filter((g) => g.active).forEach((g) => {
                      map[g.id] = 3
                    })
                    setTodayRecords(map)
                    showToast('Todos os plantões definidos para 3h!')
                  }}
                  className="px-2 py-0.5 rounded-lg bg-[#006c49]/10 hover:bg-[#006c49]/20 text-[#006c49] font-bold text-[10px] border border-[#006c49]/30 transition"
                  title="Definir 3 horas para todos os seguranças"
                >
                  Todos 3h
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const map = {}
                    guards.filter((g) => g.active).forEach((g) => {
                      map[g.id] = 0
                    })
                    setTodayRecords(map)
                    showToast('Todos definidos com folga (0h)!')
                  }}
                  className="px-2 py-0.5 rounded-lg bg-[#eff4ff] hover:bg-[#dde9ff] text-[#76777d] font-bold text-[10px] border border-[#dde9ff] transition"
                  title="Zerar horas de todos os seguranças"
                >
                  Zerar (0h)
                </button>
              </div>
            </div>

            {/* Quick check-in list with stepper (+ / -) */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {guards.filter((g) => g.active).map((guard) => {
                const currentH = todayRecords[guard.id] ?? 3
                const rate = guard.hourlyRate || defaultHourlyRate
                const dailyTotal = currentH * rate
                const post = posts.find((p) => p.id === guard.postId)

                return (
                  <div
                    key={guard.id}
                    className="p-2.5 bg-white rounded-2xl border border-[#dde9ff] flex items-center justify-between shadow-2xs hover:border-[#006c49]/40 transition"
                  >
                    <div className="min-w-0 pr-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-[#0d1c2f] truncate">
                          {guard.name}
                        </span>
                        {currentH > 3 && (
                          <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300 font-black px-1.5 py-0.2 rounded-full shrink-0">
                            ★ +{currentH - 3}h Extra
                          </span>
                        )}
                        {currentH === 0 && (
                          <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.2 rounded-full shrink-0">
                            Folga
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#76777d] block truncate">
                        📍 {post?.name || 'Posto'} • <strong className="text-[#006c49] font-mono font-bold">R$ {dailyTotal.toFixed(2).replace('.', ',')}</strong>
                      </span>
                    </div>

                    {/* Stepper with - and + and presets */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Stepper (- / +) */}
                      <div className="flex items-center bg-[#eff4ff] border border-[#dde9ff] rounded-xl p-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => {
                            const newH = Math.max(0, currentH - 1)
                            setTodayRecords({ ...todayRecords, [guard.id]: newH })
                          }}
                          className="w-7 h-7 rounded-lg bg-white hover:bg-[#dde9ff] text-[#0d1c2f] font-black text-sm flex items-center justify-center transition active:scale-95 shadow-2xs"
                          title="Diminuir 1 hora (-1h)"
                        >
                          -
                        </button>

                        <span
                          className={`w-8 text-center font-mono text-xs font-black ${
                            currentH === 0
                              ? 'text-slate-400'
                              : currentH > 3
                              ? 'text-amber-800'
                              : 'text-[#006c49]'
                          }`}
                        >
                          {currentH}h
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            const newH = Math.min(24, currentH + 1)
                            setTodayRecords({ ...todayRecords, [guard.id]: newH })
                          }}
                          className="w-7 h-7 rounded-lg bg-[#006c49] hover:bg-[#005236] text-white font-black text-sm flex items-center justify-center transition active:scale-95 shadow-2xs"
                          title="Aumentar 1 hora (+1h)"
                        >
                          +
                        </button>
                      </div>

                      {/* Fast Presets: 0h, 3h, 4h, 6h */}
                      <div className="flex items-center gap-1">
                        {[0, 3, 4, 6].map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() =>
                              setTodayRecords({ ...todayRecords, [guard.id]: h })
                            }
                            className={`h-7 px-1.5 min-w-[28px] rounded-lg font-mono text-[10px] font-bold transition ${
                              currentH === h
                                ? 'bg-[#006c49] text-white shadow-xs'
                                : 'bg-[#eff4ff] text-[#45464d] hover:bg-[#dde9ff]'
                            }`}
                            title={h === 0 ? 'Folga (0h)' : `${h} horas de plantão`}
                          >
                            {h === 0 ? '0h' : `${h}h`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              type="button"
              onClick={handleSaveTodayCheckin}
              className="w-full py-3 bg-[#006c49] hover:bg-[#005236] text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition active:scale-98"
            >
              <span className="material-symbols-outlined text-[18px]">done_all</span>
              <span>Confirmar Plantão de Hoje para Todos</span>
            </button>
          </div>
        )}

        {/* TAB 4: PAGAMENTO RÁPIDO PIX */}
        {activeTab === 'pagamento' && (
          <div className="space-y-3 pt-1">
            {/* High-Visibility Month Competência Banner */}
            <div className="bg-[#131b2e] text-white p-3.5 rounded-2xl border border-white/10 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#6cf8bb]/20 text-[#6cf8bb] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">calendar_month</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[#bec6e0] block font-bold">
                    Mês de Competência do Pagamento
                  </span>
                  <span className="text-sm font-black text-[#6cf8bb] capitalize leading-none">
                    {monthInfo.formattedMonth}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-white/70 block font-mono">Quinzena Ativa</span>
                <span className="text-xs font-black text-white font-mono bg-white/10 px-2 py-0.5 rounded-md">
                  {payQuinzena === 'q1' ? '1ª Q (01 a 15)' : `2ª Q (16 a ${totalDaysInMonth})`}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between bg-[#eff4ff] p-2.5 rounded-2xl border border-[#dde9ff]/60">
              <span className="text-xs font-bold text-[#0d1c2f]">Quinzena:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setPayQuinzena('q1')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    payQuinzena === 'q1'
                      ? 'bg-[#006c49] text-white shadow-xs'
                      : 'bg-white text-[#45464d] border border-[#dde9ff]'
                  }`}
                >
                  1ª Quinzena (01-15)
                </button>
                <button
                  type="button"
                  onClick={() => setPayQuinzena('q2')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    payQuinzena === 'q2'
                      ? 'bg-[#006c49] text-white shadow-xs'
                      : 'bg-white text-[#45464d] border border-[#dde9ff]'
                  }`}
                >
                  2ª Quinzena (16-{totalDaysInMonth})
                </button>
              </div>
            </div>

            {/* Financial Differentiation Strip: Total vs Já Pago vs A Pagar */}
            {(() => {
              let qTotal = 0
              let qPaid = 0
              let qPending = 0
              activeGuards.forEach((g) => {
                const c = getGuardCalculations(g.id)
                const amt = payQuinzena === 'q1' ? c.q1Total : c.q2Total
                qTotal += amt
                const s = getPaymentStatus(g.id, payQuinzena)
                if (s.status === 'PAID') {
                  qPaid += amt
                } else {
                  qPending += amt
                }
              })

              return (
                <div className="grid grid-cols-3 gap-1.5 p-2.5 bg-[#131b2e] rounded-2xl text-white shadow-xs border border-white/10">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#bec6e0] uppercase font-mono">Total Previsto</span>
                    <span className="font-mono text-xs font-bold text-white mt-0.5">
                      R$ {qTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex flex-col border-x border-white/10 px-2">
                    <span className="text-[10px] text-[#6cf8bb] uppercase font-mono font-bold flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">check_circle</span>
                      Já Pago
                    </span>
                    <span className="font-mono text-xs font-bold text-[#6cf8bb] mt-0.5">
                      R$ {qPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] text-[#ffddb8] uppercase font-mono font-bold flex items-center justify-end gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">schedule</span>
                      A Pagar
                    </span>
                    <span className="font-mono text-xs font-bold text-[#ffddb8] mt-0.5">
                      R$ {qPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )
            })()}

            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-[#76777d]">
                Prestadores • <strong className="text-[#0d1c2f]">{monthInfo.formattedMonth}</strong>:
              </span>
              <button
                type="button"
                onClick={handlePayAllQuinzena}
                className="text-xs font-bold text-[#006c49] hover:underline"
              >
                Pagar Todos ({payQuinzena === 'q1' ? '1ª Q' : '2ª Q'} • {monthInfo.monthName.slice(0, 3)}/{year})
              </button>
            </div>

            {/* Quick PIX list */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {activeGuards.map((guard) => {
                const calc = getGuardCalculations(guard.id)
                const amount = payQuinzena === 'q1' ? calc.q1Total : calc.q2Total
                const hours = payQuinzena === 'q1' ? calc.q1Hours : calc.q2Hours
                const status = getPaymentStatus(guard.id, payQuinzena)
                const isPaid = status.status === 'PAID'

                return (
                  <div
                    key={guard.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isPaid
                        ? 'bg-[#006c49]/5 border-[#6cf8bb]/60'
                        : 'bg-white border-[#dde9ff] shadow-xs'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-[#0d1c2f] truncate">
                          {guard.name}
                        </span>
                        <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-[#eff4ff] text-[#006c49] font-bold border border-[#dde9ff]">
                          {monthInfo.monthName.slice(0, 3).toUpperCase()}/{year}
                        </span>
                        {isPaid && (
                          <span className="font-mono text-[9px] px-1.5 py-0.2 rounded-full bg-[#006c49] text-white font-bold">
                            Quitado
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-[#76777d]">
                        <span className="font-mono text-[10px] truncate max-w-[130px]">
                          PIX: {guard.pixKey || 'Não cadastrado'}
                        </span>
                        {guard.pixKey && (
                          <button
                            type="button"
                            onClick={(e) => handleCopyOnlyPix(guard, e)}
                            className="text-[#45464d] hover:text-[#0d1c2f] transition"
                            title="Copiar Chave PIX"
                          >
                            <span className="material-symbols-outlined text-[13px]">content_copy</span>
                          </button>
                        )}
                      </div>
                      <span className={`font-mono text-xs font-bold block mt-0.5 ${isPaid ? 'text-[#006c49]' : 'text-[#b45309]'}`}>
                        {isPaid ? 'Pago: ' : 'A Pagar: '}R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({hours}h)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handlePayGuard(guard)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-xs ${
                          isPaid
                            ? 'bg-[#006c49] text-white border border-[#6cf8bb] hover:bg-[#005236]'
                            : 'bg-[#006c49] hover:bg-[#005236] text-white'
                        }`}
                        title={
                          isPaid
                            ? `Pagamento de ${guard.name} marcado como PAGO. Clique novamente para retirar o pagamento e reabrir.`
                            : `Clique para pagar ${guard.name} (${monthInfo.formattedMonth})`
                        }
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {isPaid ? 'check_circle' : 'payments'}
                        </span>
                        <span>{isPaid ? '✓ Pago' : 'Pagar'}</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
