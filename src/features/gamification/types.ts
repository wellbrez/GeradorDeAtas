/**
 * Tipos do módulo de gamificação.
 * Permite evolução futura (novos níveis, categorias de conquistas) sem quebrar compatibilidade.
 *
 * @module gamification/types
 */

/** Identificador único de uma conquista (imutável para compatibilidade com export/import) */
export type AchievementId = string

/** Identificador único de um upgrade na loja */
export type UpgradeId = string

/** Estado persistido de gamificação no browser */
export interface GamificationState {
  /** Conquistas desbloqueadas: id -> ISO date de desbloqueio */
  unlockedAchievements: Record<AchievementId, string>
  /** Última data usada para cálculo de streak (YYYY-MM-DD) */
  lastActivityDate: string | null
  /** Versão do schema para migrações futuras */
  schemaVersion: number
  /** Selos acumulados (nunca decai ao descartar atas; só sobe ao salvar ou pode diminuir ao comprar upgrades) */
  lifetimeSelos: number
  /** Quantidade de cada upgrade comprado */
  upgradesOwned: Record<UpgradeId, number>
}

/** Definição de um upgrade na loja (multiplicador de Selos por ata) */
export interface UpgradeDefinition {
  id: UpgradeId
  name: string
  description: string
  /** Chave do ícone (mapeada em UpgradeIcon) */
  icon: string
  /** Texto de lore / flavor para a loja */
  lore: string
  /** Só aparece na loja quando lifetimeSelos >= este valor */
  unlockAtLifetimeSelos: number
  /** Custo em Selos da primeira unidade */
  baseCost: number
  /** Multiplicador do custo por unidade já owned: cost = baseCost * costMultiplier^owned */
  costMultiplier: number
  /** Taxa por unidade para ganho exponencial: contribuição = (1 + rate)^owned */
  selosPerAtaPerUnit: number
}

/** Nível/título do usuário baseado em total de atas */
export interface LevelTier {
  id: string
  minAtas: number
  title: string
  subtitle: string
  icon: string
}

/** Definição de uma conquista (configurável; condições avaliadas no service) */
export interface AchievementDefinition {
  id: AchievementId
  name: string
  description: string
  icon: string
  category: 'ata' | 'itens' | 'participantes' | 'arquivo' | 'especial'
  /** Nome da condição; o service implementa o evaluator por nome */
  condition: AchievementConditionType
  /** Parâmetros opcionais (ex: minItens: 10) */
  params?: Record<string, number | string | boolean>
  /** Se true, descrição não é exibida até desbloquear */
  secret?: boolean
  /** Se false, não entra na contagem "X/Y conquistas" e não dá pontos; ex.: conquistas "não louváveis" */
  praiseworthy?: boolean
}

/** Tipos de condição suportados (escalável: adicionar novo tipo + evaluator) */
export type AchievementConditionType =
  | 'first_ata'
  | 'total_atas'
  | 'ata_with_min_items'
  | 'ata_all_items_with_responsible'
  | 'ata_min_participants'
  | 'first_archived'
  | 'ata_no_pendentes'
  | 'days_with_ata_in_month'
  | 'ata_with_min_itens'
  | 'total_itens_lifetime'
  | 'total_participants_lifetime'
  | 'streak_days'
  | 'atas_archived'
  | 'atas_in_one_day'
  | 'ata_with_exactly_n_items'
  | 'ata_saved_at_hour'
  | 'monthly_atas'
  | 'unique_projects'
  | 'ata_saved_lunch'
  | 'ata_saved_after_hours'
  | 'ata_saved_madrugada'
  | 'ata_saved_weekend'
  | 'ata_saved_holiday'
  | 'lifetime_selos'

/** Snapshot de estatísticas (este mês, streak, nível atual e extras) */
export interface GamificationStats {
  atasThisMonth: number
  itensThisMonth: number
  streakDays: number
  level: LevelTier
  totalAtas: number
  totalItens: number
  unlockedCount: number
  totalAchievements: number
  /** Selos acumulados (persistente) */
  lifetimeSelos: number
  /** Total de participantes (soma em todas as atas) */
  totalParticipantes: number
  /** Quantidade de atas arquivadas */
  atasArquivadas: number
  /** Quantidade de projetos distintos */
  projetosUnicos: number
  /** Dias distintos com ata no mês atual */
  diasComAtaNoMes: number
  /** Atas criadas ou com data na última semana */
  atasEstaSemana: number
  /** Média de itens por ata (totalItens / totalAtas) */
  mediaItensPorAta: number
  /** Maior quantidade de itens em uma única ata */
  maiorAtaItens: number
  /** Próximo nível: atas necessárias */
  nextLevelAtas: number
}

/** Payload completo para export/import entre browsers */
export interface FullBackupPayload {
  version: number
  exportedAt: string
  meetingMinutes: MeetingMinutesBackupItem[]
  gamification: GamificationState
}

/** Item de ata no backup (dados crus como armazenados) */
export interface MeetingMinutesBackupItem {
  id: string
  data: Record<string, unknown>
}

export const GAMIFICATION_SCHEMA_VERSION = 2
export const BACKUP_PAYLOAD_VERSION = 1
