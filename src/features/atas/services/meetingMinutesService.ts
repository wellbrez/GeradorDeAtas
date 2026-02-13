/**
 * Serviço de gerenciamento de atas de reunião
 */
import { storageService } from '@services/storage'
import type { MeetingMinutes, MeetingMinutesStorage } from '@types'

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

    storageService.saveMeetingMinutes(id, {
      cabecalho: storage.cabecalho,
      attendance: storage.attendance,
      itens: storage.itens,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
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

/**
 * Copia uma ata (cria nova baseada em existente)
 */
export function copyMeetingMinutes(sourceId: string): MeetingMinutes | null {
  try {
    const source = getMeetingMinutesById(sourceId)
    if (!source) {
      throw new Error(`Ata ${sourceId} não encontrada`)
    }

    // Cria nova ata com dados copiados, mas com nova data
    const newStorage: MeetingMinutesStorage = {
      cabecalho: {
        ...source.cabecalho,
        numero: '', // Número deve ser definido pelo usuário
        data: new Date().toISOString().split('T')[0], // Data atual
      },
      attendance: source.attendance.map((p) => ({ ...p })),
      itens: source.itens.map((item) => ({
        ...item,
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        criadoEm: new Date().toISOString(),
        historico: item.historico.map((h) => ({
          ...h,
          id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        })),
      })),
    }

    return createMeetingMinutes(newStorage)
  } catch (error) {
    console.error(`Erro ao copiar ata ${sourceId}:`, error)
    throw error
  }
}
