import { describe, expect, it } from 'vitest'
import { sanitizeHtml, stripHtml } from './htmlSanitize'

describe('sanitizeHtml', () => {
  it('remove a tag script e preserva o texto interno sem executar HTML', () => {
    const html = '<b>ok</b><script>alert(1)</script><i>italico</i>'
    const sanitized = sanitizeHtml(html)
    expect(sanitized).toBe('<b>ok</b>alert(1)<i>italico</i>')
    expect(sanitized).not.toContain('<script')
  })

  it('converte div em quebras de linha para manter visualização', () => {
    const html = '<div>linha 1</div><div>linha 2</div>'
    const sanitized = sanitizeHtml(html)
    expect(sanitized).toContain('linha 1')
    expect(sanitized).toContain('linha 2')
    expect(sanitized).toContain('<br/>')
  })

  it('remove todo style quando detectar conteúdo perigoso', () => {
    const html = '<span style="color:#007E7A; background-color: #fff; background:javascript:alert(1)">texto</span>'
    const sanitized = sanitizeHtml(html)
    expect(sanitized).toBe('<span>texto</span>')
  })

  it('converte font color seguro para span style', () => {
    const html = '<font color="#0ABB98">texto</font>'
    const sanitized = sanitizeHtml(html)
    expect(sanitized).toBe('<span style="color: #0ABB98">texto</span>')
  })

  it('remove imagem com src externo e aceita apenas data:image base64', () => {
    const unsafeImage = '<img src="https://example.com/a.png" alt="x" />'
    const safeImage = '<img src="data:image/png;base64,AAAA" alt="ok" />'

    expect(sanitizeHtml(unsafeImage)).toBe('')
    expect(sanitizeHtml(safeImage)).toBe('<img src="data:image/png;base64,AAAA" alt="ok" />')
  })
})

describe('stripHtml', () => {
  it('remove tags e retorna apenas texto', () => {
    const html = '<p>Primeira <b>linha</b></p><p>Segunda</p>'
    expect(stripHtml(html)).toBe('Primeira linhaSegunda')
  })
})
