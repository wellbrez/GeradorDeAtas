import { describe, expect, it } from 'vitest'
import { sanitizeHtml } from './htmlSanitize'

describe('sanitizeHtml', () => {
  it('preserves valid inline data image with sanitized alt text', () => {
    const input = '<p>Foto: <img src="data:image/png;base64,AAAA" alt="line1\nline2\"x" /></p>'
    const result = sanitizeHtml(input)
    expect(result).toContain('<img src="data:image/png;base64,AAAA" alt="line1 line2 x" />')
    expect(result.startsWith('<p>Foto: ')).toBe(true)
  })

  it('removes image with non-data URL', () => {
    const input = '<p>Foto <img src="https://malicioso.example/x.png" alt="x" /></p>'
    expect(sanitizeHtml(input)).toBe('<p>Foto </p>')
  })

  it('removes image when data URL exceeds max length', () => {
    const longBase64 = 'A'.repeat(80_001)
    const input = `<img src="data:image/png;base64,${longBase64}" alt="ok" />`
    expect(sanitizeHtml(input)).toBe('')
  })
})
