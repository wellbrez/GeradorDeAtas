import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createMeetingMinutes } from './meetingMinutesService'
import type { Cabecalho, MeetingMinutesStorage } from '@/types'

const IDS_KEY = 'atas-reuniao-meeting-minutes'

interface LocalStorageMock extends Storage {
  dump: () => Record<string, string>
}

interface SeedAtaOptions {
  id: string
  data: string
  contrato?: string
  titulo?: string
  tipo?: string
  projeto?: string
  arquivada?: boolean
}

function ataStorageKey(id: string): string {
  return `atas-reuniao-ata-${id}`
}

function createLocalStorageMock(): LocalStorageMock {
  const store = new Map<string, string>()

  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
    dump() {
      return Object.fromEntries(store.entries())
    },
  }
}

function buildCabecalho({
  data,
  contrato,
  titulo = 'Alinhamento Semanal',
  tipo = 'Reunião',
  projeto = 'Projeto Ferrovia',
}: {
  data: string
  contrato?: string
  titulo?: string
  tipo?: string
  projeto?: string
}): Cabecalho {
  const cabecalho: Cabecalho = {
    numero: '001',
    data,
    tipo,
    titulo,
    responsavel: 'Coordenação',
    projeto,
  }

  if (contrato !== undefined) {
    cabecalho.contrato = contrato
  }

  return cabecalho
}

function buildStorage(overrides?: {
  data?: string
  contrato?: string
  titulo?: string
  tipo?: string
  projeto?: string
}): MeetingMinutesStorage {
  return {
    cabecalho: buildCabecalho({
      data: overrides?.data ?? '2026-03-10',
      contrato: overrides?.contrato,
      titulo: overrides?.titulo,
      tipo: overrides?.tipo,
      projeto: overrides?.projeto,
    }),
    attendance: [],
    itens: [],
  }
}

function readAta(id: string): Record<string, unknown> {
  const raw = localStorage.getItem(ataStorageKey(id))
  if (!raw) {
    throw new Error(`Ata ${id} não encontrada no storage de teste`)
  }
  return JSON.parse(raw) as Record<string, unknown>
}

function seedAta(options: SeedAtaOptions): void {
  const ata: Record<string, unknown> = {
    cabecalho: buildCabecalho({
      data: options.data,
      contrato: options.contrato,
      titulo: options.titulo,
      tipo: options.tipo,
      projeto: options.projeto,
    }),
    attendance: [],
    itens: [],
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
  }

  if (options.arquivada) {
    ata.arquivada = true
  }

  localStorage.setItem(ataStorageKey(options.id), JSON.stringify(ata))
  const ids = JSON.parse(localStorage.getItem(IDS_KEY) ?? '[]') as string[]
  ids.push(options.id)
  localStorage.setItem(IDS_KEY, JSON.stringify(ids))
}

describe('meetingMinutesService.createMeetingMinutes', () => {
  beforeEach(() => {
    const storageMock = createLocalStorageMock()
    Object.defineProperty(globalThis, 'localStorage', {
      value: storageMock,
      configurable: true,
      writable: true,
    })
    vi.spyOn(Date, 'now').mockReturnValue(1760000000000)
    vi.spyOn(Math, 'random').mockReturnValue(0.314159265)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('arquiva somente atas anteriores com mesma chave composta', () => {
    seedAta({ id: 'old-match', data: '2026-03-09', contrato: 'CTR-100', titulo: '  Alinhamento Semanal  ' })
    seedAta({ id: 'same-key-newer', data: '2026-03-11', contrato: 'CTR-100' })
    seedAta({ id: 'different-contract', data: '2026-03-01', contrato: 'CTR-999' })
    seedAta({ id: 'already-archived', data: '2026-03-01', contrato: 'CTR-100', arquivada: true })

    const created = createMeetingMinutes(buildStorage({ data: '2026-03-10', contrato: 'CTR-100', titulo: 'Alinhamento Semanal' }))

    expect(readAta('old-match').arquivada).toBe(true)
    expect(readAta('same-key-newer').arquivada).toBeUndefined()
    expect(readAta('different-contract').arquivada).toBeUndefined()
    expect(readAta('already-archived').arquivada).toBe(true)
    expect(readAta(created.id).arquivada).toBeUndefined()
  })

  it('considera contrato ausente como string vazia no match', () => {
    seedAta({ id: 'old-without-contract', data: '2026-03-08' })
    seedAta({ id: 'old-with-contract', data: '2026-03-08', contrato: 'CTR-200' })

    createMeetingMinutes(buildStorage({ data: '2026-03-10' }))

    expect(readAta('old-without-contract').arquivada).toBe(true)
    expect(readAta('old-with-contract').arquivada).toBeUndefined()
  })

  it('não arquiva ata com mesma data da nova ata', () => {
    seedAta({ id: 'same-date', data: '2026-03-10', contrato: 'CTR-300' })

    createMeetingMinutes(buildStorage({ data: '2026-03-10', contrato: 'CTR-300' }))

    expect(readAta('same-date').arquivada).toBeUndefined()
  })
})
