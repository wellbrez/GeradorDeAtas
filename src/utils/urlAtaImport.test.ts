import { beforeEach, describe, expect, it } from 'vitest'
import LZString from 'lz-string'
import type { MeetingMinutesStorage } from '@/types'
import { encodeAtaToHash, parseAtaFromHash } from './urlAtaImport'

function sampleStorage(): MeetingMinutesStorage {
  return {
    cabecalho: {
      numero: 'ATA-001',
      data: '2026-04-04',
      tipo: 'Reunião de Acompanhamento',
      titulo: 'Status semanal',
      responsavel: 'Maria',
      projeto: 'Projeto X',
      contrato: 'CTR-9',
    },
    attendance: [
      {
        nome: 'Maria',
        email: 'maria@example.com',
        empresa: 'Vale',
        telefone: '11999999999',
        presenca: 'P',
      },
    ],
    itens: [],
  }
}

/**
 * Codifica UTF-8 para base64 no formato legado (sem compressão).
 */
function utf8ToBase64(input: string): string {
  const bytes = new TextEncoder().encode(input)
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

  it('decodifica hash comprimido gerado por encodeAtaToHash', () => {
    const storage = sampleStorage()
    window.location.hash = '#' + encodeAtaToHash(storage)

    const parsed = parseAtaFromHash()

    expect(parsed).toEqual(storage)
  })

  it('aceita formato legado em base64 puro', () => {
    const storage = sampleStorage()
    const legacy = utf8ToBase64(JSON.stringify(storage))
    window.location.hash = '#' + legacy

    const parsed = parseAtaFromHash()

    expect(parsed).toEqual(storage)
  })

  it('retorna null para hash inválido', () => {
    window.location.hash = '#isso-nao-e-base64-valido'

    const parsed = parseAtaFromHash()

    expect(parsed).toBeNull()
  })

  it('retorna null para JSON sem estrutura mínima', () => {
    window.location.hash = '#' + utf8ToBase64(JSON.stringify({ hello: 'world' }))

    const parsed = parseAtaFromHash()

    expect(parsed).toBeNull()
  })

  it('decodifica formato mínimo comprimido com prefixo m', () => {
    const minimal = {
      c: sampleStorage().cabecalho,
      a: sampleStorage().attendance,
      i: [
        {
          id: 'item-1',
          item: '1',
          nivel: 1,
          pai: null,
          filhos: [],
          criadoEm: '2026-04-04T10:00:00.000Z',
          u: {
            id: 'hist-1',
            criadoEm: '2026-04-04T10:00:00.000Z',
            descricao: 'Primeiro registro',
            responsavel: { nome: 'Maria', email: 'maria@example.com' },
            data: '2026-04-05',
            status: 'Pendente',
          },
        },
      ],
    }
    const encoded = 'm' + LZString.compressToBase64(JSON.stringify(minimal))
    window.location.hash = '#' + encoded

    const parsed = parseAtaFromHash()

    expect(parsed).not.toBeNull()
    expect(parsed?.itens[0]?.historico).toHaveLength(1)
    expect(parsed?.itens[0]?.UltimoHistorico.descricao).toBe('Primeiro registro')
  })
})
