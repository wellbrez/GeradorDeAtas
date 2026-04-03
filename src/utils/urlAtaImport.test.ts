import LZString from 'lz-string'
import type { MeetingMinutesStorage } from '@/types'
import { encodeAtaToHash, parseAtaFromHash } from './urlAtaImport'

/**
 * Helpers para testes de importação/exportação por hash.
 */
function setWindowHash(encodedHash: string): void {
  window.location.hash = encodedHash ? `#${encodedHash}` : ''
}

function makeStorageFixture(): MeetingMinutesStorage {
  return {
    cabecalho: {
      numero: 'ATA-001',
      data: '2026-04-03',
      tipo: 'Follow-up',
      titulo: 'Ata Semanal',
      responsavel: 'Equipe PMO',
      projeto: 'Projeto Alfa',
      contrato: 'CTR-42',
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
        criadoEm: '2026-04-03T10:00:00.000Z',
        historico: [
          {
            id: 'hist-1',
            criadoEm: '2026-04-03T10:00:00.000Z',
            descricao: 'Atualizar cronograma',
            responsavel: { nome: 'Ana', email: 'ana@empresa.com' },
            data: '2026-04-04',
            status: 'Pendente',
          },
        ],
        UltimoHistorico: {
          id: 'hist-1',
          criadoEm: '2026-04-03T10:00:00.000Z',
          descricao: 'Atualizar cronograma',
          responsavel: { nome: 'Ana', email: 'ana@empresa.com' },
          data: '2026-04-04',
          status: 'Pendente',
        },
      },
    ],
  }
}

describe('urlAtaImport', () => {
  beforeEach(() => {
    setWindowHash('')
  })

  it('retorna null quando hash está vazio ou inválido', () => {
    expect(parseAtaFromHash()).toBeNull()

    setWindowHash('@@@')
    expect(parseAtaFromHash()).toBeNull()
  })

  it('faz parse de hash legado em base64 puro', () => {
    const storage = makeStorageFixture()
    const encoded = btoa(JSON.stringify(storage))

    setWindowHash(encoded)

    expect(parseAtaFromHash()).toEqual(storage)
  })

  it('faz round-trip do formato comprimido com prefixo z', () => {
    const storage = makeStorageFixture()
    const encoded = encodeAtaToHash(storage)

    setWindowHash(encoded)

    expect(parseAtaFromHash()).toEqual(storage)
  })

  it('expande o formato mínimo com prefixo m', () => {
    const storage = makeStorageFixture()
    const minimal = {
      c: storage.cabecalho,
      a: storage.attendance,
      i: [
        {
          id: 'i-1',
          item: '1',
          nivel: 1,
          pai: null,
          filhos: [],
          criadoEm: '2026-04-03T10:00:00.000Z',
          u: {
            id: 'h-1',
            criadoEm: '2026-04-03T10:00:00.000Z',
            descricao: 'Item mínimo',
            responsavel: { nome: 'Ana', email: 'ana@empresa.com' },
            data: '2026-04-04',
            status: 'Pendente',
          },
        },
      ],
    }
    const encoded = `m${LZString.compressToBase64(JSON.stringify(minimal))}`

    setWindowHash(encoded)
    const parsed = parseAtaFromHash()

    expect(parsed).not.toBeNull()
    expect(parsed?.cabecalho).toEqual(storage.cabecalho)
    expect(parsed?.attendance).toEqual(storage.attendance)
    expect(parsed?.itens[0]?.historico).toEqual([minimal.i[0].u])
    expect(parsed?.itens[0]?.UltimoHistorico).toEqual(minimal.i[0].u)
  })

  it('retorna null quando payload decodificado não atende estrutura mínima', () => {
    const invalidPayload = { cabecalho: { numero: 'A' }, attendance: [] }
    const encoded = btoa(JSON.stringify(invalidPayload))

    setWindowHash(encoded)

    expect(parseAtaFromHash()).toBeNull()
  })
})
