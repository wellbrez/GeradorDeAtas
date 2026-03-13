import LZString from 'lz-string'
import { afterEach, describe, expect, it } from 'vitest'
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

const storageFixture: MeetingMinutesStorage = {
  cabecalho: {
    numero: 'ATA-001',
    data: '2026-03-13',
    tipo: 'Ordinária',
    titulo: 'Reunião de alinhamento',
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
      criadoEm: '2026-03-13T10:00:00.000Z',
      historico: [
        {
          id: 'hist-1',
          criadoEm: '2026-03-13T10:00:00.000Z',
          descricao: 'Validar impacto',
          responsavel: { nome: 'Maria', email: 'maria@empresa.com' },
          data: '2026-03-20',
          status: 'Em Andamento',
        },
      ],
      UltimoHistorico: {
        id: 'hist-1',
        criadoEm: '2026-03-13T10:00:00.000Z',
        descricao: 'Validar impacto',
        responsavel: { nome: 'Maria', email: 'maria@empresa.com' },
        data: '2026-03-20',
        status: 'Em Andamento',
      },
    },
  ],
}

afterEach(() => {
  window.location.hash = ''
})

describe('parseAtaFromHash', () => {
  it('faz roundtrip de formato comprimido atual', () => {
    const encoded = encodeAtaToHash(storageFixture)
    window.location.hash = `#${encoded}`

    const parsed = parseAtaFromHash()

    expect(parsed).toEqual(storageFixture)
  })

  it('suporta formato legado em base64 sem prefixo', () => {
    const legacyHash = utf8ToBase64(JSON.stringify(storageFixture))
    window.location.hash = `#${legacyHash}`

    const parsed = parseAtaFromHash()

    expect(parsed).toEqual(storageFixture)
  })

  it('expande formato minimo com historico default quando ausente', () => {
    const minimalPayload = {
      c: storageFixture.cabecalho,
      a: storageFixture.attendance,
      i: [
        {
          id: 'item-min',
          item: '1',
          nivel: 1,
          pai: null,
          filhos: [],
          criadoEm: '2026-03-13T10:00:00.000Z',
        },
      ],
    }

    window.location.hash = `#m${LZString.compressToBase64(JSON.stringify(minimalPayload))}`
    const parsed = parseAtaFromHash()

    expect(parsed).not.toBeNull()
    expect(parsed?.itens[0].historico).toEqual([
      {
        id: '',
        criadoEm: '',
        descricao: '',
        responsavel: { nome: '', email: '' },
        data: null,
        status: 'Pendente',
      },
    ])
  })

  it('retorna null para hash invalido', () => {
    window.location.hash = '#isto-nao-e-uma-ata'

    const parsed = parseAtaFromHash()

    expect(parsed).toBeNull()
  })
})
