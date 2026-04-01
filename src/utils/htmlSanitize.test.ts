import { describe, expect, it } from 'vitest'
import { sanitizeHtml, stripHtml } from './htmlSanitize'

describe('sanitizeHtml', () => {
  it('preserva tags permitidas e remove elemento script', () => {
    const input = '<p>Texto <b>forte</b><script>alert(1)</script></p>'
    const out = sanitizeHtml(input)

    expect(out).toContain('<p>')
    expect(out).toContain('<b>forte</b>')
    expect(out).not.toContain('<script>')
  })

  it('converte div em quebras de linha para preservar visual', () => {
    const out = sanitizeHtml('<div>Linha 1</div><div>Linha 2</div>')
    expect(out).toContain('Linha 1')
    expect(out).toContain('Linha 2')
    expect(out).toContain('<br/>')
  })

  it('permite imagem data url válida e remove imagem inválida', () => {
    const validDataUrl = 'data:image/png;base64,aGVsbG8='
    const outValid = sanitizeHtml(`<img src="${validDataUrl}" alt="Imagem teste" />`)
    expect(outValid).toContain(`<img src="${validDataUrl}"`)
    expect(outValid).toContain('alt="Imagem teste"')

    const outInvalid = sanitizeHtml('<img src="https://evil.com/a.png" alt="x" />')
    expect(outInvalid).toBe('')
  })

  it('mantém estilos de cor seguros em span e remove propriedades não permitidas', () => {
    const out = sanitizeHtml(
      '<span style="color: #007E7A; background-color: rgb(1,2,3); width:10px">X</span>'
    )
    expect(out).toContain('<span')
    expect(out).toContain('color: #007E7A')
    expect(out).toContain('background-color: rgb(1,2,3)')
    expect(out).not.toContain('width:')
  })

  it('remove style inteiro quando detectar conteúdo inseguro', () => {
    const out = sanitizeHtml('<span style="color: #007E7A; background:url(javascript:evil)">X</span>')
    expect(out).toBe('<span>X</span>')
  })

  it('converte font color para span style seguro', () => {
    const out = sanitizeHtml('<font color="#123456">abc</font>')
    expect(out).toBe('<span style="color: #123456">abc</span>')
  })
})

describe('stripHtml', () => {
  it('remove tags e retorna apenas texto', () => {
    const text = stripHtml('<p>Olá <b>mundo</b></p>')
    expect(text).toBe('Olá mundo')
  })
})
