import LZString from 'lz-string'
import { afterEach, describe, expect, it } from 'vitest'
import type { MeetingMinutes, MeetingMinutesStorage } from '@/types'
import { encodeAtaToHash, parseAtaFromHash } from './urlAtaImport'

function utf8ToBase64(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

function buildStorageFixture(): MeetingMinutesStorage {
  const history = {
    id: 'hist-1',
    criadoEm: '2026-03-31T10:00:00.000Z',
    descricao: 'Validar importacao segura',
    responsavel: {
      nome: 'Ana',
      email: 'ana@vale.com',
    },
    data: '2026-04-01',
    status: 'Em Andamento' as const,
  }

  return {
    cabecalho: {
      numero: 'ATA-001',
      data: '2026-03-31',
      tipo: 'Kick-Off',
      titulo: 'Reuniao de alinhamento',
      responsavel: 'Ana',
      projeto: 'Projeto A',
      contrato: 'CTR-001',
    },
    attendance: [
      {
        nome: 'Ana',
        email: 'ana@vale.com',
        empresa: 'Vale',
        telefone: '31999990000',
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
        criadoEm: '2026-03-31T10:00:00.000Z',
        historico: [history],
        UltimoHistorico: history,
      },
    ],
  }
}

afterEach(() => {
  window.location.hash = ''
})

describe('urlAtaImport', () => {
  it('retorna null para hash vazio ou invalido', () => {
    window.location.hash = ''
    expect(parseAtaFromHash()).toBeNull()

    window.location.hash = '#   '
    expect(parseAtaFromHash()).toBeNull()

    window.location.hash = '#z@@@'
    expect(parseAtaFromHash()).toBeNull()
  })

  it('faz roundtrip no formato comprimido atual (prefixo z)', () => {
    const storage = buildStorageFixture()
    const encoded = encodeAtaToHash(storage)

    window.location.hash = `#${encoded}`
    expect(parseAtaFromHash()).toEqual(storage)
  })

  it('aceita formato legado em base64 sem prefixo', () => {
    const storage = buildStorageFixture()
    const encoded = utf8ToBase64(JSON.stringify(storage))

    window.location.hash = `#${encoded}`
    expect(parseAtaFromHash()).toEqual(storage)
  })

  it('converte MeetingMinutes completo para storage no parse', () => {
    const storage = buildStorageFixture()
    const fullMeeting: MeetingMinutes = {
      id: 'ata-1',
      ...storage,
      createdAt: '2026-03-31T10:00:00.000Z',
      updatedAt: '2026-03-31T10:05:00.000Z',
      arquivada: false,
    }
    const encoded = utf8ToBase64(JSON.stringify(fullMeeting))

    window.location.hash = `#${encoded}`
    expect(parseAtaFromHash()).toEqual(storage)
  })

  it('expande formato minimo (prefixo m) preservando historico unico', () => {
    const storage = buildStorageFixture()
    const minimal = {
      c: storage.cabecalho,
      a: storage.attendance,
      i: [
        {
          id: 'item-1',
          item: '1',
          nivel: 1,
          criadoEm: '2026-03-31T10:00:00.000Z',
          u: storage.itens[0].UltimoHistorico,
        },
      ],
    }

    window.location.hash = `#m${LZString.compressToBase64(JSON.stringify(minimal))}`
    const parsed = parseAtaFromHash()

    expect(parsed?.cabecalho).toEqual(storage.cabecalho)
    expect(parsed?.attendance).toEqual(storage.attendance)
    expect(parsed?.itens[0]?.pai).toBeNull()
    expect(parsed?.itens[0]?.filhos).toEqual([])
    expect(parsed?.itens[0]?.historico).toEqual([storage.itens[0].UltimoHistorico])
    expect(parsed?.itens[0]?.UltimoHistorico).toEqual(storage.itens[0].UltimoHistorico)
  })

  it('aplica fallback de historico padrao quando formato minimo nao envia u', () => {
    const storage = buildStorageFixture()
    const minimal = {
      c: storage.cabecalho,
      a: storage.attendance,
      i: [
        {
          id: 'item-sem-historico',
          item: '1',
          nivel: 1,
          criadoEm: '2026-03-31T10:00:00.000Z',
        },
      ],
    }

    window.location.hash = `#m${LZString.compressToBase64(JSON.stringify(minimal))}`
    const parsed = parseAtaFromHash()

    expect(parsed).not.toBeNull()
    expect(parsed?.itens[0]?.historico).toHaveLength(1)
    expect(parsed?.itens[0]?.UltimoHistorico).toEqual({
      id: '',
      criadoEm: '',
      descricao: '',
      responsavel: {
        nome: '',
        email: '',
      },
      data: null,
      status: 'Pendente',
    })
  })

  it('rejeita payloads sem estrutura minima de ata', () => {
    const invalidPayload = {
      cabecalho: { titulo: 'sem arrays obrigatorios' },
      itens: [],
    }
    const encoded = utf8ToBase64(JSON.stringify(invalidPayload))

    window.location.hash = `#${encoded}`
    expect(parseAtaFromHash()).toBeNull()
  })
})
