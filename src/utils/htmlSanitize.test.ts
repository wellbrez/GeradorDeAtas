import { describe, expect, it } from 'vitest'
import { sanitizeHtml, stripHtml } from './htmlSanitize'

describe('htmlSanitize', () => {
  it('mantém tags permitidas e remove scripts', () => {
    const input = '<p>Texto <b>forte</b><script>alert(1)</script></p>'
    const output = sanitizeHtml(input)

    expect(output).toContain('<p>')
    expect(output).toContain('<b>forte</b>')
    expect(output).not.toContain('<script')
    expect(output).toContain('alert(1)')
  })

  it('aceita somente imagem data URL segura e normaliza alt', () => {
    const input =
      `<img src="data:image/png;base64,AAAA" alt='ok"\nnovo' /><img src="javascript:alert(1)" alt="x" />`
    const output = sanitizeHtml(input)

    expect(output).toContain('<img src="data:image/png;base64,AAAA" alt="ok  novo" />')
    expect(output).not.toContain('javascript:')
  })

  it('remove imagens com data URL acima do limite', () => {
    const bigPayload = 'A'.repeat(90_000)
    const output = sanitizeHtml(`<img src="data:image/png;base64,${bigPayload}" alt="x" />`)

    expect(output).toBe('')
  })

  it('converte div para quebra de linha para preservar visual', () => {
    const output = sanitizeHtml('<div>linha 1</div><div>linha 2</div>')
    expect(output).toContain('linha 1')
    expect(output).toContain('linha 2')
    expect(output).toContain('<br/>')
  })

  it('stripHtml remove tags e retorna apenas texto', () => {
    expect(stripHtml('<p>Um <b>texto</b></p>')).toBe('Um texto')
  })
})
