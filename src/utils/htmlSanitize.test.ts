import { describe, expect, it } from 'vitest'
import { sanitizeHtml, stripHtml } from './htmlSanitize'

describe('htmlSanitize', () => {
  it('preserva quebras de linha quando o editor envia divs', () => {
    const raw = '<div>Primeira linha</div><div>Segunda linha</div>'
    expect(sanitizeHtml(raw)).toBe('Primeira linha<br/>Segunda linha<br/>')
  })

  it('mantem apenas estilos seguros de cor em spans', () => {
    const raw = '<span style="color: red; background-color: #fff; position: absolute;">Texto</span>'
    expect(sanitizeHtml(raw)).toBe('<span style="color: red; background-color: #fff">Texto</span>')
  })

  it('remove estilos perigosos', () => {
    const raw = '<span style="color: red; background-image: url(javascript:alert(1))">X</span>'
    expect(sanitizeHtml(raw)).toBe('<span>X</span>')
  })

  it('converte font color para span com style seguro', () => {
    const raw = '<font color="#007E7A">Vale</font>'
    expect(sanitizeHtml(raw)).toBe('<span style="color: #007E7A">Vale</span>')
  })

  it('remove tags e mantém texto para busca', () => {
    const raw = '<p>Acao <b>critica</b><br/>hoje</p>'
    expect(stripHtml(raw)).toBe('Acao criticahoje')
  })
})
