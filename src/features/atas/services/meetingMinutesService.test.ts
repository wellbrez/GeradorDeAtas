import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MeetingMinutesStorage } from '@/types'
import { createMeetingMinutes } from './meetingMinutesService'

type StoredMeetingMinutesData = {
  cabecalho: MeetingMinutesStorage['cabecalho']
  attendance: MeetingMinutesStorage['attendance']
  itens: MeetingMinutesStorage['itens']
  createdAt: string
  updatedAt: string
  arquivada?: boolean
}

type StorageServiceMock = {
  getAllMeetingMinutes: ReturnType<typeof vi.fn>
  getMeetingMinutes: ReturnType<typeof vi.fn>
  saveMeetingMinutes: ReturnType<typeof vi.fn>
}

const storageServiceMock = vi.hoisted<StorageServiceMock>(() => ({
  getAllMeetingMinutes: vi.fn(),
  getMeetingMinutes: vi.fn(),
  saveMeetingMinutes: vi.fn(),
}))

vi.mock('@services/storage', () => ({
  storageService: storageServiceMock,
}))

function baseStorage(data: string, contrato?: string): MeetingMinutesStorage {
  return {
    cabecalho: {
      numero: '001',
      data,
      tipo: 'Ordinária',
      titulo: 'Ata de Acompanhamento',
      responsavel: 'Pessoa Responsável',
      projeto: 'Projeto Vale',
      ...(contrato !== undefined ? { contrato } : {}),
    },
    attendance: [],
    itens: [],
  }
}

describe('createMeetingMinutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('archives only older meeting minutes with same key (including contrato)', () => {
    const records: Record<string, StoredMeetingMinutesData> = {
      'old-match': {
        ...baseStorage('2026-03-10', 'CTR-1'),
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-03-10T10:00:00.000Z',
      },
      'old-different-contract': {
        ...baseStorage('2026-03-10', 'CTR-2'),
        createdAt: '2026-03-10T11:00:00.000Z',
        updatedAt: '2026-03-10T11:00:00.000Z',
      },
      'newer-same-contract': {
        ...baseStorage('2026-03-20', 'CTR-1'),
        createdAt: '2026-03-20T11:00:00.000Z',
        updatedAt: '2026-03-20T11:00:00.000Z',
      },
      'already-archived': {
        ...baseStorage('2026-03-01', 'CTR-1'),
        createdAt: '2026-03-01T10:00:00.000Z',
        updatedAt: '2026-03-01T10:00:00.000Z',
        arquivada: true,
      },
    }

    storageServiceMock.getAllMeetingMinutes.mockImplementation(
      (): string[] => Object.keys(records)
    )
    storageServiceMock.getMeetingMinutes.mockImplementation(
      (id: string): StoredMeetingMinutesData | null => records[id] ?? null
    )
    storageServiceMock.saveMeetingMinutes.mockImplementation(
      (id: string, data: StoredMeetingMinutesData): void => {
        records[id] = data
      }
    )

    const created = createMeetingMinutes(baseStorage('2026-03-15', 'CTR-1'))

    expect(created.id).toMatch(/^ata-/)
    expect(records['old-match']?.arquivada).toBe(true)
    expect(records['old-different-contract']?.arquivada).toBeUndefined()
    expect(records['newer-same-contract']?.arquivada).toBeUndefined()
    expect(records['already-archived']?.arquivada).toBe(true)
    expect(storageServiceMock.saveMeetingMinutes).toHaveBeenCalledWith(
      created.id,
      expect.objectContaining({
        cabecalho: expect.objectContaining({ contrato: 'CTR-1' }),
      })
    )
  })

  it('treats missing contrato as empty string when archiving previous versions', () => {
    const records: Record<string, StoredMeetingMinutesData> = {
      'old-no-contract': {
        ...baseStorage('2026-03-02'),
        createdAt: '2026-03-02T10:00:00.000Z',
        updatedAt: '2026-03-02T10:00:00.000Z',
      },
    }

    storageServiceMock.getAllMeetingMinutes.mockImplementation(
      (): string[] => Object.keys(records)
    )
    storageServiceMock.getMeetingMinutes.mockImplementation(
      (id: string): StoredMeetingMinutesData | null => records[id] ?? null
    )
    storageServiceMock.saveMeetingMinutes.mockImplementation(
      (id: string, data: StoredMeetingMinutesData): void => {
        records[id] = data
      }
    )

    createMeetingMinutes(baseStorage('2026-03-10'))

    expect(records['old-no-contract']?.arquivada).toBe(true)
  })
})
