/**
 * Serviço de gerenciamento de localStorage
 * Fornece funções para salvar, recuperar e gerenciar dados no localStorage
 */

const STORAGE_KEY_PREFIX = 'atas-reuniao-'
const STORAGE_KEY_MEETING_MINUTES = `${STORAGE_KEY_PREFIX}meeting-minutes`

/**
 * Erro customizado para operações de storage
 */
export class StorageError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'StorageError'
  }
}

/**
 * Verifica se o localStorage está disponível
 */
function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

/**
 * Obtém um item do localStorage
 */
function getItem<T>(key: string): T | null {
  if (!isStorageAvailable()) {
    throw new StorageError('localStorage não está disponível', 'STORAGE_UNAVAILABLE')
  }

  try {
    const item = localStorage.getItem(key)
    if (!item) return null
    return JSON.parse(item) as T
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new StorageError(`Erro ao fazer parse do item ${key}`, 'PARSE_ERROR')
    }
    throw new StorageError(`Erro ao ler item ${key}`, 'READ_ERROR')
  }
}

/**
 * Salva um item no localStorage
 */
function setItem<T>(key: string, value: T): void {
  if (!isStorageAvailable()) {
    throw new StorageError('localStorage não está disponível', 'STORAGE_UNAVAILABLE')
  }

  try {
    const serialized = JSON.stringify(value)
    localStorage.setItem(key, serialized)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      throw new StorageError('Espaço de armazenamento excedido', 'QUOTA_EXCEEDED')
    }
    throw new StorageError(`Erro ao salvar item ${key}`, 'WRITE_ERROR')
  }
}

/**
 * Remove um item do localStorage
 */
function removeItem(key: string): void {
  if (!isStorageAvailable()) {
    throw new StorageError('localStorage não está disponível', 'STORAGE_UNAVAILABLE')
  }

  try {
    localStorage.removeItem(key)
  } catch (error) {
    throw new StorageError(`Erro ao remover item ${key}`, 'DELETE_ERROR')
  }
}

/**
 * Limpa todos os itens do storage do aplicativo
 */
function clear(): void {
  if (!isStorageAvailable()) {
    throw new StorageError('localStorage não está disponível', 'STORAGE_UNAVAILABLE')
  }

  try {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(STORAGE_KEY_PREFIX))
    keys.forEach(key => localStorage.removeItem(key))
  } catch (error) {
    throw new StorageError('Erro ao limpar storage', 'CLEAR_ERROR')
  }
}

/**
 * Serviço de storage para atas de reunião
 */
export const storageService = {
  /**
   * Obtém todas as atas armazenadas
   */
  getAllMeetingMinutes(): string[] {
    try {
      const data = getItem<string[]>(STORAGE_KEY_MEETING_MINUTES)
      return data || []
    } catch (error) {
      console.error('Erro ao recuperar atas:', error)
      return []
    }
  },

  /**
   * Salva uma lista de IDs de atas
   */
  saveMeetingMinutesIds(ids: string[]): void {
    try {
      setItem(STORAGE_KEY_MEETING_MINUTES, ids)
    } catch (error) {
      if (error instanceof StorageError && error.code === 'QUOTA_EXCEEDED') {
        throw new StorageError(
          'Espaço de armazenamento excedido. Por favor, exclua algumas atas antigas.',
          'QUOTA_EXCEEDED'
        )
      }
      throw error
    }
  },

  /**
   * Obtém uma ata específica pelo ID
   */
  getMeetingMinutes(id: string): any | null {
    try {
      return getItem(`${STORAGE_KEY_PREFIX}ata-${id}`)
    } catch (error) {
      console.error(`Erro ao recuperar ata ${id}:`, error)
      return null
    }
  },

  /**
   * Salva uma ata
   */
  saveMeetingMinutes(id: string, data: any): void {
    try {
      setItem(`${STORAGE_KEY_PREFIX}ata-${id}`, data)
      
      // Atualiza a lista de IDs
      const ids = this.getAllMeetingMinutes()
      if (!ids.includes(id)) {
        ids.push(id)
        this.saveMeetingMinutesIds(ids)
      }
    } catch (error) {
      if (error instanceof StorageError && error.code === 'QUOTA_EXCEEDED') {
        throw new StorageError(
          'Espaço de armazenamento excedido. Por favor, exclua algumas atas antigas.',
          'QUOTA_EXCEEDED'
        )
      }
      throw error
    }
  },

  /**
   * Remove uma ata
   */
  removeMeetingMinutes(id: string): void {
    try {
      removeItem(`${STORAGE_KEY_PREFIX}ata-${id}`)
      
      // Remove da lista de IDs
      const ids = this.getAllMeetingMinutes().filter(storedId => storedId !== id)
      this.saveMeetingMinutesIds(ids)
    } catch (error) {
      console.error(`Erro ao remover ata ${id}:`, error)
      throw error
    }
  },

  /**
   * Limpa todo o storage
   */
  clearAll(): void {
    try {
      clear()
    } catch (error) {
      console.error('Erro ao limpar storage:', error)
      throw error
    }
  },

  /**
   * Verifica se o storage está disponível
   */
  isAvailable(): boolean {
    return isStorageAvailable()
  },
}
