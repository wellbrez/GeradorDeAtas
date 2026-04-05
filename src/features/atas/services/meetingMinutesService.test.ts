import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MeetingMinutesStorage } from '@/types'

vi.mock('@services/storage', () => ({
  storageService: {
    getAllMeetingMinutes: vi.fn(),
    getMeetingMinutes: vi.fn(),
    saveMeetingMinutes: vi.fn(),
    removeMeetingMinutes: vi.fn(),
    saveMeetingMinutesIds: vi.fn(),
    clearAll: vi.fn(),
    isAvailable: vi.fn(() => true),
    getDraft: vi.fn(() => null),
    saveDraft: vi.fn(),
    clearDraft: vi.fn(),
  },
}))

import { storageService } from '@services/storage'
import { createMeetingMinutes } from './meetingMinutesService'

type StoredMeeting = {
  cabecalho: MeetingMinutesStorage['cabecalho']
  attendance: MeetingMinutesStorage['attendance']
  itens: MeetingMinutesStorage['itens']
  createdAt: string
  updatedAt: string
  arquivada?: boolean
}

function buildStoredMeeting(data: string, overrides?: Partial<MeetingMinutesStorage['cabecalho']>): StoredMeeting {
  const now = new Date('2026-01-01T00:00:00.000Z').toISOString()
  return {
    cabecalho: {
      numero: '001',
      data,
      tipo: 'Operacional',
      titulo: 'Reunião semanal',
      responsavel: 'Responsável',
      projeto: 'Projeto Vale',
      ...overrides,
    },
    attendance: [],
    itens: [],
    createdAt: now,
    updatedAt: now,
  }
}

function buildStorageToCreate(data: string, overrides?: Partial<MeetingMinutesStorage['cabecalho']>): MeetingMinutesStorage {
  return {
    cabecalho: {
      numero: '',
      data,
      tipo: 'Operacional',
      titulo: 'Reunião semanal',
      responsavel: 'Responsável',
      projeto: 'Projeto Vale',
      ...overrides,
    },
    attendance: [],
    itens: [],
  }
}

describe('createMeetingMinutes', () => {
  let ids: string[]
  let byId: Record<string, StoredMeeting>

  beforeEach(() => {
    ids = []
    byId = {}

    vi.mocked(storageService.getAllMeetingMinutes).mockImplementation(() => [...ids])
    vi.mocked(storageService.getMeetingMinutes).mockImplementation((id: string) => byId[id] ?? null)
    vi.mocked(storageService.saveMeetingMinutes).mockImplementation((id: string, data: StoredMeeting) => {
      byId[id] = data
      if (!ids.includes(id)) ids.push(id)
    })
  })

  it('archives older meetings when key matches and contrato is empty for both', () => {
    byId = {
      oldMatch: buildStoredMeeting('2026-03-01'),
      newerMatch: buildStoredMeeting('2026-03-15'),
      otherProject: buildStoredMeeting('2026-03-01', { projeto: 'Projeto B' }),
    }
    ids = ['oldMatch', 'newerMatch', 'otherProject']

    createMeetingMinutes(buildStorageToCreate('2026-03-10'))

    expect(byId.oldMatch.arquivada).toBe(true)
    expect(byId.newerMatch.arquivada).toBeUndefined()
    expect(byId.otherProject.arquivada).toBeUndefined()
  })

  it('archives only meetings with the same contrato when contrato is provided', () => {
    byId = {
      sameContrato: buildStoredMeeting('2026-03-01', { contrato: 'CT-1' }),
      noContrato: buildStoredMeeting('2026-03-01'),
      otherContrato: buildStoredMeeting('2026-03-01', { contrato: 'CT-2' }),
    }
    ids = ['sameContrato', 'noContrato', 'otherContrato']

    createMeetingMinutes(buildStorageToCreate('2026-03-10', { contrato: 'CT-1' }))

    expect(byId.sameContrato.arquivada).toBe(true)
    expect(byId.noContrato.arquivada).toBeUndefined()
    expect(byId.otherContrato.arquivada).toBeUndefined()
  })
})
