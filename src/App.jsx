import React, { useState, useEffect } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import { Header } from './components/Header'
import { BottomNav } from './components/BottomNav'
import { LoginScreen } from './components/LoginScreen'
import { Dashboard } from './components/Dashboard'
import { SpreadsheetView } from './components/SpreadsheetView'
import { GuardsManagement } from './components/GuardsManagement'
import { PostsManagement } from './components/PostsManagement'
import { PaymentsView } from './components/PaymentsView'
import { QuickActionHubModal } from './components/QuickActionHubModal'
import { MultiDayAssignModal } from './components/MultiDayAssignModal'
import { WhatsAppScheduleImporterModal } from './components/WhatsAppScheduleImporterModal'

function MainContent() {
  const { currentUser } = useApp()
  const [activeTab, setActiveTab] = useState('dashboard')

  // Shared state for guard creation modal
  const [isGuardModalOpen, setIsGuardModalOpen] = useState(false)
  const [editingGuard, setEditingGuard] = useState(null)

  // Quick Action Hub modal state
  const [quickHub, setQuickHub] = useState({ isOpen: false, tab: 'cadastro' })

  // Multi-day assignment modal state
  const [multiDayModal, setMultiDayModal] = useState({ isOpen: false, guardId: null })

  // WhatsApp Importer modal state
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false)

  useEffect(() => {
    const handleOpenWhatsAppEvent = () => setWhatsAppModalOpen(true)
    window.addEventListener('open-whatsapp-importer', handleOpenWhatsAppEvent)
    return () => window.removeEventListener('open-whatsapp-importer', handleOpenWhatsAppEvent)
  }, [])

  const openQuickHub = (tab = 'cadastro') => {
    setQuickHub({ isOpen: true, tab })
  }

  const openMultiDay = (guardId = null) => {
    setMultiDayModal({ isOpen: true, guardId })
  }

  const openWhatsApp = () => {
    setWhatsAppModalOpen(true)
  }

  const handleOpenNewGuard = () => {
    openQuickHub('cadastro')
  }

  const handleOpenFastEditFromDashboard = () => {
    openQuickHub('hoje')
  }

  if (!currentUser) {
    return <LoginScreen />
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0d1c2f] flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        onOpenQuickHub={() => openQuickHub('cadastro')}
        onGoHome={() => setActiveTab('dashboard')}
      />

      <main className="flex-1 w-full max-w-xl mx-auto px-4 pt-20 pb-20">
        {activeTab === 'dashboard' && (
          <Dashboard
            setActiveTab={setActiveTab}
            onOpenNewGuardModal={handleOpenNewGuard}
            onOpenFastEdit={handleOpenFastEditFromDashboard}
            onOpenQuickHub={openQuickHub}
            onOpenMultiDay={openMultiDay}
            onOpenWhatsApp={openWhatsApp}
          />
        )}

        {activeTab === 'quinzena-horas' && (
          <SpreadsheetView
            onOpenNewGuardModal={handleOpenNewGuard}
            onOpenQuickHub={openQuickHub}
            onOpenMultiDay={openMultiDay}
            onOpenWhatsApp={openWhatsApp}
          />
        )}

        {activeTab === 'prestadores' && (
          <GuardsManagement
            isModalOpen={isGuardModalOpen}
            setIsModalOpen={setIsGuardModalOpen}
            editingGuard={editingGuard}
            setEditingGuard={setEditingGuard}
            onOpenQuickHub={openQuickHub}
            onOpenMultiDay={openMultiDay}
          />
        )}

        {(activeTab === 'pagamentos' || activeTab === 'extratos-recibos') && (
          <PaymentsView onOpenQuickHub={openQuickHub} />
        )}

        {activeTab === 'configuracoes' && <PostsManagement />}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Quick Action Hub Modal */}
      <QuickActionHubModal
        isOpen={quickHub.isOpen}
        initialTab={quickHub.tab}
        onClose={() => setQuickHub({ ...quickHub, isOpen: false })}
      />

      {/* Global Multi-Day Assignment Modal */}
      <MultiDayAssignModal
        isOpen={multiDayModal.isOpen}
        initialGuardId={multiDayModal.guardId}
        onClose={() => setMultiDayModal({ isOpen: false, guardId: null })}
      />

      {/* Global WhatsApp Schedule Importer Modal */}
      <WhatsAppScheduleImporterModal
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
      />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  )
}
