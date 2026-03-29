import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  copyMeetingMinutes,
  createMeetingMinutes,
  getMeetingMinutesById,
} from './meetingMinutesService'
import { storageService } from '@services/storage'
import type { HistoricoItem, Item, MeetingMinutesStorage } from '@/types'

function createHistorico(partial?: Partial<HistoricoItem>): HistoricoItem {
  return {
    id: partial?.id ?? 'hist-1',
    criadoEm: partial?.criadoEm ?? '2026-03-01T12:00:00.000Z',
    descricao: partial?.descricao ?? 'Descricao inicial',
    responsavel: partial?.responsavel ?? { nome: 'Responsavel', email: 'resp@vale.com' },
    data: partial?.data ?? '2026-03-05',
    status: partial?.status ?? 'Pendente',
  }
}

function createItem(partial?: Partial<Item>): Item {
  const ultimo = partial?.UltimoHistorico ?? createHistorico()
  return {
    id: partial?.id ?? 'item-1',
    item: partial?.item ?? '1',
    nivel: partial?.nivel ?? 1,
    pai: partial?.pai ?? null,
    filhos: partial?.filhos ?? [],
    criadoEm: partial?.criadoEm ?? '2026-03-01T12:00:00.000Z',
    historico: partial?.historico ?? [ultimo],
    UltimoHistorico: ultimo,
  }
}

function createStorage(params?: {
  data?: string
  contrato?: string
  titulo?: string
  tipo?: string
  projeto?: string
  itens?: Item[]
}): MeetingMinutesStorage {
  return {
    cabecalho: {
      numero: 'ATA-001',
      data: params?.data ?? '2026-03-01',
      tipo: params?.tipo ?? 'Ordinaria',
      titulo: params?.titulo ?? 'Status Semanal',
      responsavel: 'Lider',
      projeto: params?.projeto ?? 'Projeto A',
      contrato: params?.contrato ?? 'CTR-1',
    },
    attendance: [
      {
        nome: 'Participante 1',
        email: 'p1@vale.com',
        empresa: 'Vale',
        telefone: '0000-0000',
        presenca: 'P',
      },
    ],
    itens: params?.itens ?? [createItem()],
  }
}

describe('meetingMinutesService', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-29T10:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('arquiva atas anteriores quando chave e contrato são iguais e a data é mais antiga', () => {
    const antiga = createMeetingMinutes(createStorage({ data: '2026-03-10', contrato: 'CTR-1' }))
    const nova = createMeetingMinutes(createStorage({ data: '2026-03-20', contrato: 'CTR-1' }))

    const antigaSalva = getMeetingMinutesById(antiga.id)
    const novaSalva = getMeetingMinutesById(nova.id)

    expect(antigaSalva?.arquivada).toBe(true)
    expect(novaSalva?.arquivada).toBeUndefined()
  })

  it('não arquiva atas com contrato diferente ou com data não anterior', () => {
    const contratoDiferente = createMeetingMinutes(createStorage({ data: '2026-03-05', contrato: 'CTR-2' }))
    const maisNovaMesmoContrato = createMeetingMinutes(createStorage({ data: '2026-03-25', contrato: 'CTR-1' }))

    createMeetingMinutes(createStorage({ data: '2026-03-20', contrato: 'CTR-1' }))

    const ataContratoDiferente = getMeetingMinutesById(contratoDiferente.id)
    const ataMaisNovaMesmoContrato = getMeetingMinutesById(maisNovaMesmoContrato.id)

    expect(ataContratoDiferente?.arquivada).toBeUndefined()
    expect(ataMaisNovaMesmoContrato?.arquivada).toBeUndefined()
  })

  it('copia ata com IDs duplicados e histórico ausente de forma resiliente', () => {
    const sourceId = 'source-ata'
    storageService.saveMeetingMinutes(sourceId, {
      cabecalho: {
        numero: 'ATA-ORIG',
        data: '2026-03-10',
        tipo: 'Ordinaria',
        titulo: 'Ata com inconsistencias',
        responsavel: 'Lider',
        projeto: 'Projeto A',
        contrato: 'CTR-1',
      },
      attendance: [],
      itens: [
        {
          id: 'duplicado',
          item: '1',
          nivel: 1,
          pai: null,
          filhos: ['duplicado'],
          criadoEm: '2026-03-10T10:00:00.000Z',
        },
        {
          id: 'duplicado',
          item: '1.1',
          nivel: 2,
          pai: 'duplicado',
          filhos: [],
          criadoEm: '2026-03-10T10:00:00.000Z',
          historico: [createHistorico({ id: 'hist-original', descricao: 'Item filho' })],
          UltimoHistorico: createHistorico({ id: 'hist-original', descricao: 'Item filho' }),
        },
      ],
      createdAt: '2026-03-10T10:00:00.000Z',
      updatedAt: '2026-03-10T10:00:00.000Z',
    } as unknown as MeetingMinutesStorage)

    const copia = copyMeetingMinutes(sourceId)

    expect(copia).not.toBeNull()
    expect(copia?.cabecalho.numero).toBe('')
    expect(copia?.cabecalho.data).toBe('2026-03-29')
    expect(copia?.itens).toHaveLength(2)

    const [itemPai, itemFilho] = copia!.itens
    expect(itemPai.id).not.toBe(itemFilho.id)
    expect(itemFilho.pai).toBe(itemPai.id)

    expect(itemPai.historico).toHaveLength(1)
    expect(itemPai.UltimoHistorico.status).toBe('Pendente')
    expect(itemPai.UltimoHistorico.id).toBe(itemPai.historico[0]?.id)

    expect(itemFilho.historico).toHaveLength(1)
    expect(itemFilho.historico[0]?.id).not.toBe('hist-original')
    expect(itemFilho.UltimoHistorico.id).toBe(itemFilho.historico[0]?.id)
  })
})
