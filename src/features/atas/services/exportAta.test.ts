import { describe, expect, it } from 'vitest'
import type { MeetingMinutes } from '@/types'
import { parseAtaFromHtml } from './exportAta'

const baseAta: MeetingMinutes = {
  id: 'ata-1',
  cabecalho: {
    numero: 'ATA-123',
    data: '2026-04-01',
    tipo: 'Kick-Off',
    titulo: 'Reunião de acompanhamento',
    responsavel: 'Ana',
    projeto: 'Projeto XPTO',
    contrato: 'CTR-001',
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
      historico: [
        {
          id: 'hist-1',
          criadoEm: '2026-04-01T10:00:00.000Z',
          descricao: 'Ação inicial',
          responsavel: { nome: 'Ana', email: 'ana@empresa.com' },
          data: '2026-04-10',
          status: 'Pendente',
        },
      ],
      UltimoHistorico: {
        id: 'hist-1',
        criadoEm: '2026-04-01T10:00:00.000Z',
        descricao: 'Ação inicial',
        responsavel: { nome: 'Ana', email: 'ana@empresa.com' },
        data: '2026-04-10',
        status: 'Pendente',
      },
    },
  ],
  createdAt: '2026-04-01T10:00:00.000Z',
  updatedAt: '2026-04-01T12:00:00.000Z',
}

describe('exportAta.parseAtaFromHtml', () => {
  it('lê payload da ata embutido no script esperado', () => {
    const payload = JSON.stringify(baseAta).replace(/<\/script>/gi, '<\\/script>')
    const html = `<!doctype html><html><body><script type="application/json" id="ata-data">${payload}</script></body></html>`

    const parsed = parseAtaFromHtml(html)

    expect(parsed).toEqual(baseAta)
  })

  it('retorna null quando o script não existe ou json está inválido', () => {
    const htmlWithoutScript = '<html><body><h1>Sem dados</h1></body></html>'
    const htmlInvalidJson =
      '<html><body><script type="application/json" id="ata-data">{invalid-json}</script></body></html>'

    expect(parseAtaFromHtml(htmlWithoutScript)).toBeNull()
    expect(parseAtaFromHtml(htmlInvalidJson)).toBeNull()
  })

  it('retorna null quando estrutura mínima obrigatória não existe', () => {
    const invalidPayload = JSON.stringify({ cabecalho: {}, attendance: 'não-array', itens: [] })
    const html = `<!doctype html><html><body><script type="application/json" id="ata-data">${invalidPayload}</script></body></html>`

    expect(parseAtaFromHtml(html)).toBeNull()
  })
})
