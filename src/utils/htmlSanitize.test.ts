import { describe, expect, it } from 'vitest'
import { sanitizeHtml, stripHtml } from './htmlSanitize'

describe('sanitizeHtml', () => {
  it('preserva quebra de linha ao receber blocos div do contentEditable', () => {
    const html = '<div>Primeira linha</div><div>Segunda linha</div>'

    expect(sanitizeHtml(html)).toBe('Primeira linha<br/>Segunda linha<br/>')
  })

  it('mantém apenas estilos de cor seguros em span', () => {
    const html =
      '<span style="color: red; background-color: #fff; position: absolute">A</span>' +
      '<span style="background: url(javascript:alert(1)); color: blue">B</span>'

    expect(sanitizeHtml(html)).toBe('<span style="color: red; background-color: #fff">A</span><span>B</span>')
  })

  it('converte font para span e remove cor insegura', () => {
    const html = '<font color="blue">Seguro</font><font color="javascript:alert(1)">Inseguro</font>'

    expect(sanitizeHtml(html)).toBe('<span style="color: blue">Seguro</span><span>Inseguro</span>')
  })
})

describe('stripHtml', () => {
  it('remove tags e mantém o texto útil para busca', () => {
    const html = '<p>texto <b>rico</b></p>'

    expect(stripHtml(html)).toBe('texto rico')
  })

  it('retorna vazio para entrada vazia', () => {
    expect(stripHtml('')).toBe('')
  })
})
