import { sanitizeHtml, stripHtml } from './htmlSanitize'

describe('htmlSanitize', () => {
  it('remove tags não permitidas e preserva quebra de linha para div', () => {
    const html = '<div>linha 1</div><script>alert(1)</script><b>ok</b>'
    const sanitized = sanitizeHtml(html)

    expect(sanitized).toContain('linha 1')
    expect(sanitized).toContain('<b>ok</b>')
    expect(sanitized).not.toContain('<script>')
    expect(sanitized).toContain('<br/>')
  })

  it('preserva apenas estilos seguros de cor em span', () => {
    const html = '<span style="color: #007e7a; background: rgb(255, 255, 0); width:100px;">texto</span>'
    const sanitized = sanitizeHtml(html)

    expect(sanitized).toBe('<span style="color: #007e7a; background: rgb(255, 255, 0)">texto</span>')
  })

  it('remove style com conteúdo perigoso', () => {
    const html = '<span style="color:red; background:url(javascript:alert(1));">x</span>'
    const sanitized = sanitizeHtml(html)

    expect(sanitized).toBe('<span>x</span>')
  })

  it('converte font color seguro para span com style', () => {
    const html = '<font color="#0ABB98">valor</font>'
    const sanitized = sanitizeHtml(html)

    expect(sanitized).toBe('<span style="color: #0ABB98">valor</span>')
  })

  it('mantém somente img com data URL válida e limpa alt', () => {
    const html =
      '<img src="data:image/png;base64,aGVsbG8=" alt="teste\"\\nquebra" onclick="hack()" />' +
      '<img src="https://example.com/teste.png" alt="externa" />'
    const sanitized = sanitizeHtml(html)

    expect(sanitized).toContain('<img src="data:image/png;base64,aGVsbG8=" alt="teste" />')
    expect(sanitized).not.toContain('https://example.com')
    expect(sanitized).not.toContain('onclick')
  })

  it('stripHtml remove tags e retorna somente texto', () => {
    const text = stripHtml('<p><b>Plano</b> de ação</p>')
    expect(text).toBe('Plano de ação')
  })
})
