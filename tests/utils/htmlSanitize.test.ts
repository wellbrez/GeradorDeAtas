import { sanitizeHtml, stripHtml } from '@/utils/htmlSanitize'

describe('sanitizeHtml', () => {
  it('preserva tags permitidas e filtra estilos fora da whitelist', () => {
    const input = '<p>Texto <span style="color: red; position: absolute;">importante</span></p>'
    const output = sanitizeHtml(input)

    expect(output).toBe('<p>Texto <span style="color: red">importante</span></p>')
  })

  it('mantem quebra de linha sem perder conteudo ao normalizar divs do rich text', () => {
    const input = '<div>Linha 1</div><div>Linha 2</div>'
    const output = sanitizeHtml(input)

    expect(output).toContain('Linha 1')
    expect(output).toContain('Linha 2')
    expect(output).toContain('<br/>')
    expect(output).not.toContain('<div>')
  })

  it('converte font color para span e ignora valores inseguros', () => {
    const input = '<font color="#00ff00">OK</font><font color="javascript:alert(1)">NO</font>'
    const output = sanitizeHtml(input)

    expect(output).toBe('<span style="color: #00ff00">OK</span><span>NO</span>')
  })
})

describe('stripHtml', () => {
  it('remove tags e retorna somente texto para busca', () => {
    const input = '<p>Acao <b>urgente</b> para o item</p>'
    expect(stripHtml(input)).toBe('Acao urgente para o item')
  })

  it('retorna string vazia para entrada invalida', () => {
    expect(stripHtml('')).toBe('')
  })
})
