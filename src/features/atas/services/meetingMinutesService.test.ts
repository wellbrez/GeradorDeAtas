import { beforeEach, describe, expect, it } from 'vitest'
import type { HistoricoItem, Item, MeetingMinutesStorage } from '@/types'
import { createMeetingMinutes, getMeetingMinutesById } from './meetingMinutesService'

function buildStorage(data: string, contrato = 'CTR-001'): MeetingMinutesStorage {
  const historicoBase: HistoricoItem = {
    id: 'hist-1',
    criadoEm: `${data}T10:00:00.000Z`,
    descricao: 'Acompanhamento de ação',
    responsavel: { nome: 'Ana', email: 'ana@empresa.com' },
    data,
    status: 'Pendente',
  }

  const itemBase: Item = {
    id: 'item-1',
    item: '1',
    nivel: 1,
    pai: null,
    filhos: [],
    criadoEm: `${data}T10:00:00.000Z`,
    historico: [historicoBase],
    UltimoHistorico: historicoBase,
  }

  return {
    cabecalho: {
      numero: '',
      data,
      tipo: 'Reunião de Acompanhamento',
      titulo: 'Status Semanal',
      responsavel: 'Coordenação',
      projeto: 'Projeto Serra Norte',
      contrato,
    },
    attendance: [],
    itens: [itemBase],
  }
}

describe('meetingMinutesService/createMeetingMinutes', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('arquiva atas anteriores com a mesma chave quando a nova é mais recente', () => {
    const ataAntiga = createMeetingMinutes(buildStorage('2026-03-10'))
    const ataNova = createMeetingMinutes(buildStorage('2026-03-15'))

    const antigaSalva = getMeetingMinutesById(ataAntiga.id)
    const novaSalva = getMeetingMinutesById(ataNova.id)

    expect(antigaSalva?.arquivada).toBe(true)
    expect(novaSalva?.arquivada).not.toBe(true)
  })

  it('não arquiva ata anterior quando o contrato é diferente', () => {
    const ataAntiga = createMeetingMinutes(buildStorage('2026-03-10', 'CTR-001'))
    createMeetingMinutes(buildStorage('2026-03-15', 'CTR-999'))

    const antigaSalva = getMeetingMinutesById(ataAntiga.id)
    expect(antigaSalva?.arquivada).not.toBe(true)
  })

  it('não arquiva ata com data mais nova quando a nova criação é retroativa', () => {
    const ataComDataMaisNova = createMeetingMinutes(buildStorage('2026-03-20'))
    createMeetingMinutes(buildStorage('2026-03-10'))

    const salva = getMeetingMinutesById(ataComDataMaisNova.id)
    expect(salva?.arquivada).not.toBe(true)
  })
})
