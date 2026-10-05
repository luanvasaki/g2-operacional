import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { WhatsAppBadgeIcon } from './icons/WhatsAppIcon'

function normalizeStr(str = '') {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

const EXAMPLE_TEXT = `01- Gomes 
02 - Barbosa 
03- Gomes 
04 - Miranda
05- Gomes 
06 - Barbosa
07- Gomes 
08 - Barbosa 
09- Gomes
10- Miranda
11- Gomes 
12 - Barbosa 
13- Gomes 
14 - Barbosa 
15 - Gomes 
16 - Barbosa 
17 - Gomes 
18 - Miranda
19- Gomes 
20 - Barbosa
21- Gomes 
22 - Barbosa 
23 - Gomes
24 - Miranda
25 - Gomes 
26 - Barbosa
27 - Gomes 
28- Barbosa 
29- Gomes
30- Barbosa
31 - Gomes

Confiança`

export function WhatsAppScheduleImporterModal({ isOpen, onClose }) {
  const {
    selectedMonth,
    setSelectedMonth,
    guards,
    posts,
    defaultHourlyRate,
    batchApplyParsedSchedule,
    addGuard,
  } = useApp()

  const [targetMonth, setTargetMonth] = useState(selectedMonth)
  const [rawText, setRawText] = useState('')
  const [selectedPostId, setSelectedPostId] = useState('')
  const [overrideHours, setOverrideHours] = useState(null) // null = use post/guard default
  const [replaceExisting, setReplaceExisting] = useState(true)
  const [manualNameMappings, setManualNameMappings] = useState({})
  const [showDetailedList, setShowDetailedList] = useState(false)
  const [successToast, setSuccessToast] = useState(false)

  // Keep targetMonth in sync when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setTargetMonth(selectedMonth)
    }
  }, [isOpen, selectedMonth])

  // Calculate days in target month
  const [yearStr, monthStr] = targetMonth.split('-')
  const totalDaysInMonth = new Date(Number(yearStr), Number(monthStr), 0).getDate()

  // Parsing logic
  const parseResult = useMemo(() => {
    if (!rawText.trim()) {
      return {
        detectedPost: null,
        entries: [],
        guardSummaries: [],
        unmatchedNames: [],
        totalHours: 0,
        totalCost: 0,
      }
    }

    const lines = rawText.split('\n')
    let foundPost = null
    const detectedEntries = []
    const unmatched = new Set()

    // 1. First scan for post name in lines
    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line) continue

      for (const p of posts) {
        const pNorm = normalizeStr(p.name)
        const lNorm = normalizeStr(line)
        if (lNorm === pNorm || lNorm.includes(pNorm)) {
          foundPost = p
          break
        }
      }
      if (foundPost) break
    }

    const activePost = posts.find((p) => p.id === (selectedPostId || foundPost?.id))

    // 2. Parse day lines
    // Accepts formats like: "01- Gomes", "02 - Barbosa", "03: Gomes", "Dia 04 Miranda 4h"
    const lineRegex = /^(?:dia\s*)?(\d{1,2})\s*[-–:ºª°/|.]*\s*([a-zA-ZÀ-ÿ\s]+?)(?:\s+(\d{1,2})\s*h(?:oras?)?)?$/i

    lines.forEach((rawLine, idx) => {
      const line = rawLine.trim()
      if (!line) return

      // If line is just the post name, skip it
      if (activePost && normalizeStr(line) === normalizeStr(activePost.name)) {
        return
      }

      const match = line.match(lineRegex)
      if (match) {
        const day = parseInt(match[1], 10)
        let rawName = match[2].trim()
        const explicitHours = match[3] ? parseInt(match[3], 10) : null

        if (day < 1 || day > totalDaysInMonth) return

        // Clean rawName from leftover numbers or punctuation
        rawName = rawName.replace(/[-–:0-9]/g, '').trim()
        if (!rawName) return

        // Match against guards
        const rawNorm = normalizeStr(rawName)

        // Check if user mapped this name manually
        let matchedGuard = null
        if (manualNameMappings[rawNorm]) {
          matchedGuard = guards.find((g) => g.id === manualNameMappings[rawNorm])
        }

        // Try exact match or substring
        if (!matchedGuard) {
          // Prioritize guards of the detected post if available
          const postGuards = activePost ? guards.filter((g) => g.postId === activePost.id) : []
          matchedGuard =
            postGuards.find((g) => normalizeStr(g.name) === rawNorm) ||
            guards.find((g) => normalizeStr(g.name) === rawNorm) ||
            postGuards.find(
              (g) =>
                normalizeStr(g.name).includes(rawNorm) ||
                normalizeStr(g.fullName).includes(rawNorm)
            ) ||
            guards.find(
              (g) =>
                normalizeStr(g.name).includes(rawNorm) ||
                normalizeStr(g.fullName).includes(rawNorm)
            )
        }

        if (matchedGuard) {
          const shiftH =
            overrideHours !== null
              ? overrideHours
              : explicitHours !== null
              ? explicitHours
              : matchedGuard.defaultShiftHours || 3

          detectedEntries.push({
            day,
            rawName,
            guard: matchedGuard,
            hours: shiftH,
            rate: matchedGuard.hourlyRate || defaultHourlyRate,
          })
        } else {
          unmatched.add(rawName)
          detectedEntries.push({
            day,
            rawName,
            guard: null,
            hours: overrideHours !== null ? overrideHours : 3,
            rate: defaultHourlyRate,
          })
        }
      }
    })

    // Sort entries by day
    detectedEntries.sort((a, b) => a.day - b.day)

    // Compute guard breakdown
    const summaryMap = {}
    let totalH = 0
    let totalC = 0

    detectedEntries.forEach((entry) => {
      if (entry.guard) {
        if (!summaryMap[entry.guard.id]) {
          summaryMap[entry.guard.id] = {
            guard: entry.guard,
            days: [],
            totalHours: 0,
            totalCost: 0,
          }
        }
        summaryMap[entry.guard.id].days.push(entry.day)
        summaryMap[entry.guard.id].totalHours += entry.hours
        const cost = entry.hours * entry.rate
        summaryMap[entry.guard.id].totalCost += cost
        totalH += entry.hours
        totalC += cost
      }
    })

    return {
      detectedPost: foundPost,
      entries: detectedEntries,
      guardSummaries: Object.values(summaryMap),
      unmatchedNames: Array.from(unmatched),
      totalHours: totalH,
      totalCost: totalC,
    }
  }, [rawText, selectedPostId, overrideHours, guards, posts, defaultHourlyRate, manualNameMappings, totalDaysInMonth])

  // Active post to display
  const currentPost = posts.find((p) => p.id === (selectedPostId || parseResult.detectedPost?.id)) || posts[0]

  if (!isOpen) return null

  // Paste from clipboard
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        setRawText(text)
      }
    } catch {
      alert('Por favor, pressione Ctrl+V no campo de texto para colar a mensagem.')
    }
  }

  // Load sample text
  const handleLoadSample = () => {
    setRawText(EXAMPLE_TEXT)
    setSelectedPostId('confianca')
    setOverrideHours(3)
  }

  // Create quick guard from unmatched name
  const handleCreateGuardFromName = (unmatchedName) => {
    const newGuard = {
      name: unmatchedName,
      fullName: `${unmatchedName} Segurança`,
      postId: currentPost?.id || 'confianca',
      phone: '',
      pixKey: '',
      pixType: 'CPF',
      hourlyRate: defaultHourlyRate,
      defaultShiftHours: overrideHours || 3,
      active: true,
    }
    addGuard(newGuard)
  }

  // Confirm and apply to calendar
  const handleApplyImport = () => {
    const validEntries = parseResult.entries.filter((e) => e.guard !== null)
    if (validEntries.length === 0) {
      alert('Nenhum plantão pôde ser reconhecido. Verifique o texto colado.')
      return
    }

    const records = validEntries.map((e) => ({
      guardId: e.guard.id,
      day: e.day,
      hours: e.hours,
    }))

    batchApplyParsedSchedule(records, replaceExisting, targetMonth)
    if (targetMonth !== selectedMonth) {
      setSelectedMonth(targetMonth)
    }
    setSuccessToast(true)

    setTimeout(() => {
      setSuccessToast(false)
      onClose()
    }, 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0d1c2f]/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-[#dde9ff] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#eff4ff] flex items-center justify-between bg-[#131b2e] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#25D366]/20 flex items-center justify-center text-[#25D366] border border-[#25D366]/30 shadow-xs">
              <WhatsAppBadgeIcon className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Importar Escala do WhatsApp</span>
                <span className="px-2 py-0.5 rounded-full bg-[#25D366] text-[#002113] text-[10px] font-black uppercase">
                  Automático
                </span>
              </h2>
              <p className="text-[11px] text-[#bec6e0]">
                Cole o texto enviado pelo supervisor e preencha a planilha em 1 clique
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[#bec6e0] hover:text-white transition"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Section 0: Target Month Selection */}
          <div className="p-3.5 bg-[#eff4ff] rounded-2xl border border-[#dde9ff] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#006c49] flex items-center justify-center text-[#6cf8bb] shadow-xs shrink-0">
                <span className="material-symbols-outlined text-[22px]">calendar_month</span>
              </div>
              <div>
                <label className="text-xs font-bold text-[#0d1c2f] block leading-tight">
                  Mês de Destino da Escala:
                </label>
                <span className="text-[11px] text-[#76777d]">
                  Selecione para qual mês esses plantões devem ser importados
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <select
                value={targetMonth}
                onChange={(e) => setTargetMonth(e.target.value)}
                className="bg-white text-[#0d1c2f] font-bold text-xs px-3.5 py-2.5 rounded-xl border border-[#dde9ff] focus:outline-none focus:ring-2 focus:ring-[#006c49] cursor-pointer shadow-xs capitalize"
              >
                <option value="2026-08">Agosto 2026</option>
                <option value="2026-09">Setembro 2026</option>
                <option value="2026-10">Outubro 2026</option>
                <option value="2026-11">Novembro 2026</option>
                <option value="2026-12">Dezembro 2026</option>
                <option value="2027-01">Janeiro 2027</option>
                <option value="2027-02">Fevereiro 2027</option>
                <option value="2027-03">Março 2027</option>
              </select>
            </div>
          </div>

          {/* Section 1: Textarea with Quick Actions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#0d1c2f] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[17px] text-[#006c49]">content_paste</span>
                <span>Cole a mensagem do WhatsApp aqui:</span>
              </label>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="px-2.5 py-1 rounded-lg bg-[#eff4ff] hover:bg-[#dde9ff] text-[#0d1c2f] text-[11px] font-bold flex items-center gap-1 border border-[#dde9ff] transition"
                  title="Colar texto da área de transferência"
                >
                  <span className="material-symbols-outlined text-[14px]">content_paste</span>
                  <span>Colar</span>
                </button>

                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="px-2.5 py-1 rounded-lg bg-[#6cf8bb]/30 hover:bg-[#6cf8bb]/50 text-[#006c49] text-[11px] font-bold flex items-center gap-1 border border-[#6cf8bb]/40 transition"
                  title="Carregar exemplo da escala Confiança"
                >
                  <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                  <span>Exemplo Confiança</span>
                </button>

                {rawText && (
                  <button
                    type="button"
                    onClick={() => setRawText('')}
                    className="p-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition"
                    title="Limpar texto"
                  >
                    <span className="material-symbols-outlined text-[15px]">delete_sweep</span>
                  </button>
                )}
              </div>
            </div>

            <textarea
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`Exemplo:\n01- Gomes\n02 - Barbosa\n03- Gomes\n04 - Miranda\n...\nConfiança`}
              className="w-full p-3 font-mono text-xs bg-[#f8f9ff] text-[#0d1c2f] rounded-2xl border border-[#dde9ff] focus:outline-none focus:ring-2 focus:ring-[#006c49] placeholder:text-[#76777d]/60 resize-y"
            />
          </div>

          {/* Section 2: Post & Hours Detection Controls */}
          {rawText.trim() && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-[#eff4ff]/60 rounded-2xl border border-[#dde9ff]">
              <div>
                <label className="text-xs font-bold text-[#0d1c2f] block mb-1">
                  Local / Posto Operacional:
                </label>
                <select
                  value={selectedPostId || parseResult.detectedPost?.id || ''}
                  onChange={(e) => setSelectedPostId(e.target.value)}
                  className="w-full bg-white text-[#0d1c2f] font-bold text-xs p-2 rounded-xl border border-[#dde9ff] focus:outline-none"
                >
                  {posts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {parseResult.detectedPost?.id === p.id ? '✓ (Detectado no texto)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#0d1c2f] block mb-1">
                  Carga Horária por Plantão:
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {[3, 4, 7].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setOverrideHours(h)}
                      className={`py-1.5 rounded-xl font-bold text-xs transition border ${
                        (overrideHours === h || (overrideHours === null && currentPost?.id === 'confianca' && h === 3) || (overrideHours === null && currentPost?.id !== 'confianca' && h === 4))
                          ? 'bg-[#131b2e] text-white border-[#131b2e]'
                          : 'bg-white text-[#45464d] border-[#dde9ff] hover:bg-[#eff4ff]'
                      }`}
                    >
                      {h} Horas
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Unmatched Names Warning & Quick Fix */}
          {parseResult.unmatchedNames.length > 0 && (
            <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-amber-900 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                <span>Nome(s) não cadastrado(s) na equipe:</span>
              </div>
              <p className="text-[11px] text-amber-700">
                Os seguintes nomes foram encontrados no texto mas ainda não existem no sistema.
                Você pode cadastrá-los com 1 toque:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {parseResult.unmatchedNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleCreateGuardFromName(name)}
                    className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition"
                  >
                    <span className="material-symbols-outlined text-[14px]">person_add</span>
                    <span>Cadastrar "{name}" no Posto {currentPost.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Parsed Result Summary */}
          {parseResult.entries.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0d1c2f] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-[#006c49]">task_alt</span>
                  <span>Resultado Identificado ({parseResult.entries.length} plantões):</span>
                </span>
                <span className="font-mono text-xs font-bold text-[#006c49] bg-[#6cf8bb]/20 px-2 py-0.5 rounded-full">
                  Posto {currentPost.name}
                </span>
              </div>

              {/* Guard Allocation Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {parseResult.guardSummaries.map(({ guard, days, totalHours, totalCost }) => (
                  <div
                    key={guard.id}
                    className="bg-white p-3 rounded-2xl border border-[#dde9ff] shadow-xs flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#0d1c2f]">{guard.name}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#eff4ff] text-[#006c49] font-bold">
                        {days.length} dias
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-[#eff4ff] flex items-center justify-between text-xs">
                      <span className="font-mono text-[#76777d]">{totalHours}h</span>
                      <span className="font-mono font-bold text-[#0d1c2f]">
                        R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Expandable Day-by-Day List */}
              <div className="bg-[#f8f9ff] p-3 rounded-2xl border border-[#dde9ff]">
                <button
                  type="button"
                  onClick={() => setShowDetailedList(!showDetailedList)}
                  className="w-full flex items-center justify-between text-xs font-bold text-[#45464d] hover:text-[#0d1c2f]"
                >
                  <span>Ver lista detalhada dia a dia</span>
                  <span className="material-symbols-outlined text-[18px]">
                    {showDetailedList ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {showDetailedList && (
                  <div className="mt-2 pt-2 border-t border-[#dde9ff] grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto">
                    {parseResult.entries.map((entry, idx) => (
                      <div
                        key={idx}
                        className={`p-1.5 rounded-lg text-xs font-mono flex items-center justify-between ${
                          entry.guard
                            ? 'bg-white text-[#0d1c2f] border border-[#dde9ff]'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        <span className="font-bold">D{String(entry.day).padStart(2, '0')}:</span>
                        <span className="truncate">{entry.guard ? entry.guard.name : entry.rawName}</span>
                        <span className="text-[10px] text-[#006c49]">{entry.hours}h</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Replace Option Checkbox */}
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#eff4ff]/60 border border-[#dde9ff] text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                  className="rounded text-[#006c49] focus:ring-0"
                />
                <span className="text-[#0d1c2f] font-semibold">
                  Substituir escala anterior destes colaboradores no mês de {selectedMonth}
                </span>
              </label>

              {/* Dynamic Impact Hero Ribbon */}
              <div className="bg-[#131b2e] text-white p-3.5 rounded-2xl flex items-center justify-between border border-white/10 shadow-sm">
                <div>
                  <span className="text-[10px] text-[#bec6e0] font-mono uppercase">
                    Impacto Total Importado
                  </span>
                  <div className="font-bold text-sm text-white mt-0.5">
                    {parseResult.entries.filter((e) => e.guard).length} Plantões Alocados
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-[#6cf8bb] font-mono uppercase font-bold">
                    Carga & Custo
                  </span>
                  <div className="font-mono text-xs font-bold text-white mt-0.5">
                    {parseResult.totalHours}h • R${' '}
                    {parseResult.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {successToast && (
            <div className="p-3 bg-[#6cf8bb] text-[#002113] rounded-2xl font-bold text-xs flex items-center justify-center gap-2 animate-in fade-in">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              <span>Escala do WhatsApp importada com sucesso para a planilha!</span>
            </div>
          )}
        </div>

        {/* Modal Sticky Footer */}
        <div className="p-4 border-t border-[#eff4ff] bg-white flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-[#dde9ff] text-[#45464d] font-bold text-xs hover:bg-[#eff4ff] transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleApplyImport}
            disabled={parseResult.entries.filter((e) => e.guard !== null).length === 0}
            className={`flex-2 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95 ${
              parseResult.entries.filter((e) => e.guard !== null).length > 0
                ? 'bg-[#006c49] hover:bg-[#005236] text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
            <span>
              {parseResult.entries.filter((e) => e.guard !== null).length > 0
                ? `Confirmar e Importar ${
                    parseResult.entries.filter((e) => e.guard !== null).length
                  } Plantões (${targetMonth})`
                : 'Aguardando texto da escala'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
