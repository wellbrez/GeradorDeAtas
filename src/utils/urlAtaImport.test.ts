import LZString from 'lz-string'
import { afterEach, describe, expect, it } from 'vitest'
import type { MeetingMinutesStorage } from '@/types'
import { encodeAtaToHash, parseAtaFromHash } from './urlAtaImport'

const baseAta: MeetingMinutesStorage = {
  cabecalho: {
    numero: '123',
    data: '2026-03-11',
    tipo: 'Ordinaria',
    titulo: 'Sprint Review',
    responsavel: 'Maria',
    projeto: 'Projeto X',
  },
  attendance: [
    {
      nome: 'Maria',
      email: 'maria@empresa.com',
      empresa: 'Empresa',
      telefone: '11999999999',
      presenca: 'P',
    },
  ],
  itens: [
    {
      id: 'item-1',
      item: '1',
      nivel: 1,
      pai: null,
      filhos: [],
      criadoEm: '2026-03-11T10:00:00.000Z',
      historico: [
        {
          id: 'hist-1',
          criadoEm: '2026-03-11T10:00:00.000Z',
          descricao: 'Atualizacao',
          responsavel: { nome: 'Maria', email: 'maria@empresa.com' },
          data: '2026-03-12',
          status: 'Pendente',
        },
      ],
      UltimoHistorico: {
        id: 'hist-1',
        criadoEm: '2026-03-11T10:00:00.000Z',
        descricao: 'Atualizacao',
        responsavel: { nome: 'Maria', email: 'maria@empresa.com' },
        data: '2026-03-12',
        status: 'Pendente',
      },
    },
  ],
}

afterEach(() => {
  window.location.hash = ''
})

describe('parseAtaFromHash', () => {
  it('faz roundtrip do formato comprimido atual', () => {
    window.location.hash = `#${encodeAtaToHash(baseAta)}`

    expect(parseAtaFromHash()).toEqual(baseAta)
  })

  it('suporta formato minimo legado com prefixo m', () => {
    const minimalPayload = {
      c: baseAta.cabecalho,
      a: baseAta.attendance,
      i: [
        {
          id: baseAta.itens[0].id,
          item: baseAta.itens[0].item,
          nivel: baseAta.itens[0].nivel,
          pai: baseAta.itens[0].pai,
          filhos: baseAta.itens[0].filhos,
          criadoEm: baseAta.itens[0].criadoEm,
          u: baseAta.itens[0].UltimoHistorico,
        },
      ],
    }
    window.location.hash = `#m${LZString.compressToBase64(JSON.stringify(minimalPayload))}`

    expect(parseAtaFromHash()).toEqual(baseAta)
  })

  it('retorna null para hash inválido', () => {
    window.location.hash = '#z@@hash-invalido@@'

    expect(parseAtaFromHash()).toBeNull()
  })
})
