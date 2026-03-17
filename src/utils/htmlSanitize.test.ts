import { describe, expect, it } from 'vitest'
import { sanitizeHtml, stripHtml } from './htmlSanitize'

describe('sanitizeHtml', () => {
  it('mantém imagem data URL válida e sanitiza alt', () => {
    const html =
      '<p>Texto<img src="data:image/png;base64,aGVsbG8=" alt="imagem &quot;1\n2\r3" onerror="alert(1)" /></p>'

    const out = sanitizeHtml(html)

    expect(out).toContain('<img src="data:image/png;base64,aGVsbG8=" alt="imagem  1 2 3" />')
    expect(out).not.toContain('onerror')
  })

  it('remove imagens com src inválido ou data URL grande demais', () => {
    const hugeDataUrl = `data:image/png;base64,${'a'.repeat(80_001)}`
    const html = `<p>ok</p><img src="https://example.com/a.png" /><img src="${hugeDataUrl}" />`

    const out = sanitizeHtml(html)

    expect(out).toBe('<p>ok</p>')
  })

  it('preserva apenas estilos seguros de cor em span', () => {
    const html =
      '<span style="color: red; font-weight: bold; background-color: #fff">A</span><span style="background:url(javascript:alert(1));color: blue">B</span>'

    const out = sanitizeHtml(html)

    expect(out).toContain('<span style="color: red; background-color: #fff">A</span>')
    expect(out).toContain('<span>B</span>')
    expect(out).not.toContain('font-weight')
    expect(out).not.toContain('javascript')
  })

  it('converte div para quebra de linha sem gerar duplicação excessiva', () => {
    const html = '<div>linha 1</div><div>linha 2</div>'

    const out = sanitizeHtml(html)

    expect(out).toBe('linha 1<br/>linha 2<br/>')
  })
})

describe('stripHtml', () => {
  it('remove tags e retorna apenas texto', () => {
    const out = stripHtml('<p><b>Ação</b> <i>pendente</i></p>')
    expect(out).toBe('Ação pendente')
  })
})
