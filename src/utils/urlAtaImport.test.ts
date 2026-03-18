import LZString from 'lz-string'
import { afterEach, describe, expect, it } from 'vitest'

import type { MeetingMinutes, MeetingMinutesStorage } from '@/types'
import { encodeAtaToHash, parseAtaFromHash } from './urlAtaImport'

function utf8ToBase64(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

const storageFixture: MeetingMinutesStorage = {
  cabecalho: {
    numero: '001',
    data: '2026-03-18',
    tipo: 'Ordinária',
    titulo: 'Ata de validação',
    responsavel: 'Equipe QA',
    projeto: 'Projeto A',
    contrato: 'CTR-123',
  },
  attendance: [
    {
      nome: 'Maria QA',
      email: 'maria@example.com',
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
      criadoEm: '2026-03-18T10:00:00.000Z',
      historico: [
        {
          id: 'hist-1',
          criadoEm: '2026-03-18T10:00:00.000Z',
          descricao: 'Descrição inicial',
          responsavel: { nome: 'Maria QA', email: 'maria@example.com' },
          data: '2026-03-25',
          status: 'Pendente',
        },
      ],
      UltimoHistorico: {
        id: 'hist-1',
        criadoEm: '2026-03-18T10:00:00.000Z',
        descricao: 'Descrição inicial',
        responsavel: { nome: 'Maria QA', email: 'maria@example.com' },
        data: '2026-03-25',
        status: 'Pendente',
      },
    },
  ],
}

afterEach(() => {
  window.location.hash = ''
})

describe('urlAtaImport', () => {
  it('returns null when hash is empty', () => {
    window.location.hash = ''
    expect(parseAtaFromHash()).toBeNull()
  })

  it('parses compressed hashes produced by encodeAtaToHash', () => {
    const fullAta: MeetingMinutes = {
      id: 'ata-123',
      ...storageFixture,
      createdAt: '2026-03-18T10:00:00.000Z',
      updatedAt: '2026-03-18T10:00:00.000Z',
    }

    window.location.hash = `#${encodeAtaToHash(fullAta)}`

    expect(parseAtaFromHash()).toEqual(storageFixture)
  })

  it('parses legacy plain base64 hashes', () => {
    const payload = utf8ToBase64(JSON.stringify(storageFixture))
    window.location.hash = `#${payload}`

    expect(parseAtaFromHash()).toEqual(storageFixture)
  })

  it('returns null for invalid data structures even when payload is decodable', () => {
    const invalidPayload = utf8ToBase64(
      JSON.stringify({
        cabecalho: storageFixture.cabecalho,
        attendance: storageFixture.attendance,
        itens: 'invalid',
      })
    )
    window.location.hash = `#${invalidPayload}`

    expect(parseAtaFromHash()).toBeNull()
  })

  it('expands minimal hashes and fills safe defaults', () => {
    const minimalPayload = {
      c: storageFixture.cabecalho,
      a: storageFixture.attendance,
      i: [
        {
          id: 'item-min-1',
          item: '1',
          nivel: 1,
          criadoEm: '2026-03-18T10:00:00.000Z',
        },
      ],
    }
    const encodedMinimal = LZString.compressToBase64(JSON.stringify(minimalPayload))
    window.location.hash = `#m${encodedMinimal}`

    const parsed = parseAtaFromHash()

    expect(parsed).not.toBeNull()
    expect(parsed?.itens).toHaveLength(1)
    expect(parsed?.itens[0]?.pai).toBeNull()
    expect(parsed?.itens[0]?.filhos).toEqual([])
    expect(parsed?.itens[0]?.historico).toHaveLength(1)
    expect(parsed?.itens[0]?.UltimoHistorico.status).toBe('Pendente')
    expect(parsed?.itens[0]?.UltimoHistorico.responsavel).toEqual({ nome: '', email: '' })
  })

  it('returns null for malformed compressed hash payloads', () => {
    window.location.hash = '#z@@@'

    expect(parseAtaFromHash()).toBeNull()
  })
})
