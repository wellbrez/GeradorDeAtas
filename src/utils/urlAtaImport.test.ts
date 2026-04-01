import { beforeEach, describe, expect, it } from 'vitest'
import LZString from 'lz-string'
import type { MeetingMinutesStorage } from '@/types'
import { encodeAtaToHash, parseAtaFromHash } from './urlAtaImport'

function createStorageFixture(): MeetingMinutesStorage {
  return {
    cabecalho: {
      numero: 'ATA-001',
      data: '2026-03-10',
      tipo: 'Semanal',
      titulo: 'Reuniao Projeto Alfa',
      responsavel: 'Maria',
      projeto: 'Projeto Alfa',
      contrato: 'CTR-10',
    },
    attendance: [
      {
        nome: 'Maria',
        email: 'maria@empresa.com',
        empresa: 'Vale',
        telefone: '1199999-9999',
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
        criadoEm: '2026-03-10T10:00:00.000Z',
        historico: [
          {
            id: 'hist-1',
            criadoEm: '2026-03-10T10:00:00.000Z',
            descricao: 'Acao principal',
            responsavel: { nome: 'Maria', email: 'maria@empresa.com' },
            data: '2026-03-11',
            status: 'Pendente',
          },
        ],
        UltimoHistorico: {
          id: 'hist-1',
          criadoEm: '2026-03-10T10:00:00.000Z',
          descricao: 'Acao principal',
          responsavel: { nome: 'Maria', email: 'maria@empresa.com' },
          data: '2026-03-11',
          status: 'Pendente',
        },
      },
    ],
  }
}

describe('urlAtaImport', () => {
  beforeEach(() => {
    window.location.hash = ''
  })

  it('decodifica hash comprimido gerado por encodeAtaToHash', () => {
    const storage = createStorageFixture()
    const hash = encodeAtaToHash(storage)

    window.location.hash = `#${hash}`

    expect(parseAtaFromHash()).toEqual(storage)
  })

  it('mantem compatibilidade com hash legado em base64 puro', () => {
    const storage = createStorageFixture()
    const legacyHash = btoa(JSON.stringify(storage))

    window.location.hash = `#${legacyHash}`

    expect(parseAtaFromHash()).toEqual(storage)
  })

  it('expande formato minimo com defaults quando historico reduzido nao existe', () => {
    const storage = createStorageFixture()
    const minimalPayload = {
      c: storage.cabecalho,
      a: storage.attendance,
      i: [
        {
          id: 'item-min-1',
          item: '1',
          nivel: 1,
          criadoEm: '2026-03-10T10:00:00.000Z',
        },
      ],
    }
    const minimalHash = 'm' + LZString.compressToBase64(JSON.stringify(minimalPayload))

    window.location.hash = `#${minimalHash}`
    const parsed = parseAtaFromHash()

    expect(parsed).not.toBeNull()
    expect(parsed?.itens).toHaveLength(1)
    expect(parsed?.itens[0]?.pai).toBeNull()
    expect(parsed?.itens[0]?.filhos).toEqual([])
    expect(parsed?.itens[0]?.historico).toEqual([
      {
        id: '',
        criadoEm: '',
        descricao: '',
        responsavel: { nome: '', email: '' },
        data: null,
        status: 'Pendente',
      },
    ])
    expect(parsed?.itens[0]?.UltimoHistorico).toEqual(parsed?.itens[0]?.historico[0])
  })

  it('retorna null para dados decodificados sem estrutura valida de ata', () => {
    const invalidPayload = { cabecalho: {}, attendance: [] }
    window.location.hash = `#${btoa(JSON.stringify(invalidPayload))}`

    expect(parseAtaFromHash()).toBeNull()
  })

  it('retorna null para hash comprimido invalido', () => {
    window.location.hash = '#z@@hash-invalido@@'

    expect(parseAtaFromHash()).toBeNull()
  })
})
