function pad(n) {
  return String(n).padStart(2, '0')
}

export function toDateStr(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function todayStr() {
  return toDateStr(new Date())
}

export function addDays(dateStr, delta) {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() + delta)
  return toDateStr(d)
}

export function lastNDays(n) {
  const days = []
  const today = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    days.push(toDateStr(d))
  }
  return days
}

export function currentWeekDays() {
  const today = new Date()
  const offset = (today.getDay() + 6) % 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - offset)
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    days.push(toDateStr(d))
  }
  return days
}

export function mondayOf(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`)
  const offset = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - offset)
  return toDateStr(d)
}

export function formatShortDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`)
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(d)
}

export function formatDayLabel(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`)
  return new Intl.DateTimeFormat('tr-TR', { weekday: 'short' }).format(d)
}

export function formatHeaderDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`)
  const weekday = new Intl.DateTimeFormat('tr-TR', { weekday: 'long' }).format(d)
  const month = new Intl.DateTimeFormat('tr-TR', { month: 'long' }).format(d)
  return `${weekday}, ${d.getDate()} ${month}`
}
