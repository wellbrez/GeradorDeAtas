import { afterEach, describe, expect, it, vi } from 'vitest'
import LZString from 'lz-string'
import { encodeAtaToHash, parseAtaFromHash } from './urlAtaImport'
import type { MeetingMinutesStorage } from '@/types'

function createStorage(): MeetingMinutesStorage {
  return {
    cabecalho: {
      numero: 'ATA-123',
      data: '2026-03-29',
      tipo: 'Ordinaria',
      titulo: 'Reuniao de acompanhamento',
      responsavel: 'Lider',
      projeto: 'Projeto A',
      contrato: 'CTR-1',
    },
    attendance: [
      {
        nome: 'Participante',
        email: 'participante@vale.com',
        empresa: 'Vale',
        telefone: '1111-1111',
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
        criadoEm: '2026-03-29T10:00:00.000Z',
        historico: [
          {
            id: 'hist-1',
            criadoEm: '2026-03-29T10:00:00.000Z',
            descricao: 'Descricao',
            responsavel: { nome: 'Responsavel', email: 'resp@vale.com' },
            data: '2026-03-30',
            status: 'Pendente',
          },
        ],
        UltimoHistorico: {
          id: 'hist-1',
          criadoEm: '2026-03-29T10:00:00.000Z',
          descricao: 'Descricao',
          responsavel: { nome: 'Responsavel', email: 'resp@vale.com' },
          data: '2026-03-30',
          status: 'Pendente',
        },
      },
    ],
  }
}

function setHash(value: string): void {
  window.location.hash = value
}

describe('urlAtaImport', () => {
  afterEach(() => {
    setHash('')
    vi.restoreAllMocks()
  })

  it('parseia hash comprimido gerado pelo encodeAtaToHash', () => {
    const storage = createStorage()
    const hash = encodeAtaToHash(storage)
    setHash(`#${hash}`)

    const parsed = parseAtaFromHash()

    expect(parsed).toEqual(storage)
  })

  it('parseia hash no formato minimo (prefixo m) e expande historico', () => {
    const minimal = {
      c: {
        numero: 'ATA-MIN',
        data: '2026-03-29',
        tipo: 'Ordinaria',
        titulo: 'Minimal',
        responsavel: 'Lider',
        projeto: 'Projeto A',
      },
      a: [],
      i: [
        {
          id: 'item-min',
          item: '1',
          nivel: 1,
          pai: null,
          filhos: [],
          criadoEm: '2026-03-29T10:00:00.000Z',
        },
      ],
    }
    const payload = LZString.compressToBase64(JSON.stringify(minimal))
    setHash(`#m${payload}`)

    const parsed = parseAtaFromHash()

    expect(parsed).not.toBeNull()
    expect(parsed?.cabecalho.numero).toBe('ATA-MIN')
    expect(parsed?.itens[0]?.historico).toHaveLength(1)
    expect(parsed?.itens[0]?.UltimoHistorico.status).toBe('Pendente')
  })

  it('retorna null para hash inválido', () => {
    setHash('#nao-e-um-hash-valido')

    expect(parseAtaFromHash()).toBeNull()
  })
})
