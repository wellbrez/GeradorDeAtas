import { describe, expect, it } from 'vitest'
import { formatDateOnlyAsYmdLocal, parseDateOnlyAsLocal } from './dateOnlyLocal'

describe('dateOnlyLocal', () => {
  it('interprets YYYY-MM-DD as local noon to avoid timezone shift', () => {
    const parsed = parseDateOnlyAsLocal('2026-03-07')

    expect(parsed.getFullYear()).toBe(2026)
    expect(parsed.getMonth()).toBe(2)
    expect(parsed.getDate()).toBe(7)
    expect(parsed.getHours()).toBe(12)
  })

  it('formats date-only strings as local YYYY-MM-DD', () => {
    expect(formatDateOnlyAsYmdLocal('2026-03-07')).toBe('2026-03-07')
    expect(formatDateOnlyAsYmdLocal(' 2026-03-07 ')).toBe('2026-03-07')
  })

  it('returns empty output when input is null', () => {
    expect(formatDateOnlyAsYmdLocal(null)).toBe('')
  })
})
