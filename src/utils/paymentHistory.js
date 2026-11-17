import { getMonthInfo } from './brazilianCalendar'

/**
 * Lista de pagamentos confirmados (status PAID), do mais recente para o mais antigo,
 * com horas e valor recalculados a partir da escala. Também devolve quantos
 * pagamentos existem em cada mês ("YYYY-MM").
 */
export function buildPaidRecords({ payments, guards, posts, shifts, defaultHourlyRate, currentMonthKey }) {
  const paidCountsByMonth = {}
  const records = Object.entries(payments || {})
    .filter(([, data]) => data?.status === 'PAID')
    .map(([key, data]) => {
      const [pMonth, pGuardId, pQuinzena = 'q1'] = key.split('_')
      paidCountsByMonth[pMonth] = (paidCountsByMonth[pMonth] || 0) + 1

      const guard = guards.find((g) => g.id === pGuardId)
      const post = posts.find((p) => p.id === guard?.postId)

      const guardMonthShifts = shifts[pMonth]?.[pGuardId] || {}
      const [pYear, pMNum] = (pMonth || currentMonthKey).split('-').map(Number)
      const pTotalDays = new Date(pYear, pMNum, 0).getDate()
      const rate = Number(guard?.hourlyRate) > 0 ? Number(guard.hourlyRate) : (Number(defaultHourlyRate) || 40)

      let pHours = 0
      const startDay = pQuinzena === 'q1' ? 1 : 16
      const endDay = pQuinzena === 'q1' ? 15 : pTotalDays
      for (let d = startDay; d <= endDay; d++) {
        const h = Number(guardMonthShifts[d])
        if (!isNaN(h) && h > 0) pHours += h
      }
      const pAmount = Math.round(pHours * rate * 100) / 100
      const pMonthInfo = getMonthInfo(pYear, pMNum)

      return {
        key,
        month: pMonth,
        monthName: pMonthInfo.formattedMonth,
        guardId: pGuardId,
        guardName: guard?.name || pGuardId,
        guardFullName: guard?.fullName || '',
        pixKey: guard?.pixKey || '',
        pixType: guard?.pixType || '',
        postName: post?.name || 'Posto Geral',
        quinzena: pQuinzena,
        quinzenaLabel: pQuinzena === 'q1' ? '1ª Quinzena (01 a 15)' : '2ª Quinzena (16 ao fim)',
        paidAt: data.paidAt,
        notes: data.notes || 'PIX Realizado',
        hours: pHours,
        amount: pAmount,
      }
    })
    .sort((a, b) => {
      if (a.paidAt && b.paidAt) return new Date(b.paidAt) - new Date(a.paidAt)
      return b.month.localeCompare(a.month)
    })

  return { records, paidCountsByMonth }
}
