import { describe, expect, it } from 'vitest'
import { sanitizeHtml, stripHtml } from './htmlSanitize'

describe('sanitizeHtml', () => {
  it('mantém imagem data URL válida e remove imagens/atributos inseguros', () => {
    const input =
      '<p>Descrição</p>' +
      '<img src="data:image/png;base64,QUJDRA==" alt="ok" onerror="alert(1)" />' +
      '<img src="https://example.com/externa.png" alt="externa" />'

    const output = sanitizeHtml(input)

    expect(output).toContain('<img src="data:image/png;base64,QUJDRA==" alt="ok" />')
    expect(output).not.toContain('onerror=')
    expect(output).not.toContain('https://example.com/externa.png')
  })

  it('remove data URL de imagem acima do limite permitido', () => {
    const hugeBase64 = 'a'.repeat(80_001)
    const input = `inicio<img src="data:image/png;base64,${hugeBase64}" alt="x" />fim`

    const output = sanitizeHtml(input)
    expect(output).toBe('iniciofim')
  })

  it('preserva apenas cores seguras em style e converte font para span', () => {
    const input =
      '<span style="color:#fff;background-color:rgb(0,0,0);width:200px">A</span>' +
      '<span style="background:url(javascript:alert(1))">B</span>' +
      '<font color="red">C</font>'

    const output = sanitizeHtml(input)

    expect(output).toContain('<span style="color: #fff; background-color: rgb(0,0,0)">A</span>')
    expect(output).toContain('<span>B</span>')
    expect(output).toContain('<span style="color: red">C</span>')
  })

  it('converte div em quebra de linha para preservar layout digitado', () => {
    const output = sanitizeHtml('<div>linha 1</div><div>linha 2</div>')
    expect(output).toBe('linha 1<br/>linha 2<br/>')
  })
})

describe('stripHtml', () => {
  it('remove tags e mantém somente o texto para busca', () => {
    const output = stripHtml('<b>Item 1</b><br/><span>Descrição</span>')
    expect(output).toBe('Item 1Descrição')
  })
})
