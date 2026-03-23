import type { MeetingMinutesStorage } from '@/types'

const mockStorageService = {
  getAllMeetingMinutes: vi.fn<() => string[]>(),
  getMeetingMinutes: vi.fn<(id: string) => unknown | null>(),
  saveMeetingMinutes: vi.fn<(id: string, data: unknown) => void>(),
  removeMeetingMinutes: vi.fn<(id: string) => void>(),
}

vi.mock('@services/storage', () => ({
  storageService: mockStorageService,
}))

let createMeetingMinutesFn: typeof import('./meetingMinutesService').createMeetingMinutes

function createStorageFixture(date: string, contrato?: string): MeetingMinutesStorage {
  return {
    cabecalho: {
      numero: '',
      data: date,
      tipo: 'Ordinária',
      titulo: 'Reunião de acompanhamento',
      responsavel: 'Ana',
      projeto: 'Projeto A',
      ...(contrato !== undefined ? { contrato } : {}),
    },
    attendance: [],
    itens: [],
  }
}

function createStoredAta(date: string, contrato?: string, arquivada?: boolean): Record<string, unknown> {
  return {
    cabecalho: {
      numero: 'ATA-OLD',
      data: date,
      tipo: 'Ordinária',
      titulo: 'Reunião de acompanhamento',
      responsavel: 'Ana',
      projeto: 'Projeto A',
      ...(contrato !== undefined ? { contrato } : {}),
    },
    attendance: [],
    itens: [],
    createdAt: '2026-03-20T10:00:00.000Z',
    updatedAt: '2026-03-20T10:00:00.000Z',
    ...(arquivada ? { arquivada: true } : {}),
  }
}

describe('meetingMinutesService.createMeetingMinutes', () => {
  beforeAll(async () => {
    const service = await import('./meetingMinutesService')
    createMeetingMinutesFn = service.createMeetingMinutes
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('arquiva atas anteriores compatíveis mesmo com contrato opcional vazio', () => {
    const storedById: Record<string, Record<string, unknown>> = {
      'old-no-contract': createStoredAta('2026-03-10'),
      'old-other-contract': createStoredAta('2026-03-10', 'CTR-OUTRO'),
      'old-already-archived': createStoredAta('2026-03-10', undefined, true),
    }

    mockStorageService.getAllMeetingMinutes.mockReturnValue([
      'old-no-contract',
      'old-other-contract',
      'old-already-archived',
    ])
    mockStorageService.getMeetingMinutes.mockImplementation((id: string) => storedById[id] ?? null)

    const created = createMeetingMinutesFn(createStorageFixture('2026-03-23'))

    const archiveCalls = mockStorageService.saveMeetingMinutes.mock.calls.filter(
      ([id, data]) =>
        id !== created.id &&
        typeof data === 'object' &&
        data !== null &&
        (data as { arquivada?: boolean }).arquivada === true
    )

    expect(archiveCalls).toHaveLength(1)
    expect(archiveCalls[0]?.[0]).toBe('old-no-contract')
    expect(mockStorageService.saveMeetingMinutes).toHaveBeenCalledWith(
      created.id,
      expect.objectContaining({
        cabecalho: expect.objectContaining({ data: '2026-03-23' }),
      })
    )
  })

  it('não arquiva atas com mesma chave quando data é igual ou posterior', () => {
    const storedById: Record<string, Record<string, unknown>> = {
      'same-day': createStoredAta('2026-03-23', 'CTR-1'),
      'newer-day': createStoredAta('2026-03-24', 'CTR-1'),
    }

    mockStorageService.getAllMeetingMinutes.mockReturnValue(['same-day', 'newer-day'])
    mockStorageService.getMeetingMinutes.mockImplementation((id: string) => storedById[id] ?? null)

    const created = createMeetingMinutesFn(createStorageFixture('2026-03-23', 'CTR-1'))

    const archiveCalls = mockStorageService.saveMeetingMinutes.mock.calls.filter(
      ([id, data]) =>
        id !== created.id &&
        typeof data === 'object' &&
        data !== null &&
        (data as { arquivada?: boolean }).arquivada === true
    )

    expect(archiveCalls).toHaveLength(0)
  })
})
