import LZString from 'lz-string'
import type { MeetingMinutesStorage } from '@/types'
import { encodeAtaToHash, parseAtaFromHash } from '@/utils/urlAtaImport'

const SAMPLE_STORAGE: MeetingMinutesStorage = {
  cabecalho: {
    numero: 'ATA-123',
    data: '2026-03-10',
    tipo: 'Reuniao',
    titulo: 'Planejamento',
    responsavel: 'Maria',
    projeto: 'Projeto Acai',
  },
  attendance: [
    {
      nome: 'Maria Silva',
      email: 'maria@empresa.com',
      empresa: 'Vale',
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
      criadoEm: '2026-03-10T10:00:00.000Z',
      historico: [
        {
          id: 'hist-1',
          criadoEm: '2026-03-10T10:00:00.000Z',
          descricao: 'Definir responsavel',
          responsavel: { nome: 'Maria Silva', email: 'maria@empresa.com' },
          data: '2026-03-12',
          status: 'Em Andamento',
        },
      ],
      UltimoHistorico: {
        id: 'hist-1',
        criadoEm: '2026-03-10T10:00:00.000Z',
        descricao: 'Definir responsavel',
        responsavel: { nome: 'Maria Silva', email: 'maria@empresa.com' },
        data: '2026-03-12',
        status: 'Em Andamento',
      },
    },
  ],
}

function toBase64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary)
}

describe('urlAtaImport', () => {
  beforeEach(() => {
    window.location.hash = ''
  })

  it('faz roundtrip de hash comprimido (prefixo z)', () => {
    const encoded = encodeAtaToHash(SAMPLE_STORAGE)
    window.location.hash = `#${encoded}`

    expect(parseAtaFromHash()).toEqual(SAMPLE_STORAGE)
  })

  it('suporta links legados em base64 sem prefixo', () => {
    window.location.hash = `#${toBase64Utf8(JSON.stringify(SAMPLE_STORAGE))}`

    expect(parseAtaFromHash()).toEqual(SAMPLE_STORAGE)
  })

  it('expande o formato minimo (prefixo m) para historico completo', () => {
    const minimalPayload = {
      c: SAMPLE_STORAGE.cabecalho,
      a: SAMPLE_STORAGE.attendance,
      i: [
        {
          id: SAMPLE_STORAGE.itens[0].id,
          item: SAMPLE_STORAGE.itens[0].item,
          nivel: SAMPLE_STORAGE.itens[0].nivel,
          pai: SAMPLE_STORAGE.itens[0].pai,
          filhos: SAMPLE_STORAGE.itens[0].filhos,
          criadoEm: SAMPLE_STORAGE.itens[0].criadoEm,
          u: SAMPLE_STORAGE.itens[0].UltimoHistorico,
        },
      ],
    }
    const encoded = `m${LZString.compressToBase64(JSON.stringify(minimalPayload))}`
    window.location.hash = `#${encoded}`

    const parsed = parseAtaFromHash()

    expect(parsed?.itens[0].historico).toEqual([SAMPLE_STORAGE.itens[0].UltimoHistorico])
    expect(parsed?.itens[0].UltimoHistorico).toEqual(SAMPLE_STORAGE.itens[0].UltimoHistorico)
  })

  it('retorna null para hash invalido', () => {
    window.location.hash = '#conteudo-invalido'
    expect(parseAtaFromHash()).toBeNull()
  })
})
