import { describe, expect, it } from 'vitest'
import LZString from 'lz-string'
import type { MeetingMinutesStorage } from '@/types'
import { encodeAtaToHash, parseAtaFromHash } from './urlAtaImport'

function utf8ToBase64(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

function createStorageFixture(): MeetingMinutesStorage {
  return {
    cabecalho: {
      numero: 'ATA-001',
      data: '2026-04-07',
      tipo: 'Semanal',
      titulo: 'Reunião de acompanhamento',
      responsavel: 'João',
      projeto: 'Projeto A',
      contrato: 'CT-99',
    },
    attendance: [
      {
        nome: 'Maria',
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
        criadoEm: '2026-04-07T10:00:00.000Z',
        historico: [
          {
            id: 'hist-1',
            criadoEm: '2026-04-07T10:01:00.000Z',
            descricao: 'Definir próximos passos',
            responsavel: { nome: 'Maria', email: 'maria@empresa.com' },
            data: '2026-04-10',
            status: 'Pendente',
          },
        ],
        UltimoHistorico: {
          id: 'hist-1',
          criadoEm: '2026-04-07T10:01:00.000Z',
          descricao: 'Definir próximos passos',
          responsavel: { nome: 'Maria', email: 'maria@empresa.com' },
          data: '2026-04-10',
          status: 'Pendente',
        },
      },
    ],
  }
}

describe('urlAtaImport', () => {
  it('decodes compressed hash created by encodeAtaToHash', () => {
    const storage = createStorageFixture()
    window.location.hash = '#' + encodeAtaToHash(storage)

    const parsed = parseAtaFromHash()

    expect(parsed).toEqual(storage)
  })

  it('decodes legacy base64 hash with whitespace around payload', () => {
    const storage = createStorageFixture()
    const base64 = utf8ToBase64(JSON.stringify(storage))
    const withWhitespace = `${base64.slice(0, 10)} \n ${base64.slice(10)}`
    window.location.hash = '#' + withWhitespace

    const parsed = parseAtaFromHash()

    expect(parsed).toEqual(storage)
  })

  it('decodes minimal compressed format and expands historico defaults', () => {
    const minimalJson = JSON.stringify({
      c: {
        numero: 'ATA-QR',
        data: '2026-04-07',
        tipo: 'Extraordinária',
        titulo: 'Ata via QR',
        responsavel: 'Ana',
        projeto: 'Projeto QR',
      },
      a: [],
      i: [
        {
          id: 'item-min',
          item: '1',
          nivel: 1,
          criadoEm: '2026-04-07T00:00:00.000Z',
        },
      ],
    })
    window.location.hash = '#m' + LZString.compressToBase64(minimalJson)

    const parsed = parseAtaFromHash()

    expect(parsed).not.toBeNull()
    expect(parsed?.itens).toHaveLength(1)
    expect(parsed?.itens[0]?.pai).toBeNull()
    expect(parsed?.itens[0]?.filhos).toEqual([])
    expect(parsed?.itens[0]?.historico).toHaveLength(1)
    expect(parsed?.itens[0]?.UltimoHistorico.status).toBe('Pendente')
  })

  it('returns null for malformed payload or invalid structure', () => {
    window.location.hash = '#znot-valid-compressed-data'
    expect(parseAtaFromHash()).toBeNull()

    const invalid = utf8ToBase64(JSON.stringify({ foo: 'bar' }))
    window.location.hash = '#' + invalid
    expect(parseAtaFromHash()).toBeNull()
  })
})
