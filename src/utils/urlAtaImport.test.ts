import LZString from 'lz-string'
import { afterEach, describe, expect, it } from 'vitest'
import type { MeetingMinutes, MeetingMinutesStorage } from '@/types'
import { encodeAtaToHash, parseAtaFromHash } from './urlAtaImport'

function setHash(encoded: string): void {
  window.location.hash = encoded ? `#${encoded}` : ''
}

const historicoBase = {
  id: 'hist-1',
  criadoEm: '2026-04-01T10:00:00.000Z',
  descricao: 'Ação inicial',
  responsavel: { nome: 'Ana', email: 'ana@empresa.com' },
  data: '2026-04-10',
  status: 'Pendente' as const,
}

const storageBase: MeetingMinutesStorage = {
  cabecalho: {
    numero: 'ATA-001',
    data: '2026-04-01',
    tipo: 'Kick-Off',
    titulo: 'Reunião de acompanhamento',
    responsavel: 'Ana',
    projeto: 'Projeto XPTO',
    contrato: '',
  },
  attendance: [
    {
      nome: 'Ana',
      email: 'ana@empresa.com',
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
      criadoEm: '2026-04-01T10:00:00.000Z',
      historico: [historicoBase],
      UltimoHistorico: historicoBase,
    },
  ],
}

afterEach(() => {
  setHash('')
})

describe('urlAtaImport.parseAtaFromHash', () => {
  it('faz round-trip do formato comprimido gerado por encodeAtaToHash', () => {
    const encoded = encodeAtaToHash(storageBase)
    setHash(encoded)

    const parsed = parseAtaFromHash()

    expect(parsed).toEqual(storageBase)
  })

  it('aceita payload completo de MeetingMinutes e converte para storage', () => {
    const fullAta: MeetingMinutes = {
      id: 'ata-1',
      ...storageBase,
      createdAt: '2026-04-01T10:00:00.000Z',
      updatedAt: '2026-04-01T12:00:00.000Z',
    }
    const encoded = encodeAtaToHash(fullAta)
    setHash(encoded)

    const parsed = parseAtaFromHash()

    expect(parsed).toEqual(storageBase)
  })

  it('expande formato mínimo (prefixo m) preservando UltimoHistorico', () => {
    const minimal = {
      c: storageBase.cabecalho,
      a: storageBase.attendance,
      i: [
        {
          id: 'item-1',
          item: '1',
          nivel: 1,
          pai: null,
          filhos: [],
          criadoEm: '2026-04-01T10:00:00.000Z',
          u: historicoBase,
        },
      ],
    }

    const encoded = 'm' + LZString.compressToBase64(JSON.stringify(minimal))
    setHash(encoded)
    const parsed = parseAtaFromHash()

    expect(parsed).not.toBeNull()
    expect(parsed?.itens).toHaveLength(1)
    expect(parsed?.itens[0]?.historico).toEqual([historicoBase])
    expect(parsed?.itens[0]?.UltimoHistorico).toEqual(historicoBase)
  })

  it('retorna null para hash inválido ou estrutura incorreta', () => {
    setHash('nao-e-base64')
    expect(parseAtaFromHash()).toBeNull()

    const invalidMinimal = { c: {}, a: [] }
    setHash('m' + LZString.compressToBase64(JSON.stringify(invalidMinimal)))
    expect(parseAtaFromHash()).toBeNull()
  })
})
