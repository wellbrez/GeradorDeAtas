/**
 * Types globais do sistema de atas de reunião
 */

/**
 * Status de um item de ata
 */
export type ItemStatus = 'Pendente' | 'Em Andamento' | 'Concluído' | 'Cancelado' | 'Info'

/**
 * Presença de um participante
 */
export type Presenca = 'P' | 'A' // Presente | Ausente

/**
 * Responsável por uma ação/item
 */
export interface Responsavel {
  email: string
  nome: string
}

/**
 * Entrada no histórico de um item
 */
export interface HistoricoItem {
  id: string
  criadoEm: string // ISO date string
  descricao: string
  responsavel: Responsavel
  data: string | null // ISO date string ou null
  status: ItemStatus
}

/**
 * Item de uma ata (pode ter sub-itens)
 */
export interface Item {
  id: string
  item: string // Numeração: "1", "1.1", "1.1.1"
  nivel: number // Nível hierárquico (1, 2, 3...)
  pai: string | null // ID do item pai, null se for raiz
  filhos: string[] // IDs dos itens filhos
  criadoEm: string // ISO date string
  historico: HistoricoItem[]
  UltimoHistorico: HistoricoItem // Último registro do histórico
}

/**
 * Participante de uma reunião
 */
export interface Participant {
  nome: string
  email: string
  empresa: string
  telefone: string
  presenca: Presenca
}

/**
 * Cabeçalho de uma ata
 */
export interface Cabecalho {
  numero: string
  data: string // ISO date string
  tipo: string
  titulo: string
  responsavel: string
  projeto: string
}

/**
 * Ata de reunião completa
 */
export interface MeetingMinutes {
  id: string
  cabecalho: Cabecalho
  attendance: Participant[]
  itens: Item[]
  createdAt: string // ISO date string
  updatedAt: string // ISO date string
  /** Quando true, a ata foi origem de uma cópia e fica fixa (somente leitura) */
  arquivada?: boolean
}

/**
 * Estrutura JSON armazenada no localStorage
 */
export interface MeetingMinutesStorage {
  cabecalho: Cabecalho
  attendance: Participant[]
  itens: Item[]
}

/**
 * Rascunho de ata (auto-save) para recuperação após fechamento inesperado
 * @see storageService.getDraft / saveDraft / clearDraft
 */
export interface DraftAta {
  storage: MeetingMinutesStorage
  currentStep: 1 | 2
  savedAt: string
  /** ID da ata em edição, ou null se for nova ata */
  existingAtaId: string | null
}
