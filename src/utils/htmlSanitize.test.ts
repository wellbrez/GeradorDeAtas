import { describe, expect, it } from 'vitest'
import { sanitizeHtml } from './htmlSanitize'

describe('sanitizeHtml', () => {
  it('keeps valid data URL images and strips dangerous attributes', () => {
    const tinyPng = 'data:image/png;base64,iVBORw0KGgo='
    const input = `<p>Texto</p><img src="${tinyPng}" alt='linha"1
linha2' onerror="alert('x')" />`

    const output = sanitizeHtml(input)

    expect(output).toContain('<p>Texto</p>')
    expect(output).toContain(`<img src="${tinyPng}" alt="linha 1 linha2" />`)
    expect(output).not.toContain('onerror')
  })

  it('removes img tags with non-image data URL or oversized payload', () => {
    const oversized = `data:image/png;base64,${'a'.repeat(80_001)}`
    const input = [
      'inicio',
      '<img src="javascript:alert(1)" alt="x" />',
      `<img src="${oversized}" alt="y" />`,
      'fim',
    ].join('')

    const output = sanitizeHtml(input)

    expect(output).toBe('iniciofim')
    expect(output).not.toContain('<img')
  })
})
