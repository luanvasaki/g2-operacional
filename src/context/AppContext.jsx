import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  INITIAL_POSTS,
  INITIAL_GUARDS,
  INITIAL_SHIFTS,
  INITIAL_PAYMENTS,
  CURRENT_MONTH_KEY,
} from '../data/initialData'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const AppContext = createContext(null)

const STORAGE_KEYS = {
  USER: 'g2_user',
  POSTS: 'g2_posts',
  GUARDS: 'g2_guards',
  SHIFTS: 'g2_shifts',
  PAYMENTS: 'g2_payments',
  HOURLY_RATE: 'g2_hourly_rate',
  BUDGET_CEILING: 'g2_budget_ceiling',
  SELECTED_MONTH: 'g2_selected_month',
  SHIFT_NOTES: 'g2_shift_notes',
  MANAGER_PASSWORD: 'g2_manager_password',
}

// Helpers for Supabase mapping
function guardFromDb(row) {
  return {
    id: row.id,
    name: row.name,
    fullName: row.full_name || '',
    postId: row.post_id || null,
    phone: row.phone || '',
    pixKey: row.pix_key || '',
    pixType: row.pix_type || '',
    defaultShiftHours: Number(row.default_shift_hours) === 4 ? 3 : (Number(row.default_shift_hours) || 3),
    hourlyRate: Number(row.hourly_rate) || 40,
    active: row.active !== false,
  }
}

function guardToDb(guard) {
  return {
    id: guard.id,
    name: guard.name,
    full_name: guard.fullName || '',
    post_id: guard.postId || null,
    phone: guard.phone || '',
    pix_key: guard.pixKey || '',
    pix_type: guard.pixType || '',
    default_shift_hours: Number(guard.defaultShiftHours) || 3,
    hourly_rate: Number(guard.hourlyRate) || 40,
    active: guard.active !== false,
  }
}

function postFromDb(row) {
  return {
    id: row.id,
    name: row.name,
    address: row.address || '',
    active: row.active !== false,
  }
}

function postToDb(post) {
  return {
    id: post.id,
    name: post.name,
    address: post.address || '',
    active: post.active !== false,
  }
}

