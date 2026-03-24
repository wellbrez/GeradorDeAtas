import { describe, expect, it } from 'vitest'
import { sanitizeHtml, stripHtml } from './htmlSanitize'

describe('sanitizeHtml', () => {
  it('keeps allowed inline formatting and converts font color to span style', () => {
    const input = '<b>Negrito</b> <font color="#007E7A">Vale</font>'
    const output = sanitizeHtml(input)

    expect(output).toContain('<b>Negrito</b>')
    expect(output).toContain('<span style="color: #007E7A">Vale</span>')
  })

  it('removes disallowed tags but preserves text and line breaks from block wrappers', () => {
    const input = '<div>linha 1</div><script>alert("x")</script><div>linha 2</div>'
    const output = sanitizeHtml(input)

    expect(output).toBe('linha 1<br/>alert("x")<br/>linha 2<br/>')
  })

  it('accepts safe image data URLs and sanitizes alt attribute', () => {
    const dataUrl = 'data:image/png;base64,QUJDRA=='
    const input = `<img src="${dataUrl}" alt="a\"b\nc" />`

    expect(sanitizeHtml(input)).toBe(`<img src="${dataUrl}" alt="a b c" />`)
  })

  it('removes image tags with unsafe source or oversized data URL', () => {
    const unsafeInput = '<img src="javascript:alert(1)" alt="x" />'
    const oversizedSrc = 'data:image/png;base64,' + 'A'.repeat(80_001)
    const oversizedInput = `<img src="${oversizedSrc}" />`

    expect(sanitizeHtml(unsafeInput)).toBe('')
    expect(sanitizeHtml(oversizedInput)).toBe('')
  })

  it('preserves only safe color style properties on span', () => {
    const input =
      '<span style="color: #007E7A; background-color: rgb(1, 2, 3); position: fixed">texto</span>'
    const output = sanitizeHtml(input)

    expect(output).toBe('<span style="color: #007E7A; background-color: rgb(1, 2, 3)">texto</span>')
  })
})

describe('stripHtml', () => {
  it('returns plain text content', () => {
    expect(stripHtml('<p>Olá <b>mundo</b></p>')).toBe('Olá mundo')
  })
})
