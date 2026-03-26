import { describe, it, expect } from 'vitest'
import { sanitizeHtml, stripHtml } from './htmlSanitize'

describe('htmlSanitize', () => {
  it('remove a tag script, preservando apenas texto interno como conteúdo inerte', () => {
    const html = '<p>Texto <b>forte</b><script>alert(1)</script></p>'
    expect(sanitizeHtml(html)).toBe('<p>Texto <b>forte</b>alert(1)</p>')
  })

  it('preserva apenas propriedades de cor seguras no span', () => {
    const html = '<span style="color: #007e7a; position: absolute; background: rgb(0,0,0)">x</span>'
    expect(sanitizeHtml(html)).toBe('<span style="color: #007e7a; background: rgb(0,0,0)">x</span>')
  })

  it('aceita imagem data URL válida e remove atributos não permitidos', () => {
    const validImg = '<img src="data:image/png;base64,QUJDRA==" alt="linha 1&#10;linha 2&quot;" onclick="alert(1)" />'
    const sanitized = sanitizeHtml(validImg)
    const doc = new DOMParser().parseFromString(sanitized, 'text/html')
    const img = doc.querySelector('img')

    expect(img).not.toBeNull()
    expect(img?.getAttributeNames().sort()).toEqual(['alt', 'src'])
    expect(img?.getAttribute('src')).toBe('data:image/png;base64,QUJDRA==')
    expect(img?.getAttribute('alt')).toBe('linha 1 linha 2 ')
  })

  it('remove imagem com src inseguro ou payload muito grande', () => {
    const unsafe = '<img src="javascript:alert(1)" alt="x" />'
    const hugeBase64 = `data:image/png;base64,${'A'.repeat(80_001)}`
    const huge = `<img src="${hugeBase64}" alt="x" />`
    expect(sanitizeHtml(unsafe)).toBe('')
    expect(sanitizeHtml(huge)).toBe('')
  })

  it('stripHtml remove tags e mantém texto pesquisável', () => {
    expect(stripHtml('<p>Olá <b>Mundo</b></p>')).toBe('Olá Mundo')
  })
})
