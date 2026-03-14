import { describe, expect, it } from 'vitest'
import { sanitizeHtml, stripHtml } from './htmlSanitize'

describe('sanitizeHtml', () => {
  it('keeps only safe color style properties in span', () => {
    const html =
      '<span style="color: #123456; background-color: rgb(1, 2, 3); font-size: 20px">texto</span>'
    expect(sanitizeHtml(html)).toBe(
      '<span style="color: #123456; background-color: rgb(1, 2, 3)">texto</span>'
    )
  })

  it('removes unsafe style expressions from span', () => {
    const html = '<span style="color: expression(alert(1))">texto</span>'
    expect(sanitizeHtml(html)).toBe('<span>texto</span>')
  })

  it('allows only data URL images and blocks external sources', () => {
    const safe = '<img src="data:image/png;base64,QUJD" alt="ok" />'
    const unsafe = '<img src="https://example.com/logo.png" alt="ok" />'
    expect(sanitizeHtml(safe)).toBe('<img src="data:image/png;base64,QUJD" alt="ok" />')
    expect(sanitizeHtml(unsafe)).toBe('')
  })

  it('rejects oversized data URL images', () => {
    const oversized = `data:image/png;base64,${'A'.repeat(80_001)}`
    expect(sanitizeHtml(`<img src="${oversized}" />`)).toBe('')
  })

  it('converts unsupported block tags into line breaks', () => {
    const html = '<div>linha 1</div><div>linha 2</div>'
    expect(sanitizeHtml(html)).toBe('linha 1<br/>linha 2<br/>')
  })
})

describe('stripHtml', () => {
  it('returns only text content', () => {
    expect(stripHtml('<p>Ata <b>final</b></p>')).toBe('Ata final')
  })
})
