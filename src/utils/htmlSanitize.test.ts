import { describe, expect, it } from 'vitest'
import { sanitizeHtml } from './htmlSanitize'

describe('sanitizeHtml', () => {
  it('keeps safe data URL images and sanitizes alt text', () => {
    const input = `<p>Inicio<img src="data:image/png;base64,AAAA" alt='a"b' onerror="alert(1)" /></p>`

    const sanitized = sanitizeHtml(input)

    expect(sanitized).toBe('<p>Inicio<img src="data:image/png;base64,AAAA" alt="a b" /></p>')
    expect(sanitized).not.toContain('onerror')
  })

  it('removes images with non-data URL src', () => {
    const input = '<p>a<img src="https://example.com/x.png" alt="x" />b</p>'

    const sanitized = sanitizeHtml(input)

    expect(sanitized).toBe('<p>ab</p>')
    expect(sanitized).not.toContain('<img')
  })

  it('removes images that exceed data URL length limit', () => {
    const prefix = 'data:image/jpeg;base64,'
    const oversizedDataUrl = prefix + 'a'.repeat(80_001 - prefix.length)
    const input = `<img src="${oversizedDataUrl}" alt="big" />`

    const sanitized = sanitizeHtml(input)

    expect(sanitized).toBe('')
  })
})
