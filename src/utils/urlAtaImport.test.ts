import LZString from 'lz-string'
import { describe, expect, it, afterEach } from 'vitest'
import { encodeAtaToHash, parseAtaFromHash } from './urlAtaImport'
import type { MeetingMinutes, MeetingMinutesStorage } from '@/types'

function utf8ToBase64(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary)
}

function setHash(encoded: string): void {
  window.history.replaceState({}, '', encoded ? `/#${encoded}` : '/')
}

function getStorageFixture(): MeetingMinutesStorage {
  return {
    cabecalho: {
      numero: 'AT-001',
      data: '2026-03-27',
      tipo: 'Ordinária',
      titulo: 'Reunião Semanal',
      responsavel: 'Maria Silva',
      projeto: 'Projeto X',
      contrato: 'CTR-99',
    },
    attendance: [
      {
        nome: 'Maria Silva',
        email: 'maria@empresa.com',
        empresa: 'Empresa',
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
        criadoEm: '2026-03-27T10:00:00.000Z',
        historico: [
          {
            id: 'hist-1',
            criadoEm: '2026-03-27T10:00:00.000Z',
            descricao: 'Ação inicial',
            responsavel: { nome: 'Maria Silva', email: 'maria@empresa.com' },
            data: '2026-04-01',
            status: 'Pendente',
          },
        ],
        UltimoHistorico: {
          id: 'hist-1',
          criadoEm: '2026-03-27T10:00:00.000Z',
          descricao: 'Ação inicial',
          responsavel: { nome: 'Maria Silva', email: 'maria@empresa.com' },
          data: '2026-04-01',
          status: 'Pendente',
        },
      },
    ],
  }
}

afterEach(() => {
  setHash('')
})

describe('urlAtaImport', () => {
  it('parses legacy hash payload in plain base64', () => {
    const storage = getStorageFixture()
    const encoded = utf8ToBase64(JSON.stringify(storage))
    setHash(encoded)

    expect(parseAtaFromHash()).toEqual(storage)
  })

  it('parses compressed hash payload with z prefix', () => {
    const storage = getStorageFixture()
    const encoded = 'z' + LZString.compressToBase64(JSON.stringify(storage))
    setHash(encoded)

    expect(parseAtaFromHash()).toEqual(storage)
  })

  it('expands minimal payload with m prefix into full storage', () => {
    const storage = getStorageFixture()
    const minimal = {
      c: storage.cabecalho,
      a: storage.attendance,
      i: [
        {
          id: 'item-1',
          item: '1',
          nivel: 1,
          pai: null,
          filhos: [],
          criadoEm: '2026-03-27T10:00:00.000Z',
          u: {
            id: 'hist-1',
            criadoEm: '2026-03-27T10:00:00.000Z',
            descricao: 'Ação inicial',
            responsavel: { nome: 'Maria Silva', email: 'maria@empresa.com' },
            data: '2026-04-01',
            status: 'Pendente',
          },
        },
      ],
    }
    const encoded = 'm' + LZString.compressToBase64(JSON.stringify(minimal))
    setHash(encoded)

    expect(parseAtaFromHash()).toEqual(storage)
  })

  it('returns null for invalid payload structure', () => {
    const invalid = utf8ToBase64(JSON.stringify({ cabecalho: { numero: 'x' }, itens: [] }))
    setHash(invalid)

    expect(parseAtaFromHash()).toBeNull()
  })

  it('encodes storage into z-hash and supports parse roundtrip', () => {
    const storage = getStorageFixture()
    const ata: MeetingMinutes = {
      id: 'ata-1',
      ...storage,
      createdAt: '2026-03-27T10:00:00.000Z',
      updatedAt: '2026-03-27T10:00:00.000Z',
      arquivada: true,
    }

    const encoded = encodeAtaToHash(ata)
    expect(encoded.startsWith('z')).toBe(true)

    setHash(encoded)
    expect(parseAtaFromHash()).toEqual(storage)
  })
})
