import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MeetingMinutesStorage } from '@/types'

const storageState = vi.hoisted(() => {
  const saved = new Map<string, Record<string, unknown>>()
  const ids: string[] = []
  return { saved, ids }
})

vi.mock('@services/storage', () => ({
  storageService: {
    getAllMeetingMinutes: vi.fn(() => [...storageState.ids]),
    getMeetingMinutes: vi.fn((id: string) => storageState.saved.get(id) ?? null),
    saveMeetingMinutes: vi.fn((id: string, data: Record<string, unknown>) => {
      storageState.saved.set(id, data)
      if (!storageState.ids.includes(id)) {
        storageState.ids.push(id)
      }
    }),
    removeMeetingMinutes: vi.fn((id: string) => {
      storageState.saved.delete(id)
      const idx = storageState.ids.indexOf(id)
      if (idx >= 0) storageState.ids.splice(idx, 1)
    }),
  },
}))

import { createMeetingMinutes } from './meetingMinutesService'

function buildStorage(data: string, contrato = 'CT-001'): MeetingMinutesStorage {
  return {
    cabecalho: {
      numero: '001',
      data,
      tipo: 'Ordinária',
      titulo: 'Status Semanal',
      responsavel: 'Maria',
      projeto: 'Projeto A',
      contrato,
    },
    attendance: [],
    itens: [],
  }
}

describe('meetingMinutesService/createMeetingMinutes archive behavior', () => {
  beforeEach(() => {
    storageState.saved.clear()
    storageState.ids.splice(0, storageState.ids.length)
    vi.clearAllMocks()
  })

  it('archives only older meetings with same key (including contrato)', () => {
    const oldStorage = buildStorage('2026-03-10', 'CT-001')
    const oldCreated = createMeetingMinutes(oldStorage)

    const sameDateStorage = buildStorage('2026-03-15', 'CT-001')
    const sameDateCreated = createMeetingMinutes(sameDateStorage)

    const otherContractStorage = buildStorage('2026-03-01', 'CT-999')
    const otherContractCreated = createMeetingMinutes(otherContractStorage)

    const newStorage = buildStorage('2026-03-15', 'CT-001')
    const newCreated = createMeetingMinutes(newStorage)

    const oldAfter = storageState.saved.get(oldCreated.id) as { arquivada?: boolean }
    const sameDateAfter = storageState.saved.get(sameDateCreated.id) as { arquivada?: boolean }
    const otherContractAfter = storageState.saved.get(otherContractCreated.id) as { arquivada?: boolean }
    const newAfter = storageState.saved.get(newCreated.id) as { arquivada?: boolean }

    expect(oldAfter.arquivada).toBe(true)
    expect(sameDateAfter.arquivada).not.toBe(true)
    expect(otherContractAfter.arquivada).not.toBe(true)
    expect(newAfter.arquivada).not.toBe(true)
  })

  it('does not archive meetings when new date is earlier', () => {
    const recentStorage = buildStorage('2026-03-20', 'CT-001')
    const recentCreated = createMeetingMinutes(recentStorage)

    const earlierStorage = buildStorage('2026-03-10', 'CT-001')
    createMeetingMinutes(earlierStorage)

    const recentAfter = storageState.saved.get(recentCreated.id) as { arquivada?: boolean }
    expect(recentAfter.arquivada).not.toBe(true)
  })
})