export function AppProvider({ children }) {
  // Sync state
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState(null)

  // Authentication
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  // Hourly Rate (default 40 as in spreadsheet)
  const [defaultHourlyRate, setDefaultHourlyRate] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HOURLY_RATE)
      return saved ? Number(saved) : 40
    } catch {
      return 40
    }
  })

  // Budget Ceiling (Teto Orçado)
  const [budgetCeiling, setBudgetCeiling] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BUDGET_CEILING)
      return saved ? Number(saved) : 12000
    } catch {
      return 12000
    }
  })

  // Selected Month (Format: YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.SELECTED_MONTH) || CURRENT_MONTH_KEY
    } catch {
      return CURRENT_MONTH_KEY
    }
  })

  // Posts
  const [posts, setPosts] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.POSTS)
      return saved ? JSON.parse(saved) : INITIAL_POSTS
    } catch {
      return INITIAL_POSTS
    }
  })

  // Guards
  const [guards, setGuards] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GUARDS)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Ensure defaultShiftHours defaults to 3h for standard consistency
        return parsed.map((g) => ({
          ...g,
          defaultShiftHours: g.defaultShiftHours === 4 ? 3 : (g.defaultShiftHours || 3),
        }))
      }
      return INITIAL_GUARDS
    } catch {
      return INITIAL_GUARDS
    }
  })

  // Shifts (monthKey -> guardId -> day -> hours)
  const [shifts, setShifts] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SHIFTS)
      return saved ? JSON.parse(saved) : INITIAL_SHIFTS
    } catch {
      return INITIAL_SHIFTS
    }
  })

  // Payments (monthKey_guardId_quinzena -> { status, paidAt, notes })
  const [payments, setPayments] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PAYMENTS)
      return saved ? JSON.parse(saved) : INITIAL_PAYMENTS
    } catch {
      return INITIAL_PAYMENTS
    }
  })

  // Shift Notes (monthKey -> guardId -> day -> string note for overtime/dobra)
  const [shiftNotes, setShiftNotes] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SHIFT_NOTES)
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  // Official G2 Manager Access Password
  const [managerPassword, setManagerPassword] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.MANAGER_PASSWORD) || 'g22026'
    } catch {
      return 'g22026'
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MANAGER_PASSWORD, managerPassword)
  }, [managerPassword])

  // Save to LocalStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser))
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER)
    }
  }, [currentUser])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HOURLY_RATE, String(defaultHourlyRate))
  }, [defaultHourlyRate])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BUDGET_CEILING, String(budgetCeiling))
  }, [budgetCeiling])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_MONTH, selectedMonth)
  }, [selectedMonth])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts))
  }, [posts])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GUARDS, JSON.stringify(guards))
  }, [guards])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts))
  }, [shifts])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments))
  }, [payments])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHIFT_NOTES, JSON.stringify(shiftNotes))
  }, [shiftNotes])

  // Refresh from Supabase (Fetch latest Cloud Data)
  const refreshFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return false
    setIsSyncing(true)
    try {
      const [postsRes, guardsRes, shiftsRes, notesRes, paymentsRes, settingsRes] = await Promise.all([
        supabase.from('posts').select('*'),
        supabase.from('guards').select('*'),
        supabase.from('shifts').select('*'),
        supabase.from('shift_notes').select('*'),
        supabase.from('payments').select('*'),
        supabase.from('app_settings').select('*'),
      ])

      if (postsRes.data && postsRes.data.length > 0) {
        setPosts(postsRes.data.map(postFromDb))
      }
      if (guardsRes.data && guardsRes.data.length > 0) {
        setGuards(guardsRes.data.map(guardFromDb))
      }
      if (shiftsRes.data && shiftsRes.data.length > 0) {
        const nextShifts = {}
        shiftsRes.data.forEach((r) => {
          if (!nextShifts[r.month]) nextShifts[r.month] = {}
          if (!nextShifts[r.month][r.guard_id]) nextShifts[r.month][r.guard_id] = {}
          nextShifts[r.month][r.guard_id][r.day] = Number(r.hours)
        })
        setShifts(nextShifts)
      }
      if (notesRes.data && notesRes.data.length > 0) {
        const nextNotes = {}
        notesRes.data.forEach((r) => {
          if (!nextNotes[r.month]) nextNotes[r.month] = {}
          if (!nextNotes[r.month][r.guard_id]) nextNotes[r.month][r.guard_id] = {}
          nextNotes[r.month][r.guard_id][r.day] = r.note
        })
        setShiftNotes(nextNotes)
      }
      if (paymentsRes.data && paymentsRes.data.length > 0) {
        const nextPayments = {}
        paymentsRes.data.forEach((r) => {
          nextPayments[r.key] = {
            status: r.status || 'PAID',
            paidAt: r.paid_at,
            notes: r.notes || '',
          }
        })
        setPayments(nextPayments)
      }
      if (settingsRes.data && settingsRes.data.length > 0) {
        settingsRes.data.forEach((r) => {
          if (r.key === 'hourly_rate') setDefaultHourlyRate(Number(r.value) || 40)
          if (r.key === 'budget_ceiling') setBudgetCeiling(Number(r.value) || 12000)
          if (r.key === 'selected_month') setSelectedMonth(r.value)
          if (r.key === 'manager_password' && r.value) setManagerPassword(r.value)
        })
      }
      setLastSyncTime(new Date())
      setIsSyncing(false)
      return true
    } catch (err) {
      console.warn('Erro ao carregar dados do Supabase:', err)
      setIsSyncing(false)
      return false
    }
  }, [])

  // Initial fetch on mount if Supabase is configured
  useEffect(() => {
    if (isSupabaseConfigured) {
      refreshFromSupabase()
    }
  }, [refreshFromSupabase])

  // Background Cloud Sync Helpers (Fail-safe, non-blocking)
  const syncGuardCloud = async (guard, action = 'upsert') => {
    if (!isSupabaseConfigured || !supabase) return
    try {
      if (action === 'delete') {
        await supabase.from('guards').delete().eq('id', guard.id)
      } else {
        await supabase.from('guards').upsert(guardToDb(guard))
      }
    } catch (e) {
      console.warn('Supabase guard sync warning:', e)
    }
  }

  const syncPostCloud = async (post, action = 'upsert') => {
    if (!isSupabaseConfigured || !supabase) return
    try {
      if (action === 'delete') {
        await supabase.from('posts').delete().eq('id', post.id)
      } else {
        await supabase.from('posts').upsert(postToDb(post))
      }
    } catch (e) {
      console.warn('Supabase post sync warning:', e)
    }
  }

  const syncShiftCloud = async (month, guardId, day, hours) => {
    if (!isSupabaseConfigured || !supabase) return
    try {
      if (hours === null || hours === undefined || hours === '') {
        await supabase.from('shifts').delete().match({ month, guard_id: guardId, day })
      } else {
        await supabase.from('shifts').upsert({
          month,
          guard_id: guardId,
          day: Number(day),
          hours: Number(hours),
          updated_at: new Date().toISOString(),
        })
      }
    } catch (e) {
      console.warn('Supabase shift sync warning:', e)
    }
  }

  const syncShiftNoteCloud = async (month, guardId, day, note) => {
    if (!isSupabaseConfigured || !supabase) return
    try {
      if (!note || !note.trim()) {
        await supabase.from('shift_notes').delete().match({ month, guard_id: guardId, day })
      } else {
        await supabase.from('shift_notes').upsert({
          month,
          guard_id: guardId,
          day: Number(day),
          note: note.trim(),
          updated_at: new Date().toISOString(),
        })
      }
    } catch (e) {
      console.warn('Supabase shift note sync warning:', e)
    }
  }

  const syncPaymentCloud = async (key, month, guardId, quinzena, action = 'upsert') => {
    if (!isSupabaseConfigured || !supabase) return
    try {
      if (action === 'delete') {
        await supabase.from('payments').delete().eq('key', key)
      } else {
        await supabase.from('payments').upsert({
          key,
          month,
          guard_id: guardId,
          quinzena,
          status: 'PAID',
          paid_at: new Date().toISOString(),
          notes: 'PIX Realizado',
          updated_at: new Date().toISOString(),
        })
      }
    } catch (e) {
      console.warn('Supabase payment sync warning:', e)
    }
  }

  const syncSettingCloud = async (key, value) => {
    if (!isSupabaseConfigured || !supabase) return
    try {
      await supabase.from('app_settings').upsert({
        key,
        value: String(value),
        updated_at: new Date().toISOString(),
      })
    } catch (e) {
      console.warn('Supabase setting sync warning:', e)
    }
  }

  // Login & Logout
  const login = (userData) => {
    setCurrentUser(userData)
  }

  const logout = () => {
    setCurrentUser(null)
  }

  // Update Rate & Budget with cloud sync
  const updateDefaultHourlyRate = (rate) => {
    setDefaultHourlyRate(rate)
    syncSettingCloud('hourly_rate', rate)
  }

  const updateBudgetCeiling = (budget) => {
    setBudgetCeiling(budget)
    syncSettingCloud('budget_ceiling', budget)
  }

  const updateSelectedMonth = (month) => {
    setSelectedMonth(month)
    syncSettingCloud('selected_month', month)
  }

  const updateManagerPassword = (pass) => {
    setManagerPassword(pass)
    syncSettingCloud('manager_password', pass)
  }

  // Guard Actions (Incluir / Editar / Inativar / Excluir)
  const addGuard = (guardData) => {
    const newGuard = {
      id: `g-${Date.now()}`,
      active: true,
      hourlyRate: defaultHourlyRate,
      defaultShiftHours: 3,
      ...guardData,
    }
    setGuards((prev) => [...prev, newGuard])
    syncGuardCloud(newGuard, 'upsert')
    return newGuard
  }

  const updateGuard = (id, updates) => {
    setGuards((prev) => {
      const next = prev.map((g) => (g.id === id ? { ...g, ...updates } : g))
      const updated = next.find((g) => g.id === id)
      if (updated) syncGuardCloud(updated, 'upsert')
      return next
    })
  }

  const toggleGuardActive = (id) => {
    setGuards((prev) => {
      const next = prev.map((g) => (g.id === id ? { ...g, active: !g.active } : g))
      const updated = next.find((g) => g.id === id)
      if (updated) syncGuardCloud(updated, 'upsert')
      return next
    })
  }

  const deleteGuard = (id) => {
    setGuards((prev) => prev.filter((g) => g.id !== id))
    syncGuardCloud({ id }, 'delete')
  }

  // Post Actions
  const addPost = (postData) => {
    const newPost = {
      id: `post-${Date.now()}`,
      active: true,
      ...postData,
    }
    setPosts((prev) => [...prev, newPost])
    syncPostCloud(newPost, 'upsert')
    return newPost
  }

  const updatePost = (id, updates) => {
    setPosts((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      const updated = next.find((p) => p.id === id)
      if (updated) syncPostCloud(updated, 'upsert')
      return next
    })
  }

  const deletePost = (id) => {
    setPosts((prev) => prev.filter((p) => p.id !== id))
    syncPostCloud({ id }, 'delete')
  }

  // Shift Cell Hours Updates (supports hours and optional note for overtime/dobra)
  const setShiftHours = (guardId, day, hours, note = undefined) => {
    setShifts((prev) => {
      const monthData = prev[selectedMonth] || {}
      const guardData = monthData[guardId] || {}
      const updatedGuardData = { ...guardData }

      if (hours === null || hours === undefined || hours === '') {
        delete updatedGuardData[day]
      } else {
        updatedGuardData[day] = Number(hours)
      }

      return {
        ...prev,
        [selectedMonth]: {
          ...monthData,
          [guardId]: updatedGuardData,
        },
      }
    })
    syncShiftCloud(selectedMonth, guardId, day, hours)

    if (note !== undefined) {
      setShiftNotes((prev) => {
        const monthNotes = prev[selectedMonth] || {}
        const guardNotes = monthNotes[guardId] || {}
        const nextGuardNotes = { ...guardNotes }
        if (!note || note.trim() === '') {
          delete nextGuardNotes[day]
        } else {
          nextGuardNotes[day] = note.trim()
        }
        return {
          ...prev,
          [selectedMonth]: {
            ...monthNotes,
            [guardId]: nextGuardNotes,
          },
        }
      })
      syncShiftNoteCloud(selectedMonth, guardId, day, note)
    }
  }

  const getShiftNote = (guardId, day) => {
    return shiftNotes[selectedMonth]?.[guardId]?.[day] || ''
  }

  // Calculations for a guard in a quinzena (1 or 2)
  const getGuardCalculations = (guardId, _quinzena = 'both') => {
    const monthData = shifts[selectedMonth] || {}
    const guardShifts = monthData[guardId] || {}
    const guard = guards.find((g) => g.id === guardId)
    const rate = guard?.hourlyRate || defaultHourlyRate

    let q1Hours = 0
    let q2Hours = 0

    // Days in current selected month
    const [year, month] = selectedMonth.split('-').map(Number)
    const totalDaysInMonth = new Date(year, month, 0).getDate()

    for (let day = 1; day <= 15; day++) {
      const h = Number(guardShifts[day]) || 0
      q1Hours += h
    }

    for (let day = 16; day <= totalDaysInMonth; day++) {
      const h = Number(guardShifts[day]) || 0
      q2Hours += h
    }

    const q1Total = q1Hours * rate
    const q2Total = q2Hours * rate
    const totalHours = q1Hours + q2Hours
    const totalAmount = q1Total + q2Total

    return {
      rate,
      q1Hours,
      q1Total,
      q2Hours,
      q2Total,
      totalHours,
      totalAmount,
      totalDaysInMonth,
    }
  }

  // Payment Tracking
  const getPaymentStatus = (guardId, quinzenaKey) => {
    const key = `${selectedMonth}_${guardId}_${quinzenaKey}`
    return payments[key] || { status: 'PENDING', paidAt: null }
  }

  const togglePaymentStatus = (guardId, quinzenaKey) => {
    const key = `${selectedMonth}_${guardId}_${quinzenaKey}`
    setPayments((prev) => {
      const current = prev[key]
      if (current && current.status === 'PAID') {
        const next = { ...prev }
        delete next[key]
        syncPaymentCloud(key, selectedMonth, guardId, quinzenaKey, 'delete')
        return next
      } else {
        syncPaymentCloud(key, selectedMonth, guardId, quinzenaKey, 'upsert')
        return {
          ...prev,
          [key]: {
            status: 'PAID',
            paidAt: new Date().toISOString(),
          },
        }
      }
    })
  }

  // Get summary of pending payments (alert indicator)
  const getPendingPaymentsSummary = (quinzena = 'both') => {
    let pendingCount = 0
    let pendingAmount = 0
    let paidCount = 0
    let paidAmount = 0
    const activeGuardsList = guards.filter((g) => g.active)

    activeGuardsList.forEach((g) => {
      const calc = getGuardCalculations(g.id)
      if (quinzena === 'q1' || quinzena === 'both') {
        const s1 = getPaymentStatus(g.id, 'q1')
        if (calc.q1Total > 0) {
          if (s1.status === 'PAID') {
            paidCount++
            paidAmount += calc.q1Total
          } else {
            pendingCount++
            pendingAmount += calc.q1Total
          }
        }
      }
      if (quinzena === 'q2' || quinzena === 'both') {
        const s2 = getPaymentStatus(g.id, 'q2')
        if (calc.q2Total > 0) {
          if (s2.status === 'PAID') {
            paidCount++
            paidAmount += calc.q2Total
          } else {
            pendingCount++
            pendingAmount += calc.q2Total
          }
        }
      }
    })

    return { pendingCount, pendingAmount, paidCount, paidAmount }
  }

  // Auto-schedule generator
  const applyAutoSchedule = ({ guardId, pattern, hours, quinzena = 'both', customDays = [] }) => {
    const [y, m] = selectedMonth.split('-').map(Number)
    const totalDays = new Date(y, m, 0).getDate()

    let startDay = 1
    let endDay = totalDays
    if (quinzena === 'q1') {
      endDay = 15
    } else if (quinzena === 'q2') {
      startDay = 16
    }

    const rowsToSync = []

    setShifts((prev) => {
      const monthData = prev[selectedMonth] || {}
      const guardData = { ...(monthData[guardId] || {}) }

      for (let d = startDay; d <= endDay; d++) {
        let shouldApply = false
        if (pattern === 'even' && d % 2 === 0) shouldApply = true
        else if (pattern === 'odd' && d % 2 !== 0) shouldApply = true
        else if (pattern === 'all') shouldApply = true
        else if (pattern === '12x36_odd' && d % 2 !== 0) shouldApply = true
        else if (pattern === '12x36_even' && d % 2 === 0) shouldApply = true
        else if (pattern === 'custom' && customDays.includes(d)) shouldApply = true

        if (shouldApply) {
          guardData[d] = Number(hours)
          rowsToSync.push({
            month: selectedMonth,
            guard_id: guardId,
            day: d,
            hours: Number(hours),
            updated_at: new Date().toISOString(),
          })
        }
      }

      return {
        ...prev,
        [selectedMonth]: {
          ...monthData,
          [guardId]: guardData,
        },
      }
    })

    if (isSupabaseConfigured && supabase && rowsToSync.length > 0) {
      supabase.from('shifts').upsert(rowsToSync).then(() => {}).catch(console.warn)
    }
  }

  // Duplicate entire month schedule
  const copyMonthShifts = (fromMonth, toMonth) => {
    const source = shifts[fromMonth] || {}
    setShifts((prev) => ({
      ...prev,
      [toMonth]: JSON.parse(JSON.stringify(source)),
    }))

    if (isSupabaseConfigured && supabase) {
      const rows = []
      Object.entries(source).forEach(([gid, daysObj]) => {
        Object.entries(daysObj).forEach(([d, h]) => {
          rows.push({
            month: toMonth,
            guard_id: gid,
            day: Number(d),
            hours: Number(h),
            updated_at: new Date().toISOString(),
          })
        })
      })
      if (rows.length > 0) {
        supabase.from('shifts').upsert(rows).then(() => {}).catch(console.warn)
      }
    }
  }

  // Batch mark quinzena as paid
  const batchMarkPaid = (quinzenaKey, guardIds) => {
    const now = new Date().toISOString()
    const rows = []

    setPayments((prev) => {
      const next = { ...prev }
      guardIds.forEach((gid) => {
        const key = `${selectedMonth}_${gid}_${quinzenaKey}`
        next[key] = { status: 'PAID', paidAt: now }
        rows.push({
          key,
          month: selectedMonth,
          guard_id: gid,
          quinzena: quinzenaKey,
          status: 'PAID',
          paid_at: now,
          notes: 'PIX em Lote',
          updated_at: now,
        })
      })
      return next
    })

    if (isSupabaseConfigured && supabase && rows.length > 0) {
      supabase.from('payments').upsert(rows).then(() => {}).catch(console.warn)
    }
  }

  // Batch today checkin
  const quickTodayCheckin = (day, records) => {
    setShifts((prev) => {
      const monthData = prev[selectedMonth] || {}
      const newMonthData = { ...monthData }
      records.forEach(({ guardId, hours }) => {
        const guardData = { ...(newMonthData[guardId] || {}) }
        if (hours === null || hours === undefined) {
          delete guardData[day]
          syncShiftCloud(selectedMonth, guardId, day, null)
        } else {
          guardData[day] = Number(hours)
          syncShiftCloud(selectedMonth, guardId, day, hours)
        }
        newMonthData[guardId] = guardData
      })
      return {
        ...prev,
        [selectedMonth]: newMonthData,
      }
    })
  }

  // Batch assign multiple days to one or more guards
  const setMultiDayShifts = (guardIds, days, hours) => {
    const ids = Array.isArray(guardIds) ? guardIds : [guardIds]
    const upsertRows = []
    const deleteMatches = []

    setShifts((prev) => {
      const monthData = prev[selectedMonth] || {}
      const newMonthData = { ...monthData }

      ids.forEach((gid) => {
        const guardData = { ...(newMonthData[gid] || {}) }
        days.forEach((d) => {
          if (hours === null || hours === undefined) {
            delete guardData[d]
            deleteMatches.push({ month: selectedMonth, guard_id: gid, day: d })
          } else {
            guardData[d] = Number(hours)
            upsertRows.push({
              month: selectedMonth,
              guard_id: gid,
              day: Number(d),
              hours: Number(hours),
              updated_at: new Date().toISOString(),
            })
          }
        })
        newMonthData[gid] = guardData
      })

      return {
        ...prev,
        [selectedMonth]: newMonthData,
      }
    })

    if (isSupabaseConfigured && supabase) {
      if (upsertRows.length > 0) {
        supabase.from('shifts').upsert(upsertRows).then(() => {}).catch(console.warn)
      }
      deleteMatches.forEach((m) => {
        supabase.from('shifts').delete().match(m).then(() => {}).catch(console.warn)
      })
    }
  }

  // Batch apply parsed schedule from WhatsApp / external text
  const batchApplyParsedSchedule = (records, clearExistingForGuards = false) => {
    setShifts((prev) => {
      const monthData = prev[selectedMonth] || {}
      const newMonthData = { ...monthData }

      if (clearExistingForGuards) {
        const uniqueGuards = [...new Set(records.map((r) => r.guardId))]
        uniqueGuards.forEach((gid) => {
          newMonthData[gid] = {}
        })
      }

      const rowsToUpsert = []
      records.forEach(({ guardId, day, hours }) => {
        const guardData = { ...(newMonthData[guardId] || {}) }
        if (hours === null || hours === undefined || Number(hours) === 0) {
          delete guardData[day]
        } else {
          guardData[day] = Number(hours)
          rowsToUpsert.push({
            month: selectedMonth,
            guard_id: guardId,
            day: Number(day),
            hours: Number(hours),
            updated_at: new Date().toISOString(),
          })
        }
        newMonthData[guardId] = guardData
      })

      if (isSupabaseConfigured && supabase && rowsToUpsert.length > 0) {
        supabase.from('shifts').upsert(rowsToUpsert).then(() => {}).catch(console.warn)
      }

      return {
        ...prev,
        [selectedMonth]: newMonthData,
      }
    })
  }

  // Reset to default spreadsheet data
  const resetToTemplateData = () => {
    setPosts(INITIAL_POSTS)
    setGuards(INITIAL_GUARDS)
    setShifts(INITIAL_SHIFTS)
    setPayments(INITIAL_PAYMENTS)
    setDefaultHourlyRate(40)
    setSelectedMonth(CURRENT_MONTH_KEY)
  }

  // Export & Import Backup
  const exportBackupJSON = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      defaultHourlyRate,
      budgetCeiling,
      selectedMonth,
      posts,
      guards,
      shifts,
      payments,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `G2_Backup_${selectedMonth}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const importBackupJSON = (jsonString) => {
    try {
      const data = JSON.parse(jsonString)
      if (data.posts) setPosts(data.posts)
      if (data.guards) setGuards(data.guards)
      if (data.shifts) setShifts(data.shifts)
      if (data.payments) setPayments(data.payments)
      if (data.defaultHourlyRate) setDefaultHourlyRate(data.defaultHourlyRate)
      if (data.budgetCeiling) setBudgetCeiling(data.budgetCeiling)
      if (data.selectedMonth) setSelectedMonth(data.selectedMonth)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  return (
    <AppContext.Provider
      value={{
        currentUser,
        login,
        logout,
        selectedMonth,
        setSelectedMonth: updateSelectedMonth,
        defaultHourlyRate,
        setDefaultHourlyRate: updateDefaultHourlyRate,
        budgetCeiling,
        setBudgetCeiling: updateBudgetCeiling,
        posts,
        guards,
        shifts,
        payments,
        addGuard,
        updateGuard,
        toggleGuardActive,
        deleteGuard,
        addPost,
        updatePost,
        deletePost,
        setShiftHours,
        shiftNotes,
        getShiftNote,
        getGuardCalculations,
        getPaymentStatus,
        togglePaymentStatus,
        getPendingPaymentsSummary,
        applyAutoSchedule,
        copyMonthShifts,
        batchMarkPaid,
        quickTodayCheckin,
        setMultiDayShifts,
        batchApplyParsedSchedule,
        resetToTemplateData,
        exportBackupJSON,
        importBackupJSON,
        // Manager Password
        managerPassword,
        updateManagerPassword,
        // Supabase Cloud State & Methods
        isSupabaseConfigured,
        isSyncing,
        lastSyncTime,
        refreshFromSupabase,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
