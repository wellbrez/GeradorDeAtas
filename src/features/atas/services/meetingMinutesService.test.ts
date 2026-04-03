import type { MeetingMinutesStorage } from '@/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

interface StorageRecord {
  id: string
  data: Record<string, unknown>
}

const mockState = vi.hoisted(() => {
  return {
    records: [] as StorageRecord[],
    ids: [] as string[],
    saveMeetingMinutes: vi.fn((id: string, data: Record<string, unknown>) => {
      const existingIndex = mockState.records.findIndex((r) => r.id === id)
      if (existingIndex >= 0) {
        mockState.records[existingIndex] = { id, data }
      } else {
        mockState.records.push({ id, data })
      }
      if (!mockState.ids.includes(id)) {
        mockState.ids.push(id)
      }
    }),
    getAllMeetingMinutes: vi.fn(() => [...mockState.ids]),
    getMeetingMinutes: vi.fn((id: string) => {
      const record = mockState.records.find((r) => r.id === id)
      return record ? record.data : null
    }),
    removeMeetingMinutes: vi.fn(),
  }
})

vi.mock('@services/storage', () => {
  return {
    storageService: {
      saveMeetingMinutes: mockState.saveMeetingMinutes,
      getAllMeetingMinutes: mockState.getAllMeetingMinutes,
      getMeetingMinutes: mockState.getMeetingMinutes,
      removeMeetingMinutes: mockState.removeMeetingMinutes,
    },
  }
})

import { createMeetingMinutes } from './meetingMinutesService'

/**
 * Cria fixture mínima de MeetingMinutesStorage para testes de serviço.
 */
function makeStorage(
  data: string,
  overrides?: Partial<MeetingMinutesStorage['cabecalho']>
): MeetingMinutesStorage {
  return {
    cabecalho: {
      numero: 'ATA-100',
      data,
      tipo: 'Ordinária',
      titulo: 'Acompanhamento Semanal',
      responsavel: 'PMO',
      projeto: 'Projeto X',
      contrato: 'CTR-1',
      ...overrides,
    },
    attendance: [],
    itens: [],
  }
}

function seedAta(id: string, storage: MeetingMinutesStorage, arquivada = false): void {
  mockState.ids.push(id)
  mockState.records.push({
    id,
    data: {
      ...storage,
      createdAt: '2026-04-01T10:00:00.000Z',
      updatedAt: '2026-04-01T10:00:00.000Z',
      arquivada,
    },
  })
}

describe('meetingMinutesService', () => {
  beforeEach(() => {
    mockState.records.length = 0
    mockState.ids.length = 0
    mockState.saveMeetingMinutes.mockClear()
    mockState.getAllMeetingMinutes.mockClear()
    mockState.getMeetingMinutes.mockClear()
  })

  it('arquiva atas anteriores com mesma chave de negócio', () => {
    seedAta('ata-antiga', makeStorage('2026-04-01'))
    seedAta('ata-mais-antiga', makeStorage('2026-03-15'))

    const nova = createMeetingMinutes(makeStorage('2026-04-10'))

    const antiga = mockState.records.find((r) => r.id === 'ata-antiga')?.data
    const maisAntiga = mockState.records.find((r) => r.id === 'ata-mais-antiga')?.data

    expect(nova.id).toMatch(/^ata-/)
    expect(antiga?.arquivada).toBe(true)
    expect(maisAntiga?.arquivada).toBe(true)
  })

  it('não arquiva atas com contrato diferente ou já arquivadas', () => {
    seedAta('ata-contrato-diferente', makeStorage('2026-04-01', { contrato: 'CTR-2' }))
    seedAta('ata-ja-arquivada', makeStorage('2026-04-01'), true)

    createMeetingMinutes(makeStorage('2026-04-10'))

    const diffContract = mockState.records.find((r) => r.id === 'ata-contrato-diferente')?.data
    const alreadyArchived = mockState.records.find((r) => r.id === 'ata-ja-arquivada')?.data

    expect(diffContract?.arquivada).not.toBe(true)
    expect(alreadyArchived?.arquivada).toBe(true)
  })

  it('não arquiva atas de data igual ou mais nova (comparação local de YYYY-MM-DD)', () => {
    seedAta('ata-mesma-data', makeStorage('2026-04-10'))
    seedAta('ata-mais-nova', makeStorage('2026-04-11'))

    createMeetingMinutes(makeStorage('2026-04-10'))

    const sameDate = mockState.records.find((r) => r.id === 'ata-mesma-data')?.data
    const newer = mockState.records.find((r) => r.id === 'ata-mais-nova')?.data

    expect(sameDate?.arquivada).not.toBe(true)
    expect(newer?.arquivada).not.toBe(true)
  })
})
