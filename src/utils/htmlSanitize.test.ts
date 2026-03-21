import { describe, expect, it } from 'vitest'
import { sanitizeHtml, stripHtml } from './htmlSanitize'

describe('sanitizeHtml', () => {
  it('preserva apenas estilos de cor seguros em spans', () => {
    const input = '<span style="color: #fff; font-size: 20px; background-color: rgb(1,2,3);">texto</span>'

    const result = sanitizeHtml(input)

    expect(result).toBe('<span style="color: #fff; background-color: rgb(1,2,3)">texto</span>')
  })

  it('remove estilos com url/javascript de spans', () => {
    const input = '<span style="background: url(javascript:alert(1)); color: red;">risco</span>'

    const result = sanitizeHtml(input)

    expect(result).toBe('<span>risco</span>')
  })

  it('permite apenas imagens data URL dentro do limite', () => {
    const valid = '<img src="data:image/png;base64,AAAA" alt="ok" />'
    const invalid = '<img src="https://example.com/unsafe.png" alt="x" />'
    const oversizedData = `data:image/png;base64,${'A'.repeat(80_001)}`
    const oversized = `<img src="${oversizedData}" alt="big" />`

    expect(sanitizeHtml(valid)).toBe('<img src="data:image/png;base64,AAAA" alt="ok" />')
    expect(sanitizeHtml(invalid)).toBe('')
    expect(sanitizeHtml(oversized)).toBe('')
  })
})

describe('stripHtml', () => {
  it('retorna apenas texto para uso em busca', () => {
    const input = '<p><b>Teste</b> <span style="color: red;">de busca</span></p>'

    const result = stripHtml(input)

    expect(result).toBe('Teste de busca')
  })
})
