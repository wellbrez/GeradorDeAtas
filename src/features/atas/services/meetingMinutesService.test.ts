import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { HistoricoItem, Item, MeetingMinutesStorage } from '@/types'
import { storageService } from '@services/storage'
import {
  copyMeetingMinutes,
  createMeetingMinutes,
  getMeetingMinutesById,
} from './meetingMinutesService'

function buildStorage(
  overrides: Partial<MeetingMinutesStorage['cabecalho']> = {}
): MeetingMinutesStorage {
  const historico: HistoricoItem = {
    id: 'hist-1',
    criadoEm: '2026-01-01T10:00:00.000Z',
    descricao: 'Item inicial',
    responsavel: { nome: 'Maria', email: 'maria@vale.com' },
    data: '2026-01-02',
    status: 'Pendente',
  }

  return {
    cabecalho: {
      numero: 'ATA-1',
      data: '2026-01-10',
      tipo: 'Kick-Off',
      titulo: 'Projeto Ferrovia',
      responsavel: 'Coordenação',
      projeto: 'Projeto A',
      contrato: '',
      ...overrides,
    },
    attendance: [
      {
        nome: 'Maria',
        email: 'maria@vale.com',
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
        criadoEm: '2026-01-01T10:00:00.000Z',
        historico: [historico],
        UltimoHistorico: historico,
      },
    ],
  }
}

describe('meetingMinutesService', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('arquiva atas anteriores quando contrato antigo é indefinido e o novo é vazio', () => {
    vi.useFakeTimers()

    vi.setSystemTime(new Date('2026-01-05T10:00:00.000Z'))
    const oldAta = createMeetingMinutes(
      buildStorage({
        numero: 'ATA-OLD',
        data: '2026-01-05',
        contrato: undefined,
      })
    )

    vi.setSystemTime(new Date('2026-01-10T10:00:00.000Z'))
    const newAta = createMeetingMinutes(
      buildStorage({
        numero: 'ATA-NEW',
        data: '2026-01-10',
        contrato: '',
      })
    )

    const oldStored = getMeetingMinutesById(oldAta.id)
    const newStored = getMeetingMinutesById(newAta.id)

    expect(oldStored?.arquivada).toBe(true)
    expect(newStored?.arquivada).toBeUndefined()
  })

  it('não arquiva atas anteriores quando o contrato é diferente', () => {
    vi.useFakeTimers()

    vi.setSystemTime(new Date('2026-01-05T10:00:00.000Z'))
    const oldAta = createMeetingMinutes(
      buildStorage({
        numero: 'ATA-OLD',
        data: '2026-01-05',
        contrato: 'CT-001',
      })
    )

    vi.setSystemTime(new Date('2026-01-10T10:00:00.000Z'))
    createMeetingMinutes(
      buildStorage({
        numero: 'ATA-NEW',
        data: '2026-01-10',
        contrato: 'CT-999',
      })
    )

    const oldStored = getMeetingMinutesById(oldAta.id)
    expect(oldStored?.arquivada).toBeUndefined()
  })

  it('copia ata com ids duplicados preservando referência ao primeiro id e histórico válido', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'))

    const childHistory: HistoricoItem = {
      id: 'hist-child',
      criadoEm: '2026-01-03T10:00:00.000Z',
      descricao: 'Subitem',
      responsavel: { nome: 'João', email: 'joao@vale.com' },
      data: '2026-01-20',
      status: 'Em Andamento',
    }

    const malformedRoot = {
      id: 'dup',
      item: '1',
      nivel: 1,
      pai: null,
      filhos: ['dup'],
      criadoEm: '2026-01-01T10:00:00.000Z',
      historico: [],
      UltimoHistorico: undefined,
    } as unknown as Item

    const duplicatedChild: Item = {
      id: 'dup',
      item: '1.1',
      nivel: 2,
      pai: 'dup',
      filhos: [],
      criadoEm: '2026-01-02T10:00:00.000Z',
      historico: [childHistory],
      UltimoHistorico: childHistory,
    }

    storageService.saveMeetingMinutes('source-ata', {
      cabecalho: {
        numero: 'ATA-SOURCE',
        data: '2026-01-10',
        tipo: 'Kick-Off',
        titulo: 'Projeto Ferrovia',
        responsavel: 'Coordenação',
        projeto: 'Projeto A',
        contrato: '',
      },
      attendance: [],
      itens: [malformedRoot, duplicatedChild],
      createdAt: '2026-01-10T12:00:00.000Z',
      updatedAt: '2026-01-10T12:00:00.000Z',
    })

    const copied = copyMeetingMinutes('source-ata')
    expect(copied).not.toBeNull()

    const copiedRoot = copied?.itens.find((i) => i.item === '1')
    const copiedChild = copied?.itens.find((i) => i.item === '1.1')

    expect(copiedRoot).toBeDefined()
    expect(copiedChild).toBeDefined()
    expect(copiedRoot?.id).not.toBe('dup')
    expect(copiedChild?.id).not.toBe('dup')
    expect(copiedChild?.pai).toBe(copiedRoot?.id)
    expect(copiedRoot?.historico).toHaveLength(1)
    expect(copiedRoot?.UltimoHistorico.descricao).toBe('')
    expect(copiedChild?.historico).toHaveLength(1)
    expect(copiedChild?.historico[0]?.id).not.toBe('hist-child')
  })
})
