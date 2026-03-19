import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MeetingMinutes, MeetingMinutesStorage } from '@/types'

vi.mock('@services/storage', () => ({
  storageService: {
    getAllMeetingMinutes: vi.fn(),
    getMeetingMinutes: vi.fn(),
    saveMeetingMinutes: vi.fn(),
    removeMeetingMinutes: vi.fn(),
  },
}))

import { storageService } from '@services/storage'
import { createMeetingMinutes } from '@/features/atas/services/meetingMinutesService'

type StoredMeetingMinutes = Omit<MeetingMinutes, 'id'>

const baseStorage: MeetingMinutesStorage = {
  cabecalho: {
    numero: 'ATA-100',
    data: '2026-03-15',
    tipo: 'Reuniao de Acompanhamento',
    titulo: 'Status semanal',
    responsavel: 'Ana',
    projeto: 'Projeto X',
    contrato: '',
  },
  attendance: [],
  itens: [],
}

function buildStoredMeeting(
  cabecalhoPatch: Partial<MeetingMinutesStorage['cabecalho']>,
  createdAt: string,
  arquivada?: boolean
): StoredMeetingMinutes {
  return {
    cabecalho: {
      ...baseStorage.cabecalho,
      ...cabecalhoPatch,
    },
    attendance: [],
    itens: [],
    createdAt,
    updatedAt: createdAt,
    ...(arquivada ? { arquivada: true } : {}),
  }
}

describe('meetingMinutesService.createMeetingMinutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('arquiva atas anteriores da mesma chave quando a data e mais antiga', () => {
    const oldMatch = buildStoredMeeting(
      {
        data: '2026-03-10',
        contrato: undefined,
      },
      '2026-03-10T10:00:00.000Z'
    )
    const newMatchButFuture = buildStoredMeeting(
      {
        data: '2026-03-20',
        contrato: '',
      },
      '2026-03-20T10:00:00.000Z'
    )

    vi.mocked(storageService.getAllMeetingMinutes).mockReturnValue(['old-match', 'future-match'])
    vi.mocked(storageService.getMeetingMinutes).mockImplementation((id: string) => {
      if (id === 'old-match') return oldMatch
      if (id === 'future-match') return newMatchButFuture
      return null
    })

    createMeetingMinutes(baseStorage)

    const saveCalls = vi.mocked(storageService.saveMeetingMinutes).mock.calls
    const archivedCall = saveCalls.find(([id]) => id === 'old-match')
    const futureCall = saveCalls.find(([id]) => id === 'future-match')

    expect(archivedCall).toBeDefined()
    expect(archivedCall?.[1]).toMatchObject({ arquivada: true })
    expect(futureCall).toBeUndefined()
  })

  it('nao arquiva atas quando o contrato diverge', () => {
    const oldDifferentContract = buildStoredMeeting(
      {
        data: '2026-03-10',
        contrato: 'CON-999',
      },
      '2026-03-10T10:00:00.000Z'
    )

    vi.mocked(storageService.getAllMeetingMinutes).mockReturnValue(['old-different-contract'])
    vi.mocked(storageService.getMeetingMinutes).mockImplementation((id: string) => {
      if (id === 'old-different-contract') return oldDifferentContract
      return null
    })

    createMeetingMinutes(baseStorage)

    const saveCalls = vi.mocked(storageService.saveMeetingMinutes).mock.calls
    const archiveAttempt = saveCalls.find(([id]) => id === 'old-different-contract')

    expect(archiveAttempt).toBeUndefined()
    expect(saveCalls).toHaveLength(1)
  })
})
