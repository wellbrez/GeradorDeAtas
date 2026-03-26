import { describe, expect, it } from 'vitest'
import { sanitizeHtml, stripHtml } from './htmlSanitize'

describe('sanitizeHtml', () => {
  it('preserves line breaks from disallowed block tags', () => {
    const html = '<div>Primeira linha</div><div>Segunda linha</div>'

    expect(sanitizeHtml(html)).toBe('Primeira linha<br/>Segunda linha<br/>')
  })

  it('keeps only safe color styles in span tags', () => {
    const html = '<span style="color:#007E7A;position:absolute;background-color: rgb(10, 20, 30)">Texto</span>'

    expect(sanitizeHtml(html)).toBe('<span style="color: #007E7A; background-color: rgb(10, 20, 30)">Texto</span>')
  })

  it('removes span style when it contains url() payloads', () => {
    const html =
      '<span style="color:#007E7A;background-color: rgb(10, 20, 30);background-image:url(javascript:alert(1))">Texto</span>'

    expect(sanitizeHtml(html)).toBe('<span>Texto</span>')
  })

  it('converts font color into safe span style', () => {
    expect(sanitizeHtml('<font color="#EE6F16">Acao</font>')).toBe('<span style="color: #EE6F16">Acao</span>')
  })
})

describe('stripHtml', () => {
  it('returns plain text for rich text content', () => {
    expect(stripHtml('<p>Item <b>critico</b></p>')).toBe('Item critico')
  })
})
