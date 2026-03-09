import LZString from 'lz-string'
import { afterEach, describe, expect, it } from 'vitest'
import type { MeetingMinutesStorage } from '@/types'
import { encodeAtaToHash, parseAtaFromHash } from './urlAtaImport'

const BASE_STORAGE: MeetingMinutesStorage = {
  cabecalho: {
    numero: 'ATA-001',
    data: '2026-03-05',
    tipo: 'Ordinaria',
    titulo: 'Planejamento',
    responsavel: 'Time',
    projeto: 'Projeto X',
  },
  attendance: [],
  itens: [
    {
      id: 'i1',
      item: '1',
      nivel: 1,
      pai: null,
      filhos: [],
      criadoEm: '2026-03-05T12:00:00.000Z',
      historico: [
        {
          id: 'h1',
          criadoEm: '2026-03-05T12:00:00.000Z',
          descricao: 'Descricao',
          responsavel: { nome: 'Ana', email: 'ana@vale.com' },
          data: '2026-03-06',
          status: 'Pendente',
        },
      ],
      UltimoHistorico: {
        id: 'h1',
        criadoEm: '2026-03-05T12:00:00.000Z',
        descricao: 'Descricao',
        responsavel: { nome: 'Ana', email: 'ana@vale.com' },
        data: '2026-03-06',
        status: 'Pendente',
      },
    },
  ],
}

function utf8ToBase64(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  bytes.forEach((b) => { binary += String.fromCharCode(b) })
  return btoa(binary)
}

afterEach(() => {
  window.location.hash = ''
})

describe('urlAtaImport', () => {
  it('faz round-trip de encode compressed + parse', () => {
    window.location.hash = '#' + encodeAtaToHash(BASE_STORAGE)
    expect(parseAtaFromHash()).toEqual(BASE_STORAGE)
  })

  it('aceita formato legado em base64 puro', () => {
    const legacyHash = utf8ToBase64(JSON.stringify(BASE_STORAGE))
    window.location.hash = '#' + legacyHash
    expect(parseAtaFromHash()).toEqual(BASE_STORAGE)
  })

  it('expande formato minimo com prefixo m', () => {
    const minimal = {
      c: BASE_STORAGE.cabecalho,
      a: BASE_STORAGE.attendance,
      i: [
        {
          id: 'i1',
          item: '1',
          nivel: 1,
          pai: null,
          filhos: [],
          criadoEm: '2026-03-05T12:00:00.000Z',
          u: BASE_STORAGE.itens[0].UltimoHistorico,
        },
      ],
    }
    window.location.hash = '#m' + LZString.compressToBase64(JSON.stringify(minimal))
    const parsed = parseAtaFromHash()
    expect(parsed).not.toBeNull()
    expect(parsed?.itens[0]?.UltimoHistorico).toEqual(BASE_STORAGE.itens[0].UltimoHistorico)
    expect(parsed?.itens[0]?.historico).toEqual([BASE_STORAGE.itens[0].UltimoHistorico])
  })

  it('retorna null para hash invalido', () => {
    window.location.hash = '#conteudo-invalido'
    expect(parseAtaFromHash()).toBeNull()
  })
})
