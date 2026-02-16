/**
 * Serviço de gerenciamento de atas de reunião
 */
import { storageService } from '@services/storage'
import type { MeetingMinutes, MeetingMinutesStorage, Item, Participant, HistoricoItem } from '@/types'

/**
 * Gera um ID único para uma nova ata
 */
function generateId(): string {
  return `ata-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Obtém todas as atas
 */
export function getAllMeetingMinutes(): MeetingMinutes[] {
  try {
    const ids = storageService.getAllMeetingMinutes()
    const atas: MeetingMinutes[] = []

    for (const id of ids) {
      const data = storageService.getMeetingMinutes(id)
      if (data) {
        atas.push({
          id,
          ...data,
        })
      }
    }

    // Ordena por data de criação (mais recente primeiro)
    return atas.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return dateB - dateA
    })
  } catch (error) {
    console.error('Erro ao obter todas as atas:', error)
    return []
  }
}

/**
 * Obtém uma ata pelo ID
 */
export function getMeetingMinutesById(id: string): MeetingMinutes | null {
  try {
    const data = storageService.getMeetingMinutes(id)
    if (!data) return null

    return {
      id,
      ...data,
    }
  } catch (error) {
    console.error(`Erro ao obter ata ${id}:`, error)
    return null
  }
}

/**
 * Cria uma nova ata
 */
export function createMeetingMinutes(
  storage: MeetingMinutesStorage
): MeetingMinutes {
  const id = generateId()
  const now = new Date().toISOString()

  const meetingMinutes: MeetingMinutes = {
    id,
    ...storage,
    createdAt: now,
    updatedAt: now,
  }

  try {
    storageService.saveMeetingMinutes(id, {
      cabecalho: storage.cabecalho,
      attendance: storage.attendance,
      itens: storage.itens,
      createdAt: meetingMinutes.createdAt,
      updatedAt: meetingMinutes.updatedAt,
    })
    return meetingMinutes
  } catch (error) {
    console.error('Erro ao criar ata:', error)
    throw error
  }
}

/**
 * Atualiza uma ata existente
 */
export function updateMeetingMinutes(
  id: string,
  storage: MeetingMinutesStorage
): MeetingMinutes | null {
  try {
    const existing = storageService.getMeetingMinutes(id)
    if (!existing) {
      throw new Error(`Ata ${id} não encontrada`)
    }

    const updated: MeetingMinutes = {
      id,
      ...storage,
      createdAt: existing.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const existingData = existing as Record<string, unknown>
    storageService.saveMeetingMinutes(id, {
      cabecalho: storage.cabecalho,
      attendance: storage.attendance,
      itens: storage.itens,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      arquivada: existingData.arquivada,
    })

    return updated
  } catch (error) {
    console.error(`Erro ao atualizar ata ${id}:`, error)
    throw error
  }
}

/**
 * Remove uma ata
 */
export function deleteMeetingMinutes(id: string): boolean {
  try {
    storageService.removeMeetingMinutes(id)
    return true
  } catch (error) {
    console.error(`Erro ao remover ata ${id}:`, error)
    return false
  }
}

/** Gera ID único para item/histórico na cópia */
function genCopyId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/** Copia array de histórico com novos IDs; garante UltimoHistorico válido mesmo com JSON malformado */
function copyHistorico(hist: HistoricoItem[] | undefined, fallbackUltimo: HistoricoItem | undefined): { historico: HistoricoItem[]; UltimoHistorico: HistoricoItem } {
  const arr = hist && Array.isArray(hist) ? hist : []
  const now = new Date().toISOString()
  const emptyResp = { nome: '', email: '' }
  const ultimoFonte = fallbackUltimo ?? arr[arr.length - 1]
  const base = ultimoFonte && typeof ultimoFonte === 'object'
    ? {
        descricao: ultimoFonte.descricao ?? '',
        responsavel: ultimoFonte.responsavel ? { ...ultimoFonte.responsavel } : emptyResp,
        data: ultimoFonte.data ?? null,
        status: (ultimoFonte.status ?? 'Pendente') as HistoricoItem['status'],
      }
    : { descricao: '', responsavel: emptyResp, data: null as string | null, status: 'Pendente' as const }

  if (arr.length === 0) {
    const unico: HistoricoItem = { id: genCopyId('hist'), criadoEm: now, ...base }
    return { historico: [unico], UltimoHistorico: unico }
  }

  const historico: HistoricoItem[] = arr.map((h) => ({
    id: genCopyId('hist'),
    criadoEm: h.criadoEm ?? now,
    descricao: h.descricao ?? '',
    responsavel: h.responsavel ? { ...h.responsavel } : emptyResp,
    data: h.data ?? null,
    status: (h.status ?? 'Pendente') as HistoricoItem['status'],
  }))
  const UltimoHistorico = historico[historico.length - 1]!
  return { historico, UltimoHistorico }
}

/**
 * Copia uma ata (cria nova baseada em existente), preservando hierarquia e histórico completo.
 * Se a fonte tiver itens com id duplicado (ex.: JSON importado), cada item recebe ID único na cópia;
 * referências pai/filhos usam o primeiro id encontrado para aquele valor.
 */
export function copyMeetingMinutes(sourceId: string): MeetingMinutes | null {
  try {
    const source = getMeetingMinutesById(sourceId)
    if (!source) {
      throw new Error(`Ata ${sourceId} não encontrada`)
    }

    const newIdsByIndex = source.itens.map(() => genCopyId('item'))
    const firstNewIdByOldId: Record<string, string> = {}
    source.itens.forEach((item: Item, i: number) => {
      if (firstNewIdByOldId[item.id] === undefined) {
        firstNewIdByOldId[item.id] = newIdsByIndex[i]!
      }
    })

    const newItens = source.itens.map((item: Item, i: number) => {
      const newId = newIdsByIndex[i]!
      const { historico, UltimoHistorico } = copyHistorico(item.historico, item.UltimoHistorico)
      return {
        ...item,
        id: newId,
        pai: item.pai ? (firstNewIdByOldId[item.pai] ?? item.pai) : null,
        criadoEm: new Date().toISOString(),
        filhos: (item.filhos || []).map((oldId: string) => firstNewIdByOldId[oldId] ?? oldId),
        historico,
        UltimoHistorico,
      }
    })

    const newStorage: MeetingMinutesStorage = {
      cabecalho: {
        ...source.cabecalho,
        numero: '',
        data: new Date().toISOString().split('T')[0],
      },
      attendance: source.attendance.map((p: Participant) => ({ ...p })),
      itens: newItens,
    }

    return createMeetingMinutes(newStorage)
  } catch (error) {
    console.error(`Erro ao copiar ata ${sourceId}:`, error)
    throw error
  }
}

/**
 * Marca uma ata como arquivada (fixa). Usado quando a ata é copiada: a original fica arquivada.
 */
export function setAtaArquivada(id: string): void {
  try {
    const data = storageService.getMeetingMinutes(id) as Record<string, unknown> | null
    if (!data) return
    storageService.saveMeetingMinutes(id, { ...data, arquivada: true })
  } catch (error) {
    console.error(`Erro ao arquivar ata ${id}:`, error)
  }
}
