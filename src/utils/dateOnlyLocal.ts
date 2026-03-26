/**
 * Interpreta string de data como dia local (evita deslocamento de timezone).
 * Strings "YYYY-MM-DD" sem hora são interpretadas como UTC pelo `Date()`, o que
 * em fusos como Brasil (UTC-3) pode exibir o dia anterior.
 */
export function parseDateOnlyAsLocal(value: string): Date {
  const trimmed = (value || '').trim()
  if (trimmed.length === 10 && trimmed[4] === '-' && trimmed[7] === '-') {
    return new Date(trimmed + 'T12:00:00')
  }
  return new Date(value)
}

/**
 * Formata uma data para `YYYY-MM-DD` preservando dia local.
 */
export function formatDateOnlyAsYmdLocal(value: string | null): string {
  if (!value) return ''
  try {
    const trimmed = value.trim()
    if (trimmed.length === 10 && trimmed[4] === '-' && trimmed[7] === '-') return trimmed
    const d = parseDateOnlyAsLocal(value)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  } catch {
    return value
  }
}
