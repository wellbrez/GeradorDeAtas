import LZString from 'lz-string'
import { beforeEach, describe, expect, it } from 'vitest'
import type { MeetingMinutes, MeetingMinutesStorage } from '@/types'
import { encodeAtaToHash, parseAtaFromHash } from './urlAtaImport'

const storageFixture: MeetingMinutesStorage = {
  cabecalho: {
    numero: 'ATA-001',
    data: '2026-03-10',
    tipo: 'Ordinária',
    titulo: 'Reunião Semanal',
    responsavel: 'Maria',
    projeto: 'Projeto Vale',
  },
  attendance: [
    {
      nome: 'Maria',
      email: 'maria@empresa.com',
      empresa: 'Vale',
      telefone: '21999999999',
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
      criadoEm: '2026-03-10T09:00:00.000Z',
      historico: [
        {
          id: 'hist-1',
          criadoEm: '2026-03-10T09:00:00.000Z',
          descricao: 'Ação principal',
          responsavel: { nome: 'Maria', email: 'maria@empresa.com' },
          data: '2026-03-15',
          status: 'Pendente',
        },
      ],
      UltimoHistorico: {
        id: 'hist-1',
        criadoEm: '2026-03-10T09:00:00.000Z',
        descricao: 'Ação principal',
        responsavel: { nome: 'Maria', email: 'maria@empresa.com' },
        data: '2026-03-15',
        status: 'Pendente',
      },
    },
  ],
}

function toLegacyBase64(value: string): string {
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

  it('faz roundtrip no formato comprimido padrão', () => {
    const fullAta: MeetingMinutes = {
      id: 'ata-1',
      createdAt: '2026-03-10T09:00:00.000Z',
      updatedAt: '2026-03-10T09:00:00.000Z',
      ...storageFixture,
    }

    const hashPayload = encodeAtaToHash(fullAta)
    expect(hashPayload.startsWith('z')).toBe(true)

    window.location.hash = `#${hashPayload}`
    expect(parseAtaFromHash()).toEqual(storageFixture)
  })

  it('aceita formato legado base64 sem prefixo', () => {
    const encoded = toLegacyBase64(JSON.stringify(storageFixture))

    window.location.hash = `#${encoded}`
    expect(parseAtaFromHash()).toEqual(storageFixture)
  })

  it('expande formato mínimo comprimido usado em QR code', () => {
    const minimal = {
      c: storageFixture.cabecalho,
      a: storageFixture.attendance,
      i: storageFixture.itens.map((item) => ({
        id: item.id,
        item: item.item,
        nivel: item.nivel,
        pai: item.pai,
        filhos: item.filhos,
        criadoEm: item.criadoEm,
        u: item.UltimoHistorico,
      })),
    }
    const encodedMinimal = `m${LZString.compressToBase64(JSON.stringify(minimal))}`

    window.location.hash = `#${encodedMinimal}`
    expect(parseAtaFromHash()).toEqual(storageFixture)
  })

  it('retorna null quando o payload é inválido ou incompleto', () => {
    window.location.hash = '#zinvalido'
    expect(parseAtaFromHash()).toBeNull()

    const encodedInvalidStructure = toLegacyBase64(JSON.stringify({ cabecalho: {}, attendance: [] }))
    window.location.hash = `#${encodedInvalidStructure}`
    expect(parseAtaFromHash()).toBeNull()
  })
})
