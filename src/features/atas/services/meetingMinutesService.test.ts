import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MeetingMinutesStorage } from '@/types'

type StoredAta = {
  cabecalho: MeetingMinutesStorage['cabecalho']
  attendance: MeetingMinutesStorage['attendance']
  itens: MeetingMinutesStorage['itens']
  createdAt?: string
  updatedAt?: string
  arquivada?: boolean
}

let storedById: Record<string, StoredAta> = {}
let storedIds: string[] = []

const storageServiceMock = vi.hoisted(() => ({
  getAllMeetingMinutes: vi.fn(() => [...storedIds]),
  getMeetingMinutes: vi.fn((id: string) => storedById[id] ?? null),
  saveMeetingMinutes: vi.fn((id: string, data: StoredAta) => {
    storedById[id] = JSON.parse(JSON.stringify(data)) as StoredAta
    if (!storedIds.includes(id)) {
      storedIds.push(id)
    }
  }),
  removeMeetingMinutes: vi.fn((id: string) => {
    delete storedById[id]
    storedIds = storedIds.filter((x) => x !== id)
  }),
}))

vi.mock('@services/storage', () => ({
  storageService: storageServiceMock,
}))

import { copyMeetingMinutes, createMeetingMinutes } from './meetingMinutesService'

function makeStorage(overrides?: Partial<MeetingMinutesStorage>): MeetingMinutesStorage {
  return {
    cabecalho: {
      numero: '001',
      data: '2026-03-25',
      tipo: 'Ordinaria',
      titulo: 'Planejamento',
      responsavel: 'Gestor',
      projeto: 'Projeto A',
      contrato: 'CTR-1',
      ...overrides?.cabecalho,
    },
    attendance: overrides?.attendance ?? [],
    itens: overrides?.itens ?? [],
  }
}

describe('meetingMinutesService (regression coverage)', () => {
  beforeEach(() => {
    storedById = {}
    storedIds = []
    storageServiceMock.getAllMeetingMinutes.mockClear()
    storageServiceMock.getMeetingMinutes.mockClear()
    storageServiceMock.saveMeetingMinutes.mockClear()
    storageServiceMock.removeMeetingMinutes.mockClear()
  })

  it('arquiva atas anteriores com mesma chave e data menor', () => {
    storedIds = ['old-1', 'old-2', 'old-3']
    storedById['old-1'] = {
      ...makeStorage({ cabecalho: { data: '2026-03-10' } }),
      createdAt: '2026-03-10T10:00:00.000Z',
      updatedAt: '2026-03-10T10:00:00.000Z',
      arquivada: false,
    }
    storedById['old-2'] = {
      ...makeStorage({ cabecalho: { data: '2026-03-30' } }),
      createdAt: '2026-03-30T10:00:00.000Z',
      updatedAt: '2026-03-30T10:00:00.000Z',
      arquivada: false,
    }
    storedById['old-3'] = {
      ...makeStorage({ cabecalho: { data: '2026-03-05', contrato: 'OUTRO' } }),
      createdAt: '2026-03-05T10:00:00.000Z',
      updatedAt: '2026-03-05T10:00:00.000Z',
      arquivada: false,
    }

    const created = createMeetingMinutes(
      makeStorage({
        cabecalho: {
          data: '2026-03-20',
          numero: '099',
        },
      })
    )

    expect(created.id).toContain('ata-')
    expect(storedById['old-1']?.arquivada).toBe(true)
    expect(storedById['old-2']?.arquivada).toBe(false)
    expect(storedById['old-3']?.arquivada).toBe(false)
  })

  it('copia ata com ids únicos, remapeia pai/filhos e cria histórico fallback para item malformado', () => {
    storedIds = ['source-1']
    storedById['source-1'] = {
      ...makeStorage({
        cabecalho: { data: '2026-03-01', numero: '010' },
        attendance: [
          { nome: 'Ana', email: 'ana@empresa.com', empresa: 'Vale', telefone: '11', presenca: 'P' },
        ],
        itens: [
          {
            id: 'dup',
            item: '1',
            nivel: 1,
            pai: null,
            filhos: ['dup', 'leaf'],
            criadoEm: '2026-03-01T10:00:00.000Z',
            historico: [
              {
                id: 'h1',
                criadoEm: '2026-03-01T10:00:00.000Z',
                descricao: 'pai',
                responsavel: { nome: 'Ana', email: 'ana@empresa.com' },
                data: '2026-03-02',
                status: 'Pendente',
              },
            ],
            UltimoHistorico: {
              id: 'h1',
              criadoEm: '2026-03-01T10:00:00.000Z',
              descricao: 'pai',
              responsavel: { nome: 'Ana', email: 'ana@empresa.com' },
              data: '2026-03-02',
              status: 'Pendente',
            },
          },
          {
            id: 'dup',
            item: '1.1',
            nivel: 2,
            pai: 'dup',
            filhos: [],
            criadoEm: '2026-03-01T10:00:00.000Z',
            historico: [],
            UltimoHistorico: {
              id: 'h2',
              criadoEm: '2026-03-01T10:00:00.000Z',
              descricao: '',
              responsavel: { nome: '', email: '' },
              data: null,
              status: 'Pendente',
            },
          },
          {
            id: 'leaf',
            item: '2',
            nivel: 1,
            pai: 'dup',
            filhos: [],
            criadoEm: '2026-03-01T10:00:00.000Z',
            historico: undefined as unknown as [],
            UltimoHistorico: undefined as unknown as never,
          },
        ],
      }),
      createdAt: '2026-03-01T10:00:00.000Z',
      updatedAt: '2026-03-01T10:00:00.000Z',
      arquivada: false,
    }

    const copied = copyMeetingMinutes('source-1')
    expect(copied).not.toBeNull()
    expect(copied?.id).toContain('ata-')
    expect(copied?.cabecalho.numero).toBe('')

    const copiedItems = copied!.itens
    const copiedIds = copiedItems.map((i) => i.id)
    expect(new Set(copiedIds).size).toBe(copiedIds.length)

    const firstId = copiedItems[0]!.id
    expect(copiedItems[1]!.pai).toBe(firstId)
    expect(copiedItems[2]!.pai).toBe(firstId)
    expect(copiedItems[0]!.filhos).toContain(copiedItems[2]!.id)

    const malformedCopied = copiedItems[2]!
    expect(malformedCopied.historico).toHaveLength(1)
    expect(malformedCopied.UltimoHistorico.status).toBe('Pendente')
    expect(malformedCopied.UltimoHistorico.descricao).toBe('')
    expect(malformedCopied.UltimoHistorico.responsavel).toEqual({ nome: '', email: '' })
  })
})
