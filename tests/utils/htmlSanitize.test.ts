import { describe, expect, it } from 'vitest'
import { sanitizeHtml, stripHtml } from '@/utils/htmlSanitize'

describe('sanitizeHtml', () => {
  it('preserva imagens data URL seguras e limpa alt', () => {
    const src = 'data:image/png;base64,QUJDRA=='
    const html = `<p>Foto</p><img src="${src}" alt="linha\n2" />`

    const sanitized = sanitizeHtml(html)

    expect(sanitized).toBe(`<p>Foto</p><img src="${src}" alt="linha 2" />`)
  })

  it('remove imagens com src externo', () => {
    const html = '<img src="https://example.com/unsafe.png" alt="unsafe" />'

    expect(sanitizeHtml(html)).toBe('')
  })

  it('remove imagens data URL acima do limite permitido', () => {
    const src = 'data:image/png;base64,' + 'a'.repeat(80_001)
    const html = `<img src="${src}" alt="big" />`

    expect(sanitizeHtml(html)).toBe('')
  })

  it('converte tags de bloco não permitidas em quebras de linha', () => {
    const html = '<div>Linha A</div><div>Linha B</div>'

    expect(sanitizeHtml(html)).toBe('Linha A<br/>Linha B<br/>')
  })
})

describe('stripHtml', () => {
  it('remove tags mantendo apenas texto', () => {
    expect(stripHtml('<p>Olá <b>time</b></p>')).toBe('Olá time')
  })
})
