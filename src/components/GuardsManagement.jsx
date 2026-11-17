import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { WhatsAppIcon } from './icons/WhatsAppIcon'
import { GuardScheduleEditModal } from './GuardScheduleEditModal'

export function GuardsManagement({
  isModalOpen,
  setIsModalOpen,
  editingGuard,
  setEditingGuard,
  onOpenQuickHub,
  onOpenMultiDay,
}) {
  const {
    guards,
    posts,
    defaultHourlyRate,
    addGuard,
    updateGuard,
    deleteGuard,
    toggleGuardActive,
    getGuardCalculations,
    isDirector,
  } = useApp()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos') // 'todos', 'ativo', 'pendente', 'inativo'
  const [deleteConfirmGuard, setDeleteConfirmGuard] = useState(null)
  const [historyModalGuard, setHistoryModalGuard] = useState(null)
  const [scheduleEditGuard, setScheduleEditGuard] = useState(null)
  const [toastMessage, setToastMessage] = useState('')

  // Form State for Add / Edit Bottom Sheet
  const [formData, setFormData] = useState({
    name: '',
    fullName: '',
    postId: null,
    phone: '',
    pixKey: '',
    pixType: 'CPF',
    hourlyRate: defaultHourlyRate,
    defaultShiftHours: 3,
  })

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handleOpenAdd = () => {
    setEditingGuard(null)
    setFormData({
      name: '',
      fullName: '',
      postId: null,
      phone: '',
      pixKey: '',
      pixType: 'CPF',
      hourlyRate: defaultHourlyRate,
      defaultShiftHours: 3,
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (guard) => {
    setEditingGuard(guard)
    setFormData({
      name: guard.name || '',
      fullName: guard.fullName || '',
      postId: null,
      phone: guard.phone || '',
      pixKey: guard.pixKey || '',
      pixType: guard.pixType || 'CPF',
      hourlyRate: guard.hourlyRate || defaultHourlyRate,
      defaultShiftHours: guard.defaultShiftHours || 3,
    })
    setIsModalOpen(true)
  }

  const handleSubmitForm = (e) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    if (editingGuard) {
      updateGuard(editingGuard.id, {
        ...formData,
        hourlyRate: Number(formData.hourlyRate),
        defaultShiftHours: Number(formData.defaultShiftHours),
      })
      showToast(`${formData.name} atualizado com sucesso!`)
    } else {
      addGuard({
        ...formData,
        hourlyRate: Number(formData.hourlyRate),
        defaultShiftHours: Number(formData.defaultShiftHours),
      })
      showToast(`${formData.name} adicionado à equipe da obra!`)
    }
    setIsModalOpen(false)
    setEditingGuard(null)
  }

  const confirmDeactivate = () => {
    if (deleteConfirmGuard) {
      toggleGuardActive(deleteConfirmGuard.id)
      showToast(`${deleteConfirmGuard.name} foi inativado. Histórico salvo intacto.`)
      setDeleteConfirmGuard(null)
    }
  }

  // Supervisor não troca uma chave PIX já cadastrada (só o diretor)
  const isPixLocked = Boolean(!isDirector && editingGuard?.pixKey?.trim())

  const confirmHardDelete = () => {
    if (!isDirector) return
    if (deleteConfirmGuard) {
      deleteGuard(deleteConfirmGuard.id)
      showToast(`${deleteConfirmGuard.name} excluído do apontamento.`)
      setDeleteConfirmGuard(null)
    }
  }

  // Filter logic (Folguista é substituto avulso de fora, não faz parte do cadastro fixo)
  const regularGuards = guards.filter(
    (g) => g.id !== 'g-folguista' && g.name?.toLowerCase() !== 'folguista'
  )

  const filteredGuards = regularGuards.filter((g) => {
    const q = searchTerm.toLowerCase().trim()
    const matchesSearch =
      !q ||
      g.name.toLowerCase().includes(q) ||
      g.fullName?.toLowerCase().includes(q) ||
      g.pixKey?.toLowerCase().includes(q) ||
      posts.find((p) => p.id === g.postId)?.name.toLowerCase().includes(q)

    let matchesStatus = true
    if (statusFilter === 'ativo') matchesStatus = g.active
    else if (statusFilter === 'inativo') matchesStatus = !g.active
    else if (statusFilter === 'pendente') matchesStatus = g.active // simulated pending check

    return matchesSearch && matchesStatus
  })

  const activeCount = regularGuards.filter((g) => g.active).length
  const inactiveCount = regularGuards.filter((g) => !g.active).length

  return (
    <div className="flex flex-col w-full gap-4 pb-28 max-w-[1920px] 2xl:max-w-full mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-navy text-white px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2 border border-white/10">
          <span className="material-symbols-outlined text-mint text-[18px]">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Stat Cards (Bento-style overview) */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white p-3 rounded-2xl shadow-xs border border-line flex flex-col justify-between">
          <div className="flex items-center justify-between text-brand">
            <span className="material-symbols-outlined text-[18px]">engineering</span>
            <span className="w-2 h-2 rounded-full bg-brand"></span>
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-ink leading-none">
              {activeCount}
            </span>
            <p className="text-[11px] text-ink-muted mt-1 truncate">
              Ativos na Equipe
            </p>
          </div>
        </div>

        <div className="bg-white p-3 rounded-2xl shadow-xs border border-line flex flex-col justify-between">
          <div className="flex items-center text-ink-soft">
            <span className="material-symbols-outlined text-[18px]">payments</span>
          </div>
          <div className="mt-2">
            <span className="font-mono text-base font-bold text-ink leading-none">
              R$ {defaultHourlyRate}
            </span>
            <p className="text-[11px] text-ink-muted mt-1 truncate">
              Taxa Média/h
            </p>
          </div>
        </div>

        <div className="bg-mint/20 p-3 rounded-2xl shadow-xs border border-mint/30 flex flex-col justify-between">
          <div className="flex items-center text-brand-text">
            <span className="material-symbols-outlined text-[18px]">person_add</span>
          </div>
          <div className="mt-2">
            <span className="font-mono text-xl font-bold text-brand-text leading-none">
              {posts.length}
            </span>
            <p className="text-[11px] text-brand-text mt-1 truncate">
              Postos Ativos
            </p>
          </div>
        </div>
      </div>

      {/* Primary Action Buttons: Fast 10s Registration & Full Registration */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onOpenQuickHub?.('cadastro')}
          className="bg-brand hover:bg-brand-hover text-white py-3 px-3 rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all font-bold text-xs"
        >
          <span className="material-symbols-outlined text-[18px]">bolt</span>
          <span>Cadastro Rápido (10s)</span>
        </button>

        <button
          onClick={handleOpenAdd}
          className="bg-navy hover:bg-slate-900 text-white py-3 px-3 rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all font-bold text-xs"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          <span>Cadastro Completo</span>
        </button>
      </div>

      {/* Search & Filter Area */}
      <div className="flex flex-col gap-2">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, função ou PIX..."
            className="w-full h-11 pl-10 pr-10 bg-white text-ink text-xs rounded-xl shadow-xs border border-line focus:outline-none focus:border-mint placeholder:text-ink-muted"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setStatusFilter('todos')}
            className={`px-3 py-1 rounded-full font-mono text-xs font-bold shrink-0 transition-colors ${
 statusFilter === 'todos'
 ? 'bg-black text-white shadow-xs'
 : 'bg-field text-ink-soft hover:bg-line'
 }`}
          >
            Todos ({guards.length})
          </button>
          <button
            onClick={() => setStatusFilter('ativo')}
            className={`px-3 py-1 rounded-full font-mono text-xs font-bold shrink-0 transition-colors ${
 statusFilter === 'ativo'
 ? 'bg-black text-white shadow-xs'
 : 'bg-field text-ink-soft hover:bg-line'
 }`}
          >
            Ativos ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('pendente')}
            className={`px-3 py-1 rounded-full font-mono text-xs font-bold shrink-0 transition-colors ${
 statusFilter === 'pendente'
 ? 'bg-black text-white shadow-xs'
 : 'bg-field text-ink-soft hover:bg-line'
 }`}
          >
            Em Escala ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('inativo')}
            className={`px-3 py-1 rounded-full font-mono text-xs font-bold shrink-0 transition-colors ${
 statusFilter === 'inativo'
 ? 'bg-black text-white shadow-xs'
 : 'bg-field text-ink-soft hover:bg-line'
 }`}
          >
            Inativos ({inactiveCount})
          </button>
        </div>
      </div>

      {/* Workers Roster List - Responsive Grid for PC & Mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredGuards.map((guard) => {
          const post = posts.find((p) => p.id === guard.postId)
          return (
            <div
              key={guard.id}
              className={`bg-white rounded-2xl p-3.5 shadow-xs border transition-all flex flex-col gap-2.5 ${
 guard.active
 ? 'border-line hover:border-mint'
 : 'border-line/60 opacity-60 bg-page'
 }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-line flex items-center justify-center text-ink font-bold text-xs shrink-0">
                    {guard.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-ink truncate">
                        {guard.name}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${
 guard.active
 ? 'bg-mint/30 text-brand-text'
 : 'bg-red-100 text-red-700'
 }`}
                      >
                        {guard.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <span className="text-xs text-ink-muted truncate">
                      Colaborador Operacional
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setScheduleEditGuard(guard)}
                  className="text-right shrink-0 hover:opacity-75 transition group"
                  title="Clique para editar escala e valor da hora (R$)"
                >
                  <span className="font-mono text-xs font-bold text-brand group-hover:underline">
                    R$ {(guard.hourlyRate || defaultHourlyRate).toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-[11px] text-ink-muted block">/hora</span>
                </button>
              </div>

              {/* PIX and WhatsApp Row */}
              <div className="flex items-center justify-between text-xs text-ink-soft bg-field rounded-xl px-3 py-2 border border-line/60">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="material-symbols-outlined text-[16px] text-brand">
                    qr_code_2
                  </span>
                  <span className="font-mono text-xs text-ink truncate">
                    PIX: {guard.pixKey || 'Não cadastrado'}
                  </span>
                </div>
                {guard.phone && (
                  <a
                    href={`https://wa.me/55${guard.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-whatsapp/15 hover:bg-whatsapp/25 text-brand font-bold text-xs shrink-0 transition"
                    title={`Abrir WhatsApp de ${guard.name}`}
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5 fill-whatsapp" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center justify-between gap-1.5 pt-0.5">
                <button
                  onClick={() => setScheduleEditGuard(guard)}
                  className="flex-1 py-2 px-2.5 bg-brand hover:bg-brand-hover rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  title="Editar escala deste funcionário, quantas horas e quantos reais foram"
                >
                  <span className="material-symbols-outlined text-[16px]">edit_calendar</span>
                  <span>Editar Escala & R$</span>
                </button>

                <button
                  onClick={() => setHistoryModalGuard(guard)}
                  className="py-2 px-2.5 bg-field hover:bg-line rounded-xl text-xs font-semibold text-ink flex items-center justify-center gap-1 transition-colors"
                  title="Ver histórico de plantões deste colaborador"
                >
                  <span className="material-symbols-outlined text-[16px] text-ink-muted">
                    history
                  </span>
                  <span>Histórico</span>
                </button>

                <button
                  onClick={() => handleOpenEdit(guard)}
                  className="p-2 bg-field hover:bg-line rounded-xl text-xs font-semibold text-ink-soft hover:text-ink flex items-center justify-center transition-colors border border-line/60"
                  title="Editar dados cadastrais (Nome, PIX, Telefone)"
                >
                  <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
                </button>

                <button
                  onClick={() => setDeleteConfirmGuard(guard)}
                  className="w-9 h-9 rounded-xl bg-field hover:bg-red-50 text-red-600 flex items-center justify-center transition-all border border-line/60"
                  title="Excluir ou Desativar"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          )
        })}

        {filteredGuards.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-2xl shadow-xs border border-line">
            <div className="w-16 h-16 rounded-full bg-field flex items-center justify-center text-ink-muted mb-3">
              <span className="material-symbols-outlined text-[32px]">person_search</span>
            </div>
            <h4 className="text-sm font-bold text-ink">
              Nenhum colaborador encontrado
            </h4>
            <p className="text-xs text-ink-muted mt-1 max-w-xs">
              Verifique os termos digitados ou remova o filtro ativo para exibir a lista.
            </p>
            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('todos')
              }}
              className="mt-4 py-2 px-4 bg-field text-ink rounded-xl text-xs font-semibold hover:bg-line"
            >
              Limpar Pesquisa
            </button>
          </div>
        )}
      </div>

      {/* MODAL: Adicionar / Editar Prestador (Stitch Bottom Sheet) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto border border-line animate-in slide-in-from-bottom duration-200">
            {/* Grabber handle */}
            <div className="w-12 h-1.5 bg-line rounded-full mx-auto mb-2 sm:hidden"></div>

            <div className="flex items-center justify-between pb-2 border-b border-field">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brand text-[24px]">
                  person_add
                </span>
                <h2 className="text-base font-bold text-ink">
                  {editingGuard ? 'Editar Prestador / Bico' : 'Novo Prestador / Bico G2'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-field flex items-center justify-center text-ink-soft"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-xs text-ink-muted mt-2 mb-4">
              Cadastre o colaborador para escalas, plantões e repasse quinzenal.
            </p>

            <form onSubmit={handleSubmitForm} className="flex flex-col gap-4">
              {/* Nome & Apelido */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-ink">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    placeholder="Ex: Carlos Eduardo Carvalho"
                    className="w-full h-11 px-3 bg-field text-ink text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-brand border border-line/60"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-ink">
                    Nome Curto na Planilha *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ex: Carvalho"
                    className="w-full h-11 px-3 bg-field text-ink text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-brand border border-line/60"
                  />
                </div>
              </div>

              {/* Valor Hora & WhatsApp */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-ink">
                    Valor da Hora (R$) *
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs text-ink-muted font-bold font-mono">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      required
                      value={formData.hourlyRate}
                      onChange={(e) =>
                        setFormData({ ...formData, hourlyRate: e.target.value })
                      }
                      className="w-full h-11 pl-9 pr-3 bg-field text-ink font-mono font-bold text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-brand border border-line/60"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <WhatsAppIcon className="w-3.5 h-3.5 fill-whatsapp" />
                    <span>WhatsApp (Contato)</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="(11) 98765-4321"
                    className="w-full h-11 px-3 bg-field text-ink text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-brand border border-line/60"
                  />
                </div>
              </div>

              {/* Chave PIX */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-ink">
                  Chave PIX (Para Pagamento Quinzenal)
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-ink-muted text-[18px]">
                    payments
                  </span>
                  <input
                    type="text"
                    value={formData.pixKey}
                    onChange={(e) =>
                      setFormData({ ...formData, pixKey: e.target.value })
                    }
                    disabled={isPixLocked}
                    placeholder="CPF, Celular, E-mail ou Aleatória"
                    className="w-full h-11 pl-10 pr-3 bg-field text-ink font-mono text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-brand border border-line/60 disabled:opacity-60"
                  />
                </div>
                {isPixLocked && (
                  <p className="text-xs text-ink-muted">
                    Só o diretor pode trocar uma chave PIX já cadastrada.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-field">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-ink-soft hover:bg-field"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>Salvar e Cadastrar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Excluir / Desativar Colaborador com Confirmação Segura */}
      {deleteConfirmGuard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col border border-line animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-[26px]">warning</span>
            </div>
            <h3 className="text-base font-bold text-ink">
              Opções para {deleteConfirmGuard.name}
            </h3>
            <p className="text-xs text-ink-soft mt-1">
              O que deseja fazer com{' '}
              <strong className="text-ink">{deleteConfirmGuard.name}</strong>?
              Escolha como gerenciar o histórico financeiro:
            </p>

            <div className="flex flex-col gap-2.5 my-4">
              {/* Option 1: Desativar (Recomendado) */}
              <button
                type="button"
                onClick={confirmDeactivate}
                className="flex items-start gap-2.5 p-3.5 rounded-xl bg-field hover:bg-line text-left transition-colors border border-line/60"
              >
                <span className="material-symbols-outlined text-brand text-[22px] shrink-0 mt-0.5">
                  archive
                </span>
                <div>
                  <h4 className="text-xs font-bold text-ink">
                    Desativar Colaborador (Recomendado)
                  </h4>
                  <p className="text-xs text-ink-muted mt-0.5 leading-snug">
                    Mantém todas as horas, plantões e histórico financeiro intactos no
                    sistema, apenas retirando da folha ativa.
                  </p>
                </div>
              </button>

              {/* Option 2: Excluir Definitivamente */}
              <button
                type="button"
                onClick={confirmHardDelete}
                disabled={!isDirector}
                className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 hover:bg-red-100 text-left transition-colors border border-red-200 disabled:opacity-50 disabled:hover:bg-red-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-red-600 text-[22px] shrink-0 mt-0.5">
                  delete_forever
                </span>
                <div>
                  <h4 className="text-xs font-bold text-red-700">
                    Excluir Registro Permanentemente
                  </h4>
                  <p className="text-xs text-red-600/80 mt-0.5 leading-snug">
                    {isDirector
                      ? 'Remove este prestador do apontamento atual. Indicado apenas se cadastrado por engano.'
                      : 'Somente o diretor pode excluir. Use "Desativar" acima.'}
                  </p>
                </div>
              </button>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setDeleteConfirmGuard(null)}
                className="px-4 py-2 text-xs font-semibold text-ink-soft hover:bg-field rounded-xl"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Histórico Rápido */}
      {historyModalGuard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col border border-line animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brand text-[22px]">
                  calendar_month
                </span>
                <h3 className="text-sm font-bold text-ink">
                  Histórico de {historyModalGuard.name}
                </h3>
              </div>
              <button
                onClick={() => setHistoryModalGuard(null)}
                className="w-8 h-8 rounded-full bg-field flex items-center justify-center text-ink-soft"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <span className="text-xs text-ink-muted mb-3">
              R$ {historyModalGuard.hourlyRate || defaultHourlyRate}/h
            </span>

            {/* Quick calculations */}
            {(() => {
              const calc = getGuardCalculations(historyModalGuard.id)
              return (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-field p-3 rounded-xl border border-line/60">
                    <span className="text-[11px] text-ink-muted">
                      Total Horas
                    </span>
                    <p className="font-mono text-base font-bold text-ink mt-0.5">
                      {calc.totalHours}h
                    </p>
                  </div>
                  <div className="bg-mint/20 p-3 rounded-xl border border-mint/30">
                    <span className="text-[11px] text-brand-text font-bold">
                      Total Acumulado
                    </span>
                    <p className="font-mono text-base font-bold text-brand-text mt-0.5">
                      R$ {calc.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              )
            })()}

            <button
              onClick={() => setHistoryModalGuard(null)}
              className="w-full py-2.5 bg-black text-white rounded-xl text-xs font-bold"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal: Editar Escala & Valores do Colaborador */}
      {scheduleEditGuard && (
        <GuardScheduleEditModal
          guard={scheduleEditGuard}
          isOpen={Boolean(scheduleEditGuard)}
          onClose={() => setScheduleEditGuard(null)}
        />
      )}
    </div>
  )
}
