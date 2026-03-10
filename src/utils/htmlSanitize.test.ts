import { describe, expect, it } from 'vitest'
import { sanitizeHtml, stripHtml } from './htmlSanitize'

describe('htmlSanitize', () => {
  it('converte blocos div em quebras de linha preservando conteúdo', () => {
    const input = '<div>Primeira linha</div><div>Segunda linha</div>'

    expect(sanitizeHtml(input)).toBe('Primeira linha<br/>Segunda linha<br/>')
  })

  it('preserva apenas estilos de cor seguros em span', () => {
    const input = '<span style="color: red; background-color:#fff; font-weight:700;">Texto</span>'

    expect(sanitizeHtml(input)).toBe('<span style="color: red; background-color: #fff">Texto</span>')
  })

  it('remove estilos perigosos com url/script em span', () => {
    const input = '<span style="color: red; background: url(javascript:alert(1))">Texto</span>'

    expect(sanitizeHtml(input)).toBe('<span>Texto</span>')
  })

  it('converte font color para span com style de cor', () => {
    const input = '<font color="#00ff00">OK</font>'

    expect(sanitizeHtml(input)).toBe('<span style="color: #00ff00">OK</span>')
  })

  it('remove tags ao extrair texto para busca', () => {
    const input = '<p>Olá <b>mundo</b></p>'

    expect(stripHtml(input)).toBe('Olá mundo')
  })
})
