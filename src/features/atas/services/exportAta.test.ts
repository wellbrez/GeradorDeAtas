import { describe, expect, it } from 'vitest'
import type { MeetingMinutes } from '@/types'
import { parseAtaFromHtml } from './exportAta'

const sampleAta: MeetingMinutes = {
  id: 'ata-1',
  cabecalho: {
    numero: 'ATA-001',
    data: '2026-03-21',
    tipo: 'Kick-Off',
    titulo: 'Reunião de abertura',
    responsavel: 'Responsável',
    projeto: 'Projeto X',
    contrato: 'CTR-1',
  },
  attendance: [],
  itens: [],
  createdAt: '2026-03-21T10:00:00.000Z',
  updatedAt: '2026-03-21T10:00:00.000Z',
}

function wrapAtaPayload(payload: string): string {
  return `<!doctype html><html><body><script type="application/json" id="ata-data">${payload}</script></body></html>`
}

describe('parseAtaFromHtml', () => {
  it('importa ata válida embutida no script ata-data', () => {
    const html = wrapAtaPayload(JSON.stringify(sampleAta))

    const parsed = parseAtaFromHtml(html)

    expect(parsed).not.toBeNull()
    expect(parsed?.cabecalho.numero).toBe('ATA-001')
    expect(parsed?.cabecalho.contrato).toBe('CTR-1')
  })

  it('retorna null quando o html não contém payload', () => {
    const html = '<html><body><h1>Sem payload</h1></body></html>'

    const parsed = parseAtaFromHtml(html)

    expect(parsed).toBeNull()
  })

  it('retorna null para payload inválido ou malformado', () => {
    const invalidJson = wrapAtaPayload('{')
    const malformedShape = wrapAtaPayload(
      JSON.stringify({
        cabecalho: sampleAta.cabecalho,
        attendance: 'not-array',
        itens: [],
      })
    )

    expect(parseAtaFromHtml(invalidJson)).toBeNull()
    expect(parseAtaFromHtml(malformedShape)).toBeNull()
  })
})
