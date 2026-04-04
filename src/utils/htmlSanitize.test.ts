import { describe, expect, it } from 'vitest'
import { sanitizeHtml, stripHtml } from './htmlSanitize'

/**
 * Gera data URL de imagem base64 com payload fixo.
 */
function buildImageDataUrl(charCount: number): string {
  return `data:image/png;base64,${'A'.repeat(charCount)}`
}

describe('htmlSanitize', () => {
  it('mantém apenas propriedades seguras de style em span', () => {
    const input =
      '<span style="color: #007E7A; position: fixed; background-color: rgb(1,2,3);">Texto</span>'

    const sanitized = sanitizeHtml(input)

    expect(sanitized).toBe('<span style="color: #007E7A; background-color: rgb(1,2,3)">Texto</span>')
  })

  it('remove style com conteúdo perigoso', () => {
    const input = '<span style="color: red; background: javascript:alert(1)">Risco</span>'

    const sanitized = sanitizeHtml(input)

    expect(sanitized).toBe('<span>Risco</span>')
  })

  it('permite imagem data URL válida dentro do limite', () => {
    const src = buildImageDataUrl(100)
    const input = `<img src="${src}" alt="imagem segura">`

    const sanitized = sanitizeHtml(input)

    expect(sanitized).toBe(`<img src="${src}" alt="imagem segura" />`)
  })

  it('bloqueia imagem data URL acima do limite', () => {
    const src = buildImageDataUrl(80_001)
    const input = `<img src="${src}" alt="muito grande">`

    const sanitized = sanitizeHtml(input)

    expect(sanitized).toBe('')
  })

  it('converte tags de bloco não permitidas em quebra de linha preservando conteúdo', () => {
    const input = '<div>Linha 1</div><div>Linha 2</div>'

    const sanitized = sanitizeHtml(input)

    expect(sanitized).toBe('Linha 1<br/>Linha 2<br/>')
  })

  it('remove tags mantendo conteúdo textual em stripHtml', () => {
    const input = '<p>Texto <b>com</b> <i>tags</i></p>'

    const result = stripHtml(input)

    expect(result).toBe('Texto com tags')
  })
})
