import { describe, expect, it } from 'vitest'
import { sanitizeHtml } from './htmlSanitize'

describe('sanitizeHtml', () => {
  it('keeps safe data-url images and strips unsafe image attributes', () => {
    const html =
      '<p>Texto</p><img src="data:image/png;base64,AAAA" alt="ok" onerror="alert(1)" style="width: 999px" />'

    const sanitized = sanitizeHtml(html)

    expect(sanitized).toContain('<p>Texto</p>')
    expect(sanitized).toContain('<img src="data:image/png;base64,AAAA" alt="ok" />')
    expect(sanitized).not.toContain('onerror=')
    expect(sanitized).not.toContain('style=')
  })

  it('drops image tags when src is not an allowed base64 data url', () => {
    const html = 'A<img src="https://example.com/x.png" alt="x" />B'

    const sanitized = sanitizeHtml(html)

    expect(sanitized).toBe('AB')
  })

  it('drops image tags when data url exceeds maximum size', () => {
    const tooLargeSrc = `data:image/png;base64,${'a'.repeat(80_001)}`

    const sanitized = sanitizeHtml(`<img src="${tooLargeSrc}" alt="x" />`)

    expect(sanitized).toBe('')
  })

  it('sanitizes image alt text by removing quotes/newlines and truncating', () => {
    const oversizedAlt = `abc"\n${'x'.repeat(400)}`
    const html = `<img src="data:image/png;base64,AAAA" alt="${oversizedAlt}" />`

    const sanitized = sanitizeHtml(html)
    const doc = new DOMParser().parseFromString(sanitized, 'text/html')
    const img = doc.querySelector('img')

    expect(img).not.toBeNull()
    expect(img?.getAttribute('alt')).toBeTruthy()
    expect(img?.getAttribute('alt')).not.toContain('"')
    expect(img?.getAttribute('alt')).not.toContain('\n')
    expect((img?.getAttribute('alt') ?? '').length).toBeLessThanOrEqual(200)
  })
})
