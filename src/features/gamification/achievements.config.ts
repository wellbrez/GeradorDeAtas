/**
 * Configuração de conquistas e níveis.
 * Para adicionar novas conquistas: incluir aqui e implementar o evaluator em gamificationService.
 */
import type { AchievementDefinition, LevelTier } from './types'

/** Conquistas disponíveis (ordem de exibição; novas podem ser appended) */
export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'first_ata',
    name: 'Primeira Ata',
    description: 'Registrou sua primeira ata de reunião',
    icon: '📋',
    category: 'ata',
    condition: 'first_ata',
  },
  {
    id: 'arquivista',
    name: 'Arquivista',
    description: 'Salvou 5 atas',
    icon: '📁',
    category: 'arquivo',
    condition: 'total_atas',
    params: { minAtas: 5 },
  },
  {
    id: 'registro_completo',
    name: 'Registro Completo',
    description: 'Uma ata com todos os itens com responsável definido',
    icon: '✅',
    category: 'itens',
    condition: 'ata_all_items_with_responsible',
  },
  {
    id: 'reuniao_cheia',
    name: 'Reunião Cheia',
    description: 'Uma ata com 5 ou mais participantes',
    icon: '👥',
    category: 'participantes',
    condition: 'ata_min_participants',
    params: { minParticipants: 5 },
  },
  {
    id: 'ata_densa',
    name: 'Ata Densa',
    description: 'Uma ata com 10 ou mais itens',
    icon: '📑',
    category: 'itens',
    condition: 'ata_with_min_items',
    params: { minItens: 10 },
  },
  {
    id: 'organizador',
    name: 'Organizador',
    description: 'Arquivou uma ata (origem de cópia)',
    icon: '🗄️',
    category: 'arquivo',
    condition: 'first_archived',
  },
  {
    id: 'semana_ativa',
    name: 'Semana Ativa',
    description: 'Registrou atas em 3 dias diferentes no mesmo mês',
    icon: '📅',
    category: 'especial',
    condition: 'days_with_ata_in_month',
    params: { minDays: 3 },
  },
  {
    id: 'sem_pendentes',
    name: 'Sem Pendentes',
    description: 'Uma ata em que nenhum item está como Pendente',
    icon: '🎯',
    category: 'itens',
    condition: 'ata_no_pendentes',
  },
]

/** Faixas de nível (ordenadas por minAtas crescente) */
export const LEVEL_TIERS: LevelTier[] = [
  { id: 'iniciante', minAtas: 0, title: 'Iniciante', subtitle: 'Começando a organizar', icon: '🌱' },
  { id: 'registrador', minAtas: 3, title: 'Registrador', subtitle: 'Em ritmo de registro', icon: '📝' },
  { id: 'arquivista_nivel', minAtas: 10, title: 'Arquivista', subtitle: 'Mestre das atas', icon: '📚' },
  { id: 'mestre', minAtas: 25, title: 'Mestre das Atas', subtitle: 'Referência em organização', icon: '🏆' },
]
