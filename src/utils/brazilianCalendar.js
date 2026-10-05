/**
 * Brazilian National Calendar Utilities
 * Standard calendar with Brazilian national holidays, weekdays (Dom..Sáb),
 * and precise quinzena calculations: 1ª Quinzena (01 a 15) and 2ª Quinzena (16 ao final).
 */

// Calculate Easter date for any Gregorian year
function calculateEaster(year) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function addDays(date, days) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

// Get all Brazilian National Holidays for a given year
export function getBrazilianHolidays(year) {
  const holidays = {}

  // Helper to format key: MM-DD
  const formatKey = (m, d) => `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  // 1. Fixed National Holidays (Feriados Nacionais Fixos)
  holidays[formatKey(1, 1)] = 'Confraternização Universal (Ano Novo)'
  holidays[formatKey(4, 21)] = 'Tiradentes'
  holidays[formatKey(5, 1)] = 'Dia do Trabalhador'
  holidays[formatKey(9, 7)] = 'Independência do Brasil'
  holidays[formatKey(10, 12)] = 'Nossa Sra. Aparecida (Padroeira do Brasil)'
  holidays[formatKey(11, 2)] = 'Finados'
  holidays[formatKey(11, 15)] = 'Proclamação da República'
  holidays[formatKey(11, 20)] = 'Dia da Consciência Negra (Feriado Nacional)'
  holidays[formatKey(12, 25)] = 'Natal'

  // 2. Movable National Holidays based on Easter
  const easter = calculateEaster(year)
  const carnival = addDays(easter, -47) // Terça-feira de Carnaval
  const goodFriday = addDays(easter, -2) // Sexta-feira Santa / Paixão
  const corpusChristi = addDays(easter, 60) // Corpus Christi

  holidays[formatKey(carnival.getMonth() + 1, carnival.getDate())] = 'Carnaval'
  holidays[formatKey(goodFriday.getMonth() + 1, goodFriday.getDate())] = 'Sexta-feira Santa'
  holidays[formatKey(easter.getMonth() + 1, easter.getDate())] = 'Páscoa'
  holidays[formatKey(corpusChristi.getMonth() + 1, corpusChristi.getDate())] = 'Corpus Christi'

  return holidays
}

// Check if a specific date is a Brazilian National Holiday
export function getHoliday(year, month, day) {
  const holidays = getBrazilianHolidays(year)
  const key = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const name = holidays[key]
  return name ? { name, isHoliday: true } : null
}

// Comprehensive month info according to standard Brazilian calendar
export function getMonthInfo(year, month) {
  // month is 1-indexed (1 = Jan, 9 = Set, etc.)
  const totalDays = new Date(year, month, 0).getDate()
  const firstDayObj = new Date(year, month - 1, 1)
  const firstDayOfWeek = firstDayObj.getDay() // 0 = Domingo, 1 = Segunda...

  const monthDate = new Date(year, month - 1, 1)
  const monthName = monthDate.toLocaleDateString('pt-BR', { month: 'long' })
  const formattedMonth = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${year}`

  // Quinzena 1: strictly 1 to 15
  const q1Days = Array.from({ length: 15 }, (_, i) => i + 1)
  // Quinzena 2: strictly 16 to the exact end of month
  const q2DaysCount = totalDays - 15
  const q2Days = Array.from({ length: q2DaysCount }, (_, i) => i + 16)

  return {
    year,
    month,
    totalDays,
    monthName,
    formattedMonth,
    firstDayOfWeek, // 0 = Dom, 6 = Sáb
    q1Days,
    q2Days,
    q1Label: '1ª Quinzena (01 a 15)',
    q2Label: `2ª Quinzena (16 a ${totalDays})`,
  }
}

// Brazilian Weekday Name
export const BRAZILIAN_WEEKDAYS = [
  { id: 0, short: 'Dom', full: 'Domingo', isWeekend: true },
  { id: 1, short: 'Seg', full: 'Segunda', isWeekend: false },
  { id: 2, short: 'Ter', full: 'Terça', isWeekend: false },
  { id: 3, short: 'Qua', full: 'Quarta', isWeekend: false },
  { id: 4, short: 'Qui', full: 'Quinta', isWeekend: false },
  { id: 5, short: 'Sex', full: 'Sexta', isWeekend: false },
  { id: 6, short: 'Sáb', full: 'Sábado', isWeekend: true },
]

export function getWeekday(year, month, day) {
  const date = new Date(year, month - 1, day)
  const dayIndex = date.getDay()
  return BRAZILIAN_WEEKDAYS[dayIndex]
}

export function formatCurrencyBR(amount = 0) {
  return `R$ ${Number(amount).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
