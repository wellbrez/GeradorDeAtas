import { describe, expect, it } from 'vitest'

import { sanitizeHtml, stripHtml } from '@/utils/htmlSanitize'

describe('sanitizeHtml', () => {
  it('allows safe data-image and removes dangerous attributes', () => {
    const html =
      '<p>Conteudo</p><img src="data:image/png;base64,QUJD" alt="imagem\nlinha" onerror="alert(1)" />'

    const sanitized = sanitizeHtml(html)

    expect(sanitized).toContain('<p>Conteudo</p>')
    expect(sanitized).toContain('<img src="data:image/png;base64,QUJD"')
    expect(sanitized).toContain('alt="imagem linha"')
    expect(sanitized).not.toContain('onerror')
  })

  it('blocks non data-image src URLs', () => {
    const html = '<img src="javascript:alert(1)" alt="malicioso" />'

    const sanitized = sanitizeHtml(html)

    expect(sanitized).toBe('')
  })

  it('blocks oversized data-image payloads', () => {
    const bigPayload = 'A'.repeat(80_001)
    const html = `<img src="data:image/png;base64,${bigPayload}" alt="grande" />`

    const sanitized = sanitizeHtml(html)

    expect(sanitized).toBe('')
  })

  it('keeps only safe color styles in span', () => {
    const html =
      '<span style="color: #fff; background-color: rgb(0,0,0); font-size: 20px">texto</span>'

    const sanitized = sanitizeHtml(html)

    expect(sanitized).toContain('style="color: #fff; background-color: rgb(0,0,0)"')
    expect(sanitized).not.toContain('font-size')
  })

  it('drops unsafe style values from span', () => {
    const html = '<span style="color: red; background: url(javascript:alert(1))">texto</span>'

    const sanitized = sanitizeHtml(html)

    expect(sanitized).toBe('<span>texto</span>')
  })

  it('preserves line breaks from unsupported block tags', () => {
    const html = '<div>linha 1</div><div>linha 2</div>'

    const sanitized = sanitizeHtml(html)

    expect(sanitized).toBe('linha 1<br/>linha 2<br/>')
  })
})

describe('stripHtml', () => {
  it('removes tags and keeps text content', () => {
    const html = '<p>Item <strong>importante</strong></p>'

    expect(stripHtml(html)).toBe('Item importante')
  })
})
