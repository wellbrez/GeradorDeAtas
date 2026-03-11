import { describe, expect, it } from 'vitest'
import { sanitizeHtml, stripHtml } from './htmlSanitize'

describe('sanitizeHtml', () => {
  it('preserva quebra de linha ao converter divs não permitidas', () => {
    const input = '<div>Linha 1</div><div>Linha 2</div>'

    expect(sanitizeHtml(input)).toBe('Linha 1<br/>Linha 2<br/>')
  })

  it('remove style quando houver conteúdo perigoso', () => {
    const input = '<span style="color: #007E7A; background-image: url(javascript:alert(1))">texto</span>'

    expect(sanitizeHtml(input)).toBe('<span>texto</span>')
  })

  it('converte font color para span com style seguro', () => {
    const input = '<font color="#007E7A">texto</font>'

    expect(sanitizeHtml(input)).toBe('<span style="color: #007E7A">texto</span>')
  })
})

describe('stripHtml', () => {
  it('retorna apenas o texto sem tags', () => {
    const input = '<p>Texto <b>rico</b></p>'

    expect(stripHtml(input)).toBe('Texto rico')
  })
})
