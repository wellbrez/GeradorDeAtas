import { describe, it, expect, beforeEach } from 'vitest'
import LZString from 'lz-string'
import type { MeetingMinutesStorage } from '@/types'
import { encodeAtaToHash, parseAtaFromHash } from './urlAtaImport'

function encodeUtf8ToBase64(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

function createStorageFixture(): MeetingMinutesStorage {
  const historico = {
    id: 'hist-1',
    criadoEm: '2026-03-20T10:00:00.000Z',
    descricao: 'Ação inicial',
    responsavel: { nome: 'Ana', email: 'ana@empresa.com' },
    data: '2026-03-25',
    status: 'Pendente' as const,
  }
  return {
    cabecalho: {
      numero: 'ATA-1',
      data: '2026-03-20',
      tipo: 'Ordinária',
      titulo: 'Reunião de acompanhamento',
      responsavel: 'Ana',
      projeto: 'Projeto A',
      contrato: 'C-001',
    },
    attendance: [
      {
        nome: 'Ana',
        email: 'ana@empresa.com',
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
        criadoEm: '2026-03-20T10:00:00.000Z',
        historico: [historico],
        UltimoHistorico: historico,
      },
    ],
  }
}

describe('urlAtaImport', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/')
  })

  it('faz roundtrip no formato comprimido usando encodeAtaToHash', () => {
    const storage = createStorageFixture()
    window.location.hash = `#${encodeAtaToHash(storage)}`

    expect(parseAtaFromHash()).toEqual(storage)
  })

  it('aceita payload legado em base64 UTF-8 sem prefixo', () => {
    const storage = createStorageFixture()
    const json = JSON.stringify(storage)
    window.location.hash = `#${encodeUtf8ToBase64(json)}`

    expect(parseAtaFromHash()).toEqual(storage)
  })

  it('expande payload mínimo com prefixo m e cria fallback seguro de histórico', () => {
    const storage = createStorageFixture()
    const minimal = {
      c: storage.cabecalho,
      a: storage.attendance,
      i: [
        {
          id: 'item-with-ultimo',
          item: '1',
          nivel: 1,
          pai: null,
          filhos: [],
          criadoEm: '2026-03-20T10:00:00.000Z',
          u: storage.itens[0]?.UltimoHistorico,
        },
        {
          id: 'item-without-ultimo',
          item: '2',
          nivel: 1,
          pai: null,
          filhos: [],
          criadoEm: '2026-03-20T10:00:00.000Z',
        },
      ],
    }
    const compressed = LZString.compressToBase64(JSON.stringify(minimal))
    window.location.hash = `#m${compressed}`

    const parsed = parseAtaFromHash()
    expect(parsed).not.toBeNull()
    expect(parsed?.itens).toHaveLength(2)
    expect(parsed?.itens[0]?.historico).toHaveLength(1)
    expect(parsed?.itens[1]?.historico).toHaveLength(1)
    expect(parsed?.itens[1]?.UltimoHistorico.status).toBe('Pendente')
    expect(parsed?.itens[1]?.UltimoHistorico.descricao).toBe('')
  })

  it('retorna null para hash inválido ou estrutura fora do contrato', () => {
    window.location.hash = '#not-base64'
    expect(parseAtaFromHash()).toBeNull()

    const invalidPayload = encodeUtf8ToBase64(JSON.stringify({ foo: 'bar' }))
    window.location.hash = `#${invalidPayload}`
    expect(parseAtaFromHash()).toBeNull()
  })
})
