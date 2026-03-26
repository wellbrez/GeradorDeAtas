import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MeetingMinutesStorage } from '@/types'

const storageState = vi.hoisted(() => {
  const records = new Map<string, Record<string, unknown>>()
  const ids: string[] = []
  return { records, ids }
})

const storageServiceMock = vi.hoisted(() => ({
  getAllMeetingMinutes: vi.fn(() => [...storageState.ids]),
  getMeetingMinutes: vi.fn((id: string) => storageState.records.get(id) ?? null),
  saveMeetingMinutesIds: vi.fn((ids: string[]) => {
    storageState.ids.splice(0, storageState.ids.length, ...ids)
  }),
  saveMeetingMinutes: vi.fn((id: string, data: Record<string, unknown>) => {
    storageState.records.set(id, data)
    if (!storageState.ids.includes(id)) storageState.ids.push(id)
  }),
  removeMeetingMinutes: vi.fn((id: string) => {
    storageState.records.delete(id)
    const next = storageState.ids.filter((storedId) => storedId !== id)
    storageState.ids.splice(0, storageState.ids.length, ...next)
  }),
  clearAll: vi.fn(() => {
    storageState.records.clear()
    storageState.ids.splice(0, storageState.ids.length)
  }),
  isAvailable: vi.fn(() => true),
  getDraft: vi.fn(() => null),
  saveDraft: vi.fn(),
  clearDraft: vi.fn(),
}))

vi.mock('@services/storage', () => ({
  storageService: storageServiceMock,
}))

import { createMeetingMinutes } from './meetingMinutesService'

interface SeedCabecalho {
  titulo: string
  tipo: string
  projeto: string
  contrato?: string
  data: string
}

function createStorageFixture(overrides?: Partial<MeetingMinutesStorage['cabecalho']>): MeetingMinutesStorage {
  const historico = {
    id: 'hist-1',
    criadoEm: '2026-03-20T10:00:00.000Z',
    descricao: 'Ação inicial',
    responsavel: { nome: 'Ana', email: 'ana@empresa.com' },
    data: '2026-03-25',
    status: 'Pendente' as const,
  }

  return {
    cabecalho: {
      numero: 'ATA-100',
      data: '2026-03-20',
      tipo: 'Ordinária',
      titulo: 'Acompanhamento',
      responsavel: 'Ana',
      projeto: 'Projeto A',
      contrato: 'CTR-01',
      ...overrides,
    },
    attendance: [
      {
        nome: 'Ana',
        email: 'ana@empresa.com',
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
        criadoEm: '2026-03-20T10:00:00.000Z',
        historico: [historico],
        UltimoHistorico: historico,
      },
    ],
  }
}

function seedMeetingMinutes(id: string, cabecalho: SeedCabecalho, arquivada = false): void {
  storageState.records.set(id, {
    cabecalho: {
      numero: `ATA-${id}`,
      responsavel: 'Ana',
      ...cabecalho,
    },
    attendance: [],
    itens: [],
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    ...(arquivada ? { arquivada: true } : {}),
  })
  if (!storageState.ids.includes(id)) storageState.ids.push(id)
}

describe('meetingMinutesService.createMeetingMinutes', () => {
  beforeEach(() => {
    storageState.records.clear()
    storageState.ids.splice(0, storageState.ids.length)
    vi.clearAllMocks()
  })

  it('arquiva atas anteriores com mesma chave e data menor', () => {
    seedMeetingMinutes('old-match', {
      titulo: 'Acompanhamento',
      tipo: 'Ordinária',
      projeto: 'Projeto A',
      contrato: 'CTR-01',
      data: '2026-03-10',
    })
    seedMeetingMinutes('newer-match', {
      titulo: 'Acompanhamento',
      tipo: 'Ordinária',
      projeto: 'Projeto A',
      contrato: 'CTR-01',
      data: '2026-03-21',
    })
    seedMeetingMinutes('different-contract', {
      titulo: 'Acompanhamento',
      tipo: 'Ordinária',
      projeto: 'Projeto A',
      contrato: 'CTR-02',
      data: '2026-03-10',
    })
    seedMeetingMinutes(
      'already-archived',
      {
        titulo: 'Acompanhamento',
        tipo: 'Ordinária',
        projeto: 'Projeto A',
        contrato: 'CTR-01',
        data: '2026-03-10',
      },
      true
    )

    createMeetingMinutes(createStorageFixture())

    expect(storageState.records.get('old-match')?.arquivada).toBe(true)
    expect(storageState.records.get('newer-match')?.arquivada).toBeUndefined()
    expect(storageState.records.get('different-contract')?.arquivada).toBeUndefined()
    expect(storageState.records.get('already-archived')?.arquivada).toBe(true)
  })

  it('trata contrato ausente como chave vazia para arquivamento', () => {
    seedMeetingMinutes('without-contract', {
      titulo: 'Acompanhamento',
      tipo: 'Ordinária',
      projeto: 'Projeto A',
      data: '2026-03-10',
    })

    createMeetingMinutes(createStorageFixture({ contrato: undefined }))

    expect(storageState.records.get('without-contract')?.arquivada).toBe(true)
  })
})
