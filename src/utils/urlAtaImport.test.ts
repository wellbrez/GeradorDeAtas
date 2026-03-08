import LZString from 'lz-string'
import { beforeEach, describe, expect, it } from 'vitest'
import type { MeetingMinutesStorage } from '@/types'
import { encodeAtaToHash, parseAtaFromHash } from './urlAtaImport'

const SAMPLE_STORAGE: MeetingMinutesStorage = {
  cabecalho: {
    numero: 'ATA-001',
    data: '2026-03-01',
    tipo: 'Ordinária',
    titulo: 'Reunião de Planejamento',
    responsavel: 'Maria Silva',
    projeto: 'Projeto A',
  },
  attendance: [
    {
      nome: 'Maria Silva',
      email: 'maria@example.com',
      empresa: 'Vale',
      telefone: '31999999999',
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
      criadoEm: '2026-03-01T10:00:00.000Z',
      historico: [
        {
          id: 'hist-1',
          criadoEm: '2026-03-01T10:00:00.000Z',
          descricao: 'Definir escopo inicial',
          responsavel: { nome: 'Maria Silva', email: 'maria@example.com' },
          data: '2026-03-10',
          status: 'Pendente',
        },
      ],
      UltimoHistorico: {
        id: 'hist-1',
        criadoEm: '2026-03-01T10:00:00.000Z',
        descricao: 'Definir escopo inicial',
        responsavel: { nome: 'Maria Silva', email: 'maria@example.com' },
        data: '2026-03-10',
        status: 'Pendente',
      },
    },
  ],
}

function utf8ToBase64(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

describe('urlAtaImport', () => {
  beforeEach(() => {
    window.location.hash = ''
  })

  it('faz roundtrip do formato comprimido atual', () => {
    window.location.hash = `#${encodeAtaToHash(SAMPLE_STORAGE)}`

    expect(parseAtaFromHash()).toEqual(SAMPLE_STORAGE)
  })

  it('aceita o formato legado em base64 puro', () => {
    const json = JSON.stringify(SAMPLE_STORAGE)
    window.location.hash = `#${utf8ToBase64(json)}`

    expect(parseAtaFromHash()).toEqual(SAMPLE_STORAGE)
  })

  it('expande o formato mínimo usado em links compactos', () => {
    const minimalPayload = {
      c: SAMPLE_STORAGE.cabecalho,
      a: SAMPLE_STORAGE.attendance,
      i: SAMPLE_STORAGE.itens.map((item) => ({
        id: item.id,
        item: item.item,
        nivel: item.nivel,
        pai: item.pai,
        filhos: item.filhos,
        criadoEm: item.criadoEm,
        u: item.UltimoHistorico,
      })),
    }

    window.location.hash = `#m${LZString.compressToBase64(JSON.stringify(minimalPayload))}`

    expect(parseAtaFromHash()).toEqual(SAMPLE_STORAGE)
  })

  it('retorna null para hash inválido', () => {
    window.location.hash = '#hash-invalido'

    expect(parseAtaFromHash()).toBeNull()
  })
})
