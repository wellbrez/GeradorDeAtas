import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Cabecalho, MeetingMinutesStorage } from '@/types'
import { storageService } from '@services/storage'
import { createMeetingMinutes, getMeetingMinutesById } from './meetingMinutesService'

function buildCabecalho(data: string, contrato?: string): Cabecalho {
  return {
    numero: 'ATA-001',
    data,
    tipo: 'Kick-Off',
    titulo: 'Status semanal',
    responsavel: 'Joana',
    projeto: 'Projeto Norte',
    ...(contrato !== undefined ? { contrato } : {}),
  }
}

function buildStorage(data: string, contrato?: string): MeetingMinutesStorage {
  return {
    cabecalho: buildCabecalho(data, contrato),
    attendance: [],
    itens: [],
  }
}

function seedMeetingMinutes(id: string, data: string, contrato?: string, arquivada = false): void {
  const now = new Date().toISOString()
  storageService.saveMeetingMinutes(id, {
    cabecalho: buildCabecalho(data, contrato),
    attendance: [],
    itens: [],
    createdAt: now,
    updatedAt: now,
    arquivada,
  })
}

describe('createMeetingMinutes archive behavior', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    localStorage.clear()
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    errorSpy.mockRestore()
    localStorage.clear()
  })

  it('archives only older records that match title/type/project/contract', () => {
    seedMeetingMinutes('old-match', '2026-03-01', 'CTR-1')
    seedMeetingMinutes('old-other-contract', '2026-03-01', 'CTR-2')
    seedMeetingMinutes('newer-match', '2026-03-20', 'CTR-1')
    seedMeetingMinutes('already-archived', '2026-03-01', 'CTR-1', true)

    createMeetingMinutes(buildStorage('2026-03-10', 'CTR-1'))

    expect(getMeetingMinutesById('old-match')?.arquivada).toBe(true)
    expect(getMeetingMinutesById('old-other-contract')?.arquivada).not.toBe(true)
    expect(getMeetingMinutesById('newer-match')?.arquivada).not.toBe(true)
    expect(getMeetingMinutesById('already-archived')?.arquivada).toBe(true)
  })

  it('treats optional contract as empty when matching archive key', () => {
    seedMeetingMinutes('old-no-contract', '2026-02-01')

    createMeetingMinutes(buildStorage('2026-02-15'))

    expect(getMeetingMinutesById('old-no-contract')?.arquivada).toBe(true)
  })

  it('does not archive records with the same meeting day', () => {
    seedMeetingMinutes('same-day', '2026-04-10', 'CTR-1')

    createMeetingMinutes(buildStorage('2026-04-10', 'CTR-1'))

    expect(getMeetingMinutesById('same-day')?.arquivada).not.toBe(true)
  })
})
