import React, { useState } from 'react'
import { useApp } from '../context/AppContext'

export function PostsManagement() {
  const {
    posts,
    guards,
    defaultHourlyRate,
    setDefaultHourlyRate,
    budgetCeiling,
    setBudgetCeiling,
    addPost,
    updatePost,
    deletePost,
    resetToTemplateData,
    exportBackupJSON,
    importBackupJSON,
    getGuardCalculations,
    isSupabaseConfigured,
    isSyncing,
    lastSyncTime,
    refreshFromSupabase,
    managerPassword,
    updateManagerPassword,
    currentUser,
    logout,
  } = useApp()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [postToDelete, setPostToDelete] = useState(null)
  const [rateInput, setRateInput] = useState(defaultHourlyRate)
  const [budgetInput, setBudgetInput] = useState(budgetCeiling || 12000)
  const [passInput, setPassInput] = useState(managerPassword || 'G2barreto$')
  const [toastMsg, setToastMsg] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    address: '',
  })

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }

  const handleOpenAdd = () => {
    setEditingPost(null)
    setFormData({ name: '', address: '' })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (post) => {
    setEditingPost(post)
    setFormData({
      name: post.name,
      address: post.address || '',
    })
    setIsModalOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    if (editingPost) {
      updatePost(editingPost.id, formData)
      showToast(`Posto ${formData.name} atualizado!`)
    } else {
      addPost(formData)
      showToast(`Posto ${formData.name} cadastrado!`)
    }
    setIsModalOpen(false)
  }

  const confirmDelete = () => {
    if (postToDelete) {
      deletePost(postToDelete.id)
      showToast(`Posto ${postToDelete.name} excluído.`)
      setPostToDelete(null)
    }
  }

  const handleSaveRate = (e) => {
    e.preventDefault()
    setDefaultHourlyRate(Number(rateInput))
    showToast('Taxa padrão por hora atualizada!')
  }

  const handleSaveBudget = (e) => {
    e.preventDefault()
    setBudgetCeiling(Number(budgetInput) || 12000)
    showToast('Teto orçado operacional atualizado!')
  }

  const handleSavePassword = (e) => {
    e.preventDefault()
    if (!passInput.trim()) return
    updateManagerPassword(passInput.trim())
    showToast('Senha oficial de acesso dos gerentes atualizada!')
  }

  const handleReset = () => {
    if (
      window.confirm(
        'Deseja restaurar os dados originais da planilha (Carvalho, Novaes, etc.)?'
      )
    ) {
      resetToTemplateData()
      showToast('Dados originais restaurados com sucesso!')
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result
      if (typeof content === 'string') {
        const res = importBackupJSON(content)
        if (res.success) {
          showToast('Backup importado com sucesso!')
        } else {
          alert('Erro ao importar: ' + res.error)
        }
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="flex flex-col w-full gap-4 pb-28 max-w-7xl mx-auto">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#131b2e] text-white px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2 border border-white/10">
          <span className="material-symbols-outlined text-[#6cf8bb] text-[18px]">
            check_circle
          </span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#dde9ff] flex items-center justify-between">
        <div>
          <span className="font-mono text-[10px] text-[#76777d] uppercase tracking-wider font-semibold">
            Configurações Operacionais
          </span>
          <h2 className="text-base font-bold text-[#0d1c2f]">Postos e Parâmetros G2</h2>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-3.5 py-2 bg-[#006c49] hover:bg-[#005236] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Novo Posto</span>
        </button>
      </div>

      {/* 2-Column Responsive Layout for Desktop PC */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Parâmetros & Senhas */}
        <div className="flex flex-col gap-4">
          {/* Hourly Rate Card */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#dde9ff] space-y-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#006c49]">payments</span>
          <h3 className="text-xs font-bold text-[#0d1c2f]">Taxa Base Padrão</h3>
        </div>
        <form onSubmit={handleSaveRate} className="flex items-center gap-3">
          <div className="relative flex items-center flex-1">
            <span className="absolute left-3 text-xs text-[#76777d] font-bold font-mono">
              R$
            </span>
            <input
              type="number"
              step="0.5"
              min="1"
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
              className="w-full h-11 pl-9 pr-3 bg-[#eff4ff] text-[#0d1c2f] font-mono font-bold text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-[#006c49] border border-[#dde9ff]/60"
            />
          </div>
          <button
            type="submit"
            className="h-11 px-4 bg-black text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition"
          >
            Atualizar Taxa
          </button>
        </form>
        <p className="text-[11px] text-[#76777d]">
          Valor multiplicado automaticamente pelo número de horas na 1ª e 2ª Quinzena.
        </p>
      </div>

      {/* Teto Orçado Card */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#dde9ff] space-y-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#006c49]">account_balance_wallet</span>
          <h3 className="text-xs font-bold text-[#0d1c2f]">Teto Orçado Operacional</h3>
        </div>
        <form onSubmit={handleSaveBudget} className="flex items-center gap-3">
          <div className="relative flex items-center flex-1">
            <span className="absolute left-3 text-xs text-[#76777d] font-bold font-mono">
              R$
            </span>
            <input
              type="number"
              min="0"
              step="500"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              className="w-full h-11 pl-9 pr-3 bg-[#eff4ff] text-[#0d1c2f] font-mono font-bold text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-[#006c49] border border-[#dde9ff]/60"
            />
          </div>
          <button
            type="submit"
            className="h-11 px-4 bg-[#006c49] hover:bg-[#005236] text-white text-xs font-bold rounded-xl transition"
          >
            Salvar Teto
          </button>
        </form>
        <p className="text-[11px] text-[#76777d]">
          Meta máxima de previsão de pagamento para controle da barra de progresso no Início.
        </p>
      </div>

      {/* Manager Access Password Card */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#dde9ff] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006c49]">vpn_key</span>
            <h3 className="text-xs font-bold text-[#0d1c2f]">Senha Oficial de Acesso dos Gerentes</h3>
          </div>
          <span className="font-mono text-[10px] text-[#006c49] font-bold bg-[#6cf8bb]/20 px-2 py-0.5 rounded-md">
            G2 Acesso
          </span>
        </div>
        <form onSubmit={handleSavePassword} className="flex items-center gap-3">
          <div className="relative flex items-center flex-1">
            <span className="absolute left-3 text-[#76777d]">
              <span className="material-symbols-outlined text-[18px]">lock</span>
            </span>
            <input
              type="text"
              value={passInput}
              onChange={(e) => setPassInput(e.target.value)}
              placeholder="Digite a nova senha oficial..."
              className="w-full h-11 pl-9 pr-3 bg-[#eff4ff] text-[#0d1c2f] font-mono font-bold text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-[#006c49] border border-[#dde9ff]/60"
            />
          </div>
          <button
            type="submit"
            className="h-11 px-4 bg-[#0d1c2f] hover:bg-[#1a2d47] text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Salvar Senha
          </button>
        </form>
        <p className="text-[11px] text-[#76777d]">
          Esta é a senha que os gerentes usam para entrar na plataforma. Ao salvar, atualiza na nuvem para todos.
        </p>
      </div>

      {/* Session Management Card */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#dde9ff] flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-[#0d1c2f] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#006c49]">verified_user</span>
            <span>Sessão Atual ({currentUser?.name || 'Gestor'})</span>
          </h3>
          <p className="text-[11px] text-[#76777d] mt-0.5">
            Navegador autenticado com credenciais G2
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
          title="Desconectar e voltar para tela de login"
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
          <span>Desconectar</span>
        </button>
      </div>
    </div>

    {/* Right Column: Postos, Nuvem & Backup */}
    <div className="flex flex-col gap-4">
      {/* Posts Cards Grid */}
      <div className="flex flex-col gap-2.5">
        <h3 className="text-xs font-bold text-[#0d1c2f] px-1">
          Postos Cadastrados ({posts.length})
        </h3>
        {posts.map((post) => {
          const postGuards = guards.filter((g) => g.postId === post.id && g.active)
          let postHours = 0
          let postAmount = 0

          postGuards.forEach((g) => {
            const calc = getGuardCalculations(g.id)
            postHours += calc.totalHours
            postAmount += calc.totalAmount
          })

          return (
            <div
              key={post.id}
              className="bg-white rounded-2xl p-3.5 shadow-xs border border-[#dde9ff] hover:border-[#6cf8bb] transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#eff4ff] flex items-center justify-center text-[#006c49] shrink-0 border border-[#dde9ff]/60">
                  <span className="material-symbols-outlined text-[20px]">
                    location_on
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0d1c2f]">{post.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-[10px] text-[#76777d]">
                      {postGuards.length}{' '}
                      {postGuards.length === 1 ? 'segurança' : 'seguranças'}
                    </span>
                    <span className="text-[#dde9ff]">•</span>
                    <span className="font-mono text-[10px] text-[#006c49] font-bold">
                      {postHours}h acumuladas
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(post)}
                  className="p-2 rounded-xl text-[#76777d] hover:text-[#0d1c2f] hover:bg-[#eff4ff] transition"
                  title="Editar posto"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button
                  onClick={() => setPostToDelete(post)}
                  className="p-2 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 transition"
                  title="Excluir posto"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Cloud Database (Supabase) Status Box */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#dde9ff] space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#0d1c2f] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#006c49]">cloud_sync</span>
            <span>Banco de Dados em Nuvem (Supabase)</span>
          </h3>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              isSupabaseConfigured
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            {isSupabaseConfigured ? 'Conectado à Nuvem' : 'Modo Local (Offline)'}
          </span>
        </div>

        {isSupabaseConfigured ? (
          <div className="space-y-2">
            <p className="text-xs text-[#45464d] leading-relaxed">
              Seus dados estão sendo sincronizados em tempo real no PostgreSQL da sua nuvem Supabase.
              {lastSyncTime && (
                <span className="block text-[11px] text-[#76777d] mt-1">
                  Última sincronização:{' '}
                  {new Date(lastSyncTime).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              )}
            </p>
            <button
              type="button"
              disabled={isSyncing}
              onClick={async () => {
                const ok = await refreshFromSupabase()
                if (ok) showToast('Sincronizado com Supabase com sucesso!')
                else showToast('Erro ao sincronizar com Supabase')
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-[#eff4ff] hover:bg-[#dde9ff] text-xs font-bold text-[#0d1c2f] flex items-center justify-center gap-1.5 border border-[#dde9ff] transition disabled:opacity-50"
            >
              <span
                className={`material-symbols-outlined text-[16px] text-[#006c49] ${
                  isSyncing ? 'animate-spin' : ''
                }`}
              >
                sync
              </span>
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Agora com a Nuvem'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-[#45464d] leading-relaxed">
              O sistema está operando localmente no navegador (localStorage). Para sincronizar entre vários
              celulares e computadores na nuvem com o Supabase e Vercel:
            </p>
            <div className="bg-[#eff4ff]/60 border border-[#dde9ff] rounded-xl p-2.5 text-[11px] font-mono text-[#0d1c2f] space-y-1">
              <div className="text-[#76777d] font-sans text-[10px] font-bold uppercase tracking-wider">
                Variáveis de Ambiente (Vercel ou .env):
              </div>
              <div className="text-[#006c49]">VITE_SUPABASE_URL=https://...supabase.co</div>
              <div className="text-[#006c49]">VITE_SUPABASE_ANON_KEY=eyJ...</div>
            </div>
            <p className="text-[11px] text-[#76777d]">
              Consulte o arquivo <strong className="text-[#0d1c2f]">supabase-schema.sql</strong> gerado no projeto para criar as tabelas com 1 clique no SQL Editor do Supabase.
            </p>
          </div>
        )}
      </div>

      {/* Backup and Restore Box */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#dde9ff] space-y-3">
        <h3 className="text-xs font-bold text-[#0d1c2f] flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[#76777d]">backup</span>
          <span>Segurança de Dados & Backup</span>
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={exportBackupJSON}
            className="py-2.5 px-3 rounded-xl bg-[#eff4ff] hover:bg-[#dde9ff] text-xs font-semibold text-[#0d1c2f] flex items-center justify-center gap-1.5 border border-[#dde9ff]"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Baixar Backup (JSON)</span>
          </button>
          <label className="py-2.5 px-3 rounded-xl bg-[#eff4ff] hover:bg-[#dde9ff] text-xs font-semibold text-[#0d1c2f] flex items-center justify-center gap-1.5 border border-[#dde9ff] cursor-pointer">
            <span className="material-symbols-outlined text-[16px]">upload</span>
            <span>Restaurar Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <button
          onClick={handleReset}
          className="w-full py-2.5 text-xs text-[#76777d] hover:text-red-600 font-semibold hover:bg-red-50 rounded-xl transition"
        >
          Restaurar Dados Originais da Planilha Modelo
        </button>
      </div>
    </div>
  </div>

      {/* Add / Edit Post Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-[#dde9ff] animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-[#eff4ff]">
              <h3 className="text-sm font-bold text-[#0d1c2f] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#006c49]">
                  location_on
                </span>
                <span>{editingPost ? 'Editar Posto' : 'Novo Posto de Serviço'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#45464d]"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-3 space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#0d1c2f] block mb-1">
                  Nome do Posto / Local *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Diadema, Santo André, Penha..."
                  className="w-full h-11 px-3 bg-[#eff4ff] text-[#0d1c2f] text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-[#006c49] border border-[#dde9ff]/60"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0d1c2f] block mb-1">
                  Endereço / Observações
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Ex: Av. Paulista, 1000 - SP"
                  className="w-full h-11 px-3 bg-[#eff4ff] text-[#0d1c2f] text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-[#006c49] border border-[#dde9ff]/60"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#eff4ff]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#45464d] hover:bg-[#eff4ff] rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#006c49] text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Salvar Posto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {postToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-xs rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-[#dde9ff]">
            <h3 className="text-sm font-bold text-[#0d1c2f]">Excluir Posto</h3>
            <p className="text-xs text-[#76777d] mt-1">
              Tem certeza que deseja excluir o posto <strong>{postToDelete.name}</strong>?
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setPostToDelete(null)}
                className="px-3 py-1.5 text-xs text-[#76777d] hover:bg-[#eff4ff] rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
