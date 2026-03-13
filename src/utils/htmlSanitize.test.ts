import { describe, expect, it } from 'vitest'
import { sanitizeHtml, stripHtml } from './htmlSanitize'

describe('sanitizeHtml', () => {
  it('preserva quebras de linha ao converter div para br', () => {
    const input = '<div>Primeira linha</div><div>Segunda linha</div>'

    const output = sanitizeHtml(input)

    expect(output).toBe('Primeira linha<br/>Segunda linha<br/>')
  })

  it('mantem apenas estilos de cor permitidos em span', () => {
    const input = '<span style="color: #fff; font-weight: bold; background-color: rgb(0,0,0)">Texto</span>'

    const output = sanitizeHtml(input)

    expect(output).toBe('<span style="color: #fff; background-color: rgb(0,0,0)">Texto</span>')
  })

  it('remove style com conteudo inseguro', () => {
    const input = '<span style="color: red; background-image: url(javascript:alert(1))">Texto</span>'

    const output = sanitizeHtml(input)

    expect(output).toBe('<span>Texto</span>')
  })

  it('converte font color seguro para span com style', () => {
    const input = '<font color="#00ff00">Ok</font>'

    const output = sanitizeHtml(input)

    expect(output).toBe('<span style="color: #00ff00">Ok</span>')
  })
})

describe('stripHtml', () => {
  it('remove tags e retorna apenas texto', () => {
    const input = '<p>Texto <b>formatado</b></p>'

    const output = stripHtml(input)

    expect(output).toBe('Texto formatado')
  })
})
