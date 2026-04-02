import { describe, expect, it } from 'vitest'
import { sanitizeHtml, stripHtml } from './htmlSanitize'

describe('htmlSanitize.sanitizeHtml', () => {
  it('remove scripts, preserva tags permitidas e converte blocos div em quebras', () => {
    const input =
      '<div>linha 1</div><script>alert(1)</script><span style="color:#007E7A;background-color: #fff">ok</span>'

    const result = sanitizeHtml(input)

    expect(result).toContain('linha 1')
    expect(result).toContain('<br/>')
    expect(result).toContain('<span style="color: #007E7A; background-color: #fff">ok</span>')
    expect(result).not.toContain('<script>')
    expect(result).not.toContain('alert(1)')
  })

  it('permite somente data URLs de imagem válidas e bloqueia atributos perigosos', () => {
    const validImg = '<img src="data:image/png;base64,aGVsbG8=" alt="figura" onerror="alert(1)" />'
    const invalidImg = '<img src="https://externo.com/a.png" alt="externa" />'

    const validResult = sanitizeHtml(validImg)
    const invalidResult = sanitizeHtml(invalidImg)

    expect(validResult).toBe('<img src="data:image/png;base64,aGVsbG8=" alt="figura" />')
    expect(invalidResult).toBe('')
  })

  it('bloqueia style inseguro e converte font color seguro em span', () => {
    const styleInput = '<span style="color:red; background:url(javascript:alert(1))">texto</span>'
    const fontInput = '<font color="#0ABB98">texto</font>'

    expect(sanitizeHtml(styleInput)).toBe('<span>texto</span>')
    expect(sanitizeHtml(fontInput)).toBe('<span style="color: #0ABB98">texto</span>')
  })
})

describe('htmlSanitize.stripHtml', () => {
  it('remove marcação HTML e retorna apenas texto', () => {
    expect(stripHtml('<p>Olá <b>Mundo</b></p>')).toBe('Olá Mundo')
  })
})
