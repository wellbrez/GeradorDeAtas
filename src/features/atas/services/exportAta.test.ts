import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MeetingMinutes } from '@/types'
import { downloadAtaAsHtml, parseAtaFromHtml } from './exportAta'

const ataFixture: MeetingMinutes = {
  id: 'ata-1',
  createdAt: '2026-03-10T08:00:00.000Z',
  updatedAt: '2026-03-10T08:00:00.000Z',
  cabecalho: {
    numero: 'ATA-2026-001',
    data: '2026-03-10',
    tipo: 'Ordinária',
    titulo: 'Ata semanal',
    responsavel: 'Equipe',
    projeto: 'Projeto X',
  },
  attendance: [
    {
      nome: 'Maria Silva',
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
      criadoEm: '2026-03-10T08:00:00.000Z',
      historico: [
        {
          id: 'hist-1',
          criadoEm: '2026-03-10T08:00:00.000Z',
          descricao: 'Validar entrega',
          responsavel: { nome: 'Maria Silva', email: 'maria@empresa.com' },
          data: '2026-03-10',
          status: 'Pendente',
        },
      ],
      UltimoHistorico: {
        id: 'hist-1',
        criadoEm: '2026-03-10T08:00:00.000Z',
        descricao: 'Validar entrega',
        responsavel: { nome: 'Maria Silva', email: 'maria@empresa.com' },
        data: '2026-03-10',
        status: 'Pendente',
      },
    },
  ],
}

describe('exportAta', () => {
  let createObjectURLSpy: ReturnType<typeof vi.fn>
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>
  let clickSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    localStorage.clear()
    createObjectURLSpy = vi.fn(() => 'blob:ata')
    revokeObjectURLSpy = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectURLSpy,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectURLSpy,
    })
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  afterEach(() => {
    clickSpy.mockRestore()
    vi.restoreAllMocks()
  })

  it('exporta HTML preservando dia local para datas YYYY-MM-DD e mantém JSON recuperável', async () => {
    downloadAtaAsHtml(ataFixture)

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1)
    const [blobArg] = createObjectURLSpy.mock.calls[0] ?? []
    expect(blobArg).toBeInstanceOf(Blob)

    const html = await (blobArg as Blob).text()
    expect(html).toContain('10/03/2026')
    expect(html).not.toContain('09/03/2026')

    const parsedAta = parseAtaFromHtml(html)
    expect(parsedAta).not.toBeNull()
    expect(parsedAta?.cabecalho.numero).toBe(ataFixture.cabecalho.numero)
  })
})
