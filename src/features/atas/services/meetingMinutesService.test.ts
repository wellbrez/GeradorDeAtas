import { beforeEach, describe, expect, it } from 'vitest'
import type { MeetingMinutesStorage } from '../../../types'
import { storageService } from '../../../services/storage'
import { createMeetingMinutes } from './meetingMinutesService'

interface SeedAtaOptions {
  id: string
  data: string
  contrato?: string
  arquivada?: boolean
}

function buildStorage(overrides?: Partial<MeetingMinutesStorage>): MeetingMinutesStorage {
  return {
    cabecalho: {
      numero: '001',
      data: '2026-03-11',
      tipo: 'Reunião de Acompanhamento',
      titulo: 'Status Projeto',
      responsavel: 'Ana',
      projeto: 'Projeto A',
      contrato: 'CT-001',
      ...overrides?.cabecalho,
    },
    attendance: overrides?.attendance ?? [],
    itens: overrides?.itens ?? [],
  }
}

function seedAta({ id, data, contrato, arquivada }: SeedAtaOptions): void {
  storageService.saveMeetingMinutes(id, {
    cabecalho: {
      numero: `N-${id}`,
      data,
      tipo: 'Reunião de Acompanhamento',
      titulo: 'Status Projeto',
      responsavel: 'Ana',
      projeto: 'Projeto A',
      ...(contrato !== undefined ? { contrato } : {}),
    },
    attendance: [],
    itens: [],
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-03-01T10:00:00.000Z',
    ...(arquivada ? { arquivada: true } : {}),
  })
}

describe('createMeetingMinutes', () => {
  beforeEach(() => {
    storageService.clearAll()
  })

  it('archives only older matching minutes by title/type/project/contract', () => {
    seedAta({ id: 'old-matching', data: '2026-03-10', contrato: 'CT-001' })
    seedAta({ id: 'newer-matching', data: '2026-03-12', contrato: 'CT-001' })
    seedAta({ id: 'old-other-contract', data: '2026-03-09', contrato: 'CT-999' })
    seedAta({ id: 'already-archived', data: '2026-03-08', contrato: 'CT-001', arquivada: true })

    createMeetingMinutes(
      buildStorage({
        cabecalho: {
          numero: '100',
          data: '2026-03-11',
          tipo: 'Reunião de Acompanhamento',
          titulo: 'Status Projeto',
          responsavel: 'Ana',
          projeto: 'Projeto A',
          contrato: 'CT-001',
        },
      })
    )

    const oldMatching = storageService.getMeetingMinutes('old-matching') as { arquivada?: boolean } | null
    const newerMatching = storageService.getMeetingMinutes('newer-matching') as { arquivada?: boolean } | null
    const oldOtherContract = storageService.getMeetingMinutes('old-other-contract') as {
      arquivada?: boolean
    } | null
    const alreadyArchived = storageService.getMeetingMinutes('already-archived') as {
      arquivada?: boolean
    } | null

    expect(oldMatching?.arquivada).toBe(true)
    expect(newerMatching?.arquivada).not.toBe(true)
    expect(oldOtherContract?.arquivada).not.toBe(true)
    expect(alreadyArchived?.arquivada).toBe(true)
  })

  it('treats missing optional contract as empty value for archive matching', () => {
    seedAta({ id: 'old-without-contract', data: '2026-03-01' })

    createMeetingMinutes(
      buildStorage({
        cabecalho: {
          numero: '200',
          data: '2026-03-02',
          tipo: 'Reunião de Acompanhamento',
          titulo: 'Status Projeto',
          responsavel: 'Ana',
          projeto: 'Projeto A',
          contrato: '',
        },
      })
    )

    const archived = storageService.getMeetingMinutes('old-without-contract') as {
      arquivada?: boolean
    } | null

    expect(archived?.arquivada).toBe(true)
  })
})
