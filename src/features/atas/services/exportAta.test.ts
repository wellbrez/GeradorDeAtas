import { describe, expect, it } from 'vitest'
import type { MeetingMinutes, Participant } from '@/types'
import { buildAtaHtml, parseAtaFromHtml } from './exportAta'

function createAta(descricao = 'Descricao normal'): MeetingMinutes {
  const participant: Participant = {
    nome: 'Ana',
    email: 'ana@vale.com',
    empresa: 'Vale',
    telefone: '31999999999',
    presenca: 'P',
  }

  return {
    id: 'ata-1',
    createdAt: '2026-03-05T12:00:00.000Z',
    updatedAt: '2026-03-05T12:00:00.000Z',
    cabecalho: {
      numero: 'ATA-001',
      data: '2026-03-05',
      tipo: 'Ordinaria',
      titulo: 'Reuniao de planejamento',
      responsavel: 'Equipe',
      projeto: 'Projeto X',
    },
    attendance: [participant],
    itens: [
      {
        id: 'parent',
        item: '1',
        nivel: 1,
        pai: null,
        filhos: ['child'],
        criadoEm: '2026-03-05T12:00:00.000Z',
        historico: [
          {
            id: 'h-parent',
            criadoEm: '2026-03-05T12:00:00.000Z',
            descricao: 'Topico principal',
            responsavel: { nome: '', email: '' },
            data: null,
            status: 'Pendente',
          },
        ],
        UltimoHistorico: {
          id: 'h-parent',
          criadoEm: '2026-03-05T12:00:00.000Z',
          descricao: 'Topico principal',
          responsavel: { nome: '', email: '' },
          data: null,
          status: 'Pendente',
        },
      },
      {
        id: 'child',
        item: '1.1',
        nivel: 2,
        pai: 'parent',
        filhos: [],
        criadoEm: '2026-03-05T12:00:00.000Z',
        historico: [
          {
            id: 'h-child',
            criadoEm: '2026-03-05T12:00:00.000Z',
            descricao,
            responsavel: { nome: 'Ana', email: 'ana@vale.com' },
            data: '2026-03-05',
            status: 'Pendente',
          },
        ],
        UltimoHistorico: {
          id: 'h-child',
          criadoEm: '2026-03-05T12:00:00.000Z',
          descricao,
          responsavel: { nome: 'Ana', email: 'ana@vale.com' },
          data: '2026-03-05',
          status: 'Pendente',
        },
      },
    ],
  }
}

describe('exportAta', () => {
  it('renderiza datas YYYY-MM-DD como dia local correto no HTML', () => {
    const html = buildAtaHtml(createAta())
    expect(html).toContain('05/03/2026')
    expect(html).not.toContain('04/03/2026')
  })

  it('marca item-pai com atributos de filtro neutros', () => {
    const html = buildAtaHtml(createAta())
    expect(html).toContain('data-ata-parent="1"')
    expect(html).toContain('data-ata-id="parent"')
    expect(html).toContain('data-ata-resp=""')
    expect(html).toContain('data-ata-date=""')
    expect(html).toContain('data-ata-status=""')
  })

  it('preserva JSON mesmo com texto contendo fechamento de script', () => {
    const riskyDescription = 'Texto </script> com marcador'
    const ata = createAta(riskyDescription)
    const html = buildAtaHtml(ata)
    const parsed = parseAtaFromHtml(html)
    expect(parsed).toEqual(ata)
  })

  it('retorna null quando o HTML não possui payload da ata', () => {
    expect(parseAtaFromHtml('<html><body>sem dados</body></html>')).toBeNull()
  })
})
