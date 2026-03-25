import { beforeEach, describe, expect, it } from 'vitest'
import LZString from 'lz-string'
import { encodeAtaToHash, parseAtaFromHash } from './urlAtaImport'
import type { MeetingMinutesStorage } from '@/types'

function buildStorage(): MeetingMinutesStorage {
  return {
    cabecalho: {
      numero: 'ATA-001',
      data: '2026-03-25',
      tipo: 'Ordinaria',
      titulo: 'Reuniao de status',
      responsavel: 'Maria',
      projeto: 'Projeto X',
      contrato: 'CTR-9',
    },
    attendance: [
      {
        nome: 'Joao',
        email: 'joao@empresa.com',
        empresa: 'Vale',
        telefone: '9999',
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
        criadoEm: '2026-03-25T10:00:00.000Z',
        historico: [
          {
            id: 'h-1',
            criadoEm: '2026-03-25T10:00:00.000Z',
            descricao: 'Atualizar cronograma',
            responsavel: { nome: 'Joao', email: 'joao@empresa.com' },
            data: '2026-03-26',
            status: 'Pendente',
          },
        ],
        UltimoHistorico: {
          id: 'h-1',
          criadoEm: '2026-03-25T10:00:00.000Z',
          descricao: 'Atualizar cronograma',
          responsavel: { nome: 'Joao', email: 'joao@empresa.com' },
          data: '2026-03-26',
          status: 'Pendente',
        },
      },
    ],
  }
}

function setHash(hash: string): void {
  window.location.hash = hash
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
    setHash('')
  })

  it('retorna null para hash vazio ou inválido', () => {
    setHash('')
    expect(parseAtaFromHash()).toBeNull()

    setHash('#')
    expect(parseAtaFromHash()).toBeNull()

    setHash('#not-base64')
    expect(parseAtaFromHash()).toBeNull()
  })

  it('faz round-trip encode/decode no formato comprimido padrão', () => {
    const storage = buildStorage()
    const hash = encodeAtaToHash(storage)
    setHash(`#${hash}`)

    const parsed = parseAtaFromHash()
    expect(parsed).toEqual(storage)
  })

  it('faz parse do formato legado em base64 UTF-8', () => {
    const storage = buildStorage()
    const encoded = toBase64Utf8(JSON.stringify(storage))
    setHash(`#${encoded}`)

    const parsed = parseAtaFromHash()
    expect(parsed).toEqual(storage)
  })

  it('expande formato mínimo (prefixo m) para MeetingMinutesStorage válido', () => {
    const minimal = {
      c: buildStorage().cabecalho,
      a: buildStorage().attendance,
      i: [
        {
          id: 'i-1',
          item: '1',
          nivel: 1,
          pai: null,
          filhos: [],
          criadoEm: '2026-03-25T10:00:00.000Z',
          u: {
            id: 'h-9',
            criadoEm: '2026-03-25T10:00:00.000Z',
            descricao: 'Descricao minima',
            responsavel: { nome: 'Ana', email: 'ana@empresa.com' },
            data: null,
            status: 'Info',
          },
        },
      ],
    }
    const compressed = LZString.compressToBase64(JSON.stringify(minimal))
    setHash(`#m${compressed}`)

    const parsed = parseAtaFromHash()
    expect(parsed).not.toBeNull()
    expect(parsed?.cabecalho.titulo).toBe('Reuniao de status')
    expect(parsed?.itens[0]?.historico).toHaveLength(1)
    expect(parsed?.itens[0]?.UltimoHistorico.status).toBe('Info')
  })

  it('retorna null quando estrutura decodificada não atende formato mínimo', () => {
    const compressed = LZString.compressToBase64(JSON.stringify({ foo: 'bar' }))
    setHash(`#z${compressed}`)
    expect(parseAtaFromHash()).toBeNull()
  })
})
