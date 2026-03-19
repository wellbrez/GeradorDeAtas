import { afterEach, describe, expect, it } from 'vitest'
import LZString from 'lz-string'
import type { MeetingMinutesStorage } from '@/types'
import { encodeAtaToHash, parseAtaFromHash } from '@/utils/urlAtaImport'

const baseStorage: MeetingMinutesStorage = {
  cabecalho: {
    numero: 'ATA-001',
    data: '2026-03-19',
    tipo: 'Kick-Off',
    titulo: 'Reuniao de alinhamento',
    responsavel: 'Ana',
    projeto: 'Projeto X',
    contrato: '',
  },
  attendance: [
    {
      nome: 'Ana',
      email: 'ana@empresa.com',
      empresa: 'Empresa',
      telefone: '11999990000',
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
      criadoEm: '2026-03-19T12:00:00.000Z',
      historico: [
        {
          id: 'hist-1',
          criadoEm: '2026-03-19T12:00:00.000Z',
          descricao: 'Acao principal',
          responsavel: { nome: 'Ana', email: 'ana@empresa.com' },
          data: '2026-03-20',
          status: 'Pendente',
        },
      ],
      UltimoHistorico: {
        id: 'hist-1',
        criadoEm: '2026-03-19T12:00:00.000Z',
        descricao: 'Acao principal',
        responsavel: { nome: 'Ana', email: 'ana@empresa.com' },
        data: '2026-03-20',
        status: 'Pendente',
      },
    },
  ],
}

function toBase64Utf8(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary)
}

describe('urlAtaImport', () => {
  afterEach(() => {
    window.history.replaceState({}, '', window.location.pathname + window.location.search)
  })

  it('faz roundtrip no formato comprimido atual', () => {
    const hash = encodeAtaToHash(baseStorage)
    window.location.hash = `#${hash}`

    expect(parseAtaFromHash()).toEqual(baseStorage)
  })

  it('suporta formato legado base64 puro', () => {
    const legacy = toBase64Utf8(JSON.stringify(baseStorage))
    window.location.hash = `#${legacy}`

    expect(parseAtaFromHash()).toEqual(baseStorage)
  })

  it('expande formato minimo comprimido para storage completo', () => {
    const minimal = {
      c: baseStorage.cabecalho,
      a: baseStorage.attendance,
      i: baseStorage.itens.map((item) => ({
        id: item.id,
        item: item.item,
        nivel: item.nivel,
        pai: item.pai,
        filhos: item.filhos,
        criadoEm: item.criadoEm,
        u: item.UltimoHistorico,
      })),
    }
    const hash = 'm' + LZString.compressToBase64(JSON.stringify(minimal))
    window.location.hash = `#${hash}`

    expect(parseAtaFromHash()).toEqual(baseStorage)
  })

  it('retorna null para payload invalido', () => {
    const invalidHash = 'z' + LZString.compressToBase64('{"foo":"bar"}')
    window.location.hash = `#${invalidHash}`

    expect(parseAtaFromHash()).toBeNull()
  })
})
