import LZString from 'lz-string'
import type { MeetingMinutesStorage } from '@/types'
import { encodeAtaToHash, parseAtaFromHash } from './urlAtaImport'

function utf8ToBase64(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}

function createStorageFixture(): MeetingMinutesStorage {
  return {
    cabecalho: {
      numero: 'ATA-001',
      data: '2026-03-23',
      tipo: 'Ordinária',
      titulo: 'Reunião de acompanhamento',
      responsavel: 'Ana',
      projeto: 'Projeto A',
      contrato: 'CTR-99',
    },
    attendance: [
      {
        nome: 'Ana',
        email: 'ana@example.com',
        empresa: 'Vale',
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
        criadoEm: '2026-03-23T10:00:00.000Z',
        historico: [
          {
            id: 'hist-1',
            criadoEm: '2026-03-23T10:00:00.000Z',
            descricao: 'Validar cronograma',
            responsavel: { nome: 'Ana', email: 'ana@example.com' },
            data: '2026-03-30',
            status: 'Pendente',
          },
        ],
        UltimoHistorico: {
          id: 'hist-1',
          criadoEm: '2026-03-23T10:00:00.000Z',
          descricao: 'Validar cronograma',
          responsavel: { nome: 'Ana', email: 'ana@example.com' },
          data: '2026-03-30',
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

  it('faz round-trip de hash compactado', () => {
    const storage = createStorageFixture()

    window.location.hash = `#${encodeAtaToHash(storage)}`

    expect(parseAtaFromHash()).toEqual(storage)
  })

  it('suporta links legados em base64 UTF-8', () => {
    const storage = createStorageFixture()
    storage.cabecalho.titulo = 'Reunião com ação'

    window.location.hash = `#${utf8ToBase64(JSON.stringify(storage))}`

    expect(parseAtaFromHash()).toEqual(storage)
  })

  it('expande formato minimal e cria histórico padrão quando u não existe', () => {
    const storage = createStorageFixture()
    const minimalPayload = {
      c: storage.cabecalho,
      a: storage.attendance,
      i: [
        {
          id: 'item-1',
          item: '1',
          nivel: 1,
          pai: null,
          filhos: [],
          criadoEm: '2026-03-23T10:00:00.000Z',
        },
      ],
    }

    window.location.hash = `#m${LZString.compressToBase64(JSON.stringify(minimalPayload))}`

    const parsed = parseAtaFromHash()
    expect(parsed).not.toBeNull()
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
    expect(parsed?.itens[0]?.UltimoHistorico.status).toBe('Pendente')
  })

  it('retorna null para hash inválido', () => {
    window.location.hash = '#valor-invalido'

    expect(parseAtaFromHash()).toBeNull()
  })
})
