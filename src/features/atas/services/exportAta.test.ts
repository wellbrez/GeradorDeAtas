import { describe, expect, it } from 'vitest'
import type { HistoricoItem, MeetingMinutes } from '@/types'
import { buildAtaHtml } from './exportAta'

function makeHistorico(id: string, data: string | null): HistoricoItem {
  return {
    id,
    criadoEm: '2026-03-06T15:00:00.000Z',
    descricao: `Descricao ${id}`,
    responsavel: {
      nome: 'Responsavel',
      email: 'responsavel@example.com',
    },
    data,
    status: 'Pendente',
  }
}

function makeAta(cabecalhoData: string, datasHistorico: Array<string | null>): MeetingMinutes {
  const historico = datasHistorico.map((data, index) => makeHistorico(`h${index + 1}`, data))
  const ultimoHistorico = historico[historico.length - 1]!

  return {
    id: 'ata-1',
    cabecalho: {
      numero: 'ATA-001',
      data: cabecalhoData,
      tipo: 'Ordinaria',
      titulo: 'Reuniao de acompanhamento',
      responsavel: 'Analista',
      projeto: 'Projeto X',
    },
    attendance: [
      {
        nome: 'Participante',
        email: 'participante@example.com',
        empresa: 'Vale',
        telefone: '31999999999',
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
        criadoEm: '2026-03-06T15:00:00.000Z',
        historico,
        UltimoHistorico: ultimoHistorico,
      },
    ],
    createdAt: '2026-03-06T15:00:00.000Z',
    updatedAt: '2026-03-06T15:00:00.000Z',
  }
}

describe('buildAtaHtml - timezone safe date rendering', () => {
  it('keeps YYYY-MM-DD values on the same local calendar day', () => {
    const ata = makeAta('2026-03-06', ['2026-03-07', '2026-03-10'])

    const html = buildAtaHtml(ata, { appBaseUrl: 'https://example.com/GeradorDeAtas/' })

    expect(html).toContain('>06/03/2026<')
    expect(html).toContain('>07/03/2026<')
    expect(html).toContain('>10/03/2026<')
    expect(html).not.toContain('>05/03/2026<')
    expect(html).not.toContain('>09/03/2026<')
  })

  it('still applies native timezone conversion for full timestamp strings', () => {
    const ata = makeAta('2026-03-06T00:00:00.000Z', ['2026-03-06T00:00:00.000Z'])

    const html = buildAtaHtml(ata, { appBaseUrl: 'https://example.com/GeradorDeAtas/' })

    expect(html).toContain('>05/03/2026<')
    expect(html).not.toContain('>06/03/2026<')
  })
})
