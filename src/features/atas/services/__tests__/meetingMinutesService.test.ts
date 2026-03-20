import { beforeEach, describe, expect, it } from 'vitest'

import type { MeetingMinutesStorage } from '@/types'
import {
  createMeetingMinutes,
  getMeetingMinutesById,
} from '@/features/atas/services/meetingMinutesService'
import { storageService } from '@services/storage'

function buildStorage(date: string, contrato?: string): MeetingMinutesStorage {
  return {
    cabecalho: {
      numero: '001',
      data: date,
      tipo: 'Semanal',
      titulo: 'Reuniao de Planejamento',
      responsavel: 'Responsavel Teste',
      projeto: 'Projeto A',
      ...(contrato !== undefined ? { contrato } : {}),
    },
    attendance: [],
    itens: [],
  }
}

describe('meetingMinutesService archivePreviousMeetingMinutes', () => {
  beforeEach(() => {
    storageService.clearAll()
  })

  it('archives older meeting with same business key when creating a newer one', () => {
    const older = createMeetingMinutes(buildStorage('2026-03-10', 'CT-100'))
    const newer = createMeetingMinutes(buildStorage('2026-03-12', 'CT-100'))

    const olderLoaded = getMeetingMinutesById(older.id)
    const newerLoaded = getMeetingMinutesById(newer.id)

    expect(olderLoaded?.arquivada).toBe(true)
    expect(newerLoaded?.arquivada).not.toBe(true)
  })

  it('does not archive meetings when contract differs', () => {
    const older = createMeetingMinutes(buildStorage('2026-03-10', 'CT-100'))
    createMeetingMinutes(buildStorage('2026-03-12', 'CT-200'))

    const olderLoaded = getMeetingMinutesById(older.id)

    expect(olderLoaded?.arquivada).not.toBe(true)
  })

  it('handles optional contract by treating missing values as equivalent', () => {
    const older = createMeetingMinutes(buildStorage('2026-03-10'))
    createMeetingMinutes(buildStorage('2026-03-12'))

    const olderLoaded = getMeetingMinutesById(older.id)

    expect(olderLoaded?.arquivada).toBe(true)
  })
})
