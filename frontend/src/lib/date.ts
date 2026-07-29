export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function parseISO(date: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 12))
}

function formatISO(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayISO(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(date: string, n: number): string {
  const anchored = parseISO(date)
  anchored.setUTCDate(anchored.getUTCDate() + n)
  return formatISO(anchored)
}

export function consecutiveDates(start: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addDays(start, i))
}

export function formatDayLabel(date: string): string {
  return parseISO(date).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

// Compact label for the month grid's cells: just the day number, except the
// 1st of a month also carries the abbreviated month name (e.g. "Aug. 1") so
// a month boundary within the grid is still legible at a glance.
export function formatMonthCellLabel(date: string): string {
  const parsed = parseISO(date)
  const day = parsed.getUTCDate()
  if (day !== 1) return String(day)
  const month = parsed.toLocaleDateString(undefined, { month: 'short', timeZone: 'UTC' })
  return `${month}. ${day}`
}

// Monday-aligned: getUTCDay() is 0=Sunday..6=Saturday, so Monday needs a 6-day
// lookback instead of the usual 1-day one when today itself is Sunday.
export function startOfWeek(date: string): string {
  const dayOfWeek = parseISO(date).getUTCDay()
  const offsetFromMonday = (dayOfWeek + 6) % 7
  return addDays(date, -offsetFromMonday)
}

export function threeWeekWindow(anchorDate: string): string[] {
  return consecutiveDates(startOfWeek(anchorDate), 21)
}

export function isValidDateParam(s: string | undefined): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s))
}
