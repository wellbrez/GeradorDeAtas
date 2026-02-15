/**
 * Configuração expandida de conquistas (100+).
 * Mantém as 8 originais e adiciona blocos parametrizados por limiar.
 */
import type { AchievementDefinition } from './types'

const totalAtasThresholds = [1, 2, 3, 5, 7, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200]
const ataMinItemsThresholds = [3, 5, 7, 10, 15, 20, 25, 30, 40, 50]
const ataMinParticipantsThresholds = [2, 3, 4, 5, 7, 10, 15, 20]
/** Máximo corporativo: ~20 dias úteis no mês */
const daysInMonthThresholds = [2, 3, 4, 5, 7, 10, 15, 20]
/** Streak em dias úteis (sexta→segunda consecutivo); máximo 20 */
const streakDaysThresholds = [2, 3, 5, 7, 10, 15, 20]
const atasArchivedThresholds = [1, 3, 5, 10, 20, 50]
const totalItensLifetimeThresholds = [10, 50, 100, 250, 500, 1000, 2500, 5000]
const atasInOneDayThresholds = [2, 3, 5, 7, 10]
const monthlyAtasThresholds = [5, 10, 15, 20, 30]
const uniqueProjectsThresholds = [2, 3, 5, 10, 15, 20]
const ataExactItemsThresholds = [1, 5, 10, 15, 20]
const totalParticipantsLifetimeThresholds = [10, 25, 50, 100, 250, 500]

/**
 * Conquistas por Selos acumulados (lifetime).
 * Escala alta e progressiva: selos podem ser ganhos em muitas ações (cabeçalho, participantes, import, avançar, itens, etc.).
 */
const lifetimeSelosThresholds = [
  100, 300, 750, 2_000, 5_000, 12_500, 30_000, 75_000, 180_000, 450_000,
  1_000_000, 2_500_000, 5_000_000, 12_000_000, 25_000_000,
]

function buildLifetimeSelos(): AchievementDefinition[] {
  const names: Record<number, string> = {
    100: 'Primeiros Selos',
    300: 'Colecionador',
    750: 'Acumulador',
    2_000: 'Dois mil',
    5_000: 'Cinco mil',
    12_500: 'Doze mil e quinhentos',
    30_000: 'Trinta mil',
    75_000: 'Setenta e cinco mil',
    180_000: 'Cento e oitenta mil',
    450_000: 'Quatrocentos e cinquenta mil',
    1_000_000: 'Um milhão',
    2_500_000: 'Dois milhões e meio',
    5_000_000: 'Cinco milhões',
    12_000_000: 'Doze milhões',
    25_000_000: 'Mestre dos Selos',
  }
  return lifetimeSelosThresholds.map((min) => ({
    id: `lifetime_selos_${min}`,
    name: names[min] ?? `${min} Selos`,
    description: `Acumulou ${min.toLocaleString('pt-BR')} Selos no total (ganhos em ações e usados na loja)`,
    icon: '🏅',
    category: 'especial',
    condition: 'lifetime_selos' as const,
    params: { minSelos: min },
  }))
}

function buildTotalAtas(): AchievementDefinition[] {
  return totalAtasThresholds.map((min) => ({
    id: `total_atas_${min}`,
    name: min === 1 ? 'Primeira Ata' : `Salvou ${min} atas`,
    description: min === 1 ? 'Registrou sua primeira ata de reunião' : `Total de ${min} atas salvas`,
    icon: min === 1 ? '📋' : '📁',
    category: min === 1 ? 'ata' : 'arquivo',
    condition: 'total_atas' as const,
    params: { minAtas: min },
  }))
}

function buildAtaWithMinItems(): AchievementDefinition[] {
  return ataMinItemsThresholds.map((min) => ({
    id: `ata_min_items_${min}`,
    name: `Ata com ${min}+ itens`,
    description: `Uma ata com pelo menos ${min} itens`,
    icon: '📑',
    category: 'itens',
    condition: 'ata_with_min_items' as const,
    params: { minItens: min },
  }))
}

function buildAtaMinParticipants(): AchievementDefinition[] {
  return ataMinParticipantsThresholds.map((min) => ({
    id: `ata_min_participants_${min}`,
    name: min >= 10 ? `Reunião grande (${min}+)` : `${min}+ participantes`,
    description: `Uma ata com ${min} ou mais participantes`,
    icon: '👥',
    category: 'participantes',
    condition: 'ata_min_participants' as const,
    params: { minParticipants: min },
  }))
}

function buildDaysInMonth(): AchievementDefinition[] {
  return daysInMonthThresholds.map((min) => ({
    id: `days_in_month_${min}`,
    name: `${min} dias úteis no mês`,
    description: `Registrou atas em ${min} dias diferentes no mesmo mês (máx. 20 dias úteis)`,
    icon: '📅',
    category: 'especial',
    condition: 'days_with_ata_in_month' as const,
    params: { minDays: min },
  }))
}

function buildStreakDays(): AchievementDefinition[] {
  return streakDaysThresholds.map((min) => ({
    id: `streak_${min}`,
    name: `${min} dias úteis seguidos`,
    description: `${min} dias úteis consecutivos com pelo menos uma ata (sexta→segunda conta)`,
    icon: '🔥',
    category: 'especial',
    condition: 'streak_days' as const,
    params: { minDays: min },
  }))
}

function buildAtasArchived(): AchievementDefinition[] {
  return atasArchivedThresholds.map((min) => ({
    id: `atas_archived_${min}`,
    name: `${min} atas arquivadas`,
    description: `${min} atas marcadas como arquivadas (origem de cópia)`,
    icon: '🗄️',
    category: 'arquivo',
    condition: 'atas_archived' as const,
    params: { minArchived: min },
  }))
}

function buildTotalItensLifetime(): AchievementDefinition[] {
  return totalItensLifetimeThresholds.map((min) => ({
    id: `total_itens_${min}`,
    name: `${min} itens no total`,
    description: `Soma de todos os itens em todas as atas: ${min}+`,
    icon: '📊',
    category: 'itens',
    condition: 'total_itens_lifetime' as const,
    params: { minItens: min },
  }))
}

function buildAtasInOneDay(): AchievementDefinition[] {
  return atasInOneDayThresholds.map((min) => ({
    id: `atas_one_day_${min}`,
    name: `${min} atas em um dia`,
    description: `Registrou ${min} atas no mesmo dia`,
    icon: '⚡',
    category: 'especial',
    condition: 'atas_in_one_day' as const,
    params: { minAtas: min },
  }))
}

function buildMonthlyAtas(): AchievementDefinition[] {
  return monthlyAtasThresholds.map((min) => ({
    id: `monthly_atas_${min}`,
    name: `${min} atas no mês`,
    description: `${min} ou mais atas no mês atual`,
    icon: '📆',
    category: 'ata',
    condition: 'monthly_atas' as const,
    params: { minAtas: min },
  }))
}

function buildUniqueProjects(): AchievementDefinition[] {
  return uniqueProjectsThresholds.map((min) => ({
    id: `unique_projects_${min}`,
    name: `${min} projetos`,
    description: `Atas em ${min} projetos diferentes`,
    icon: '🏷️',
    category: 'arquivo',
    condition: 'unique_projects' as const,
    params: { minProjects: min },
  }))
}

function buildAtaExactItems(): AchievementDefinition[] {
  return ataExactItemsThresholds.map((exact) => ({
    id: `ata_exact_items_${exact}`,
    name: `Exatamente ${exact} itens`,
    description: `Uma ata com exatamente ${exact} itens`,
    icon: '🎯',
    category: 'itens',
    condition: 'ata_with_exactly_n_items' as const,
    params: { exactItens: exact },
  }))
}

function buildTotalParticipantsLifetime(): AchievementDefinition[] {
  return totalParticipantsLifetimeThresholds.map((min) => ({
    id: `total_participants_${min}`,
    name: `${min} participantes (total)`,
    description: `Soma de participantes em todas as atas: ${min}+`,
    icon: '👥',
    category: 'participantes',
    condition: 'total_participants_lifetime' as const,
    params: { minParticipants: min },
  }))
}

/** Conquistas especiais (únicas) */
const specialAchievements: AchievementDefinition[] = [
  { id: 'first_ata', name: 'Primeira Ata', description: 'Registrou sua primeira ata de reunião', icon: '📋', category: 'ata', condition: 'first_ata' },
  { id: 'registro_completo', name: 'Registro Completo', description: 'Uma ata com todos os itens com responsável definido', icon: '✅', category: 'itens', condition: 'ata_all_items_with_responsible' },
  { id: 'organizador', name: 'Organizador', description: 'Arquivou uma ata (origem de cópia)', icon: '🗄️', category: 'arquivo', condition: 'first_archived' },
  { id: 'sem_pendentes', name: 'Sem Pendentes', description: 'Uma ata em que nenhum item está como Pendente', icon: '🎯', category: 'itens', condition: 'ata_no_pendentes' },
  { id: 'fortuna_1111', name: 'Fortuna', description: '???', icon: '🍀', category: 'especial', condition: 'ata_saved_at_hour', params: { hour: 11 }, secret: true },
]

/**
 * Conquistas "não louváveis": não entram na contagem padrão nem dão pontos.
 * Textos explicativos e divertidos, sem glorificar o comportamento.
 */
const nonPraiseworthyAchievements: AchievementDefinition[] = [
  {
    id: 'ata_saved_lunch',
    name: 'Almoço? Que almoço?',
    description: 'Você salvou uma ata entre 12h e 13h. O RH recomenda: faça uma pausa. Até o código precisa de um café.',
    icon: '🍽️',
    category: 'especial',
    condition: 'ata_saved_lunch',
    praiseworthy: false,
  },
  {
    id: 'ata_saved_after_hours',
    name: 'Expediente estendido',
    description: 'Ata salva após as 16h. Será que o escritório já não fechou? Lembre-se: produtividade também é saber parar.',
    icon: '🌙',
    category: 'especial',
    condition: 'ata_saved_after_hours',
    praiseworthy: false,
  },
  {
    id: 'ata_saved_madrugada',
    name: 'Coruja de plantão',
    description: 'Entre 0h e 2h da manhã você registrou uma ata. A equipe de saúde ocupacional manda um abraço (e um "por favor, durma").',
    icon: '🦉',
    category: 'especial',
    condition: 'ata_saved_madrugada',
    praiseworthy: false,
  },
  {
    id: 'ata_saved_weekend',
    name: 'Sábado e domingo também?',
    description: 'Você salvou uma ata no fim de semana. O equilíbrio vida-trabalho agradece quando você tira o pé do acelerador.',
    icon: '📅',
    category: 'especial',
    condition: 'ata_saved_weekend',
    praiseworthy: false,
  },
  {
    id: 'ata_saved_holiday',
    name: 'Feriado nacional, reunião local',
    description: 'Ata registrada em um feriado brasileiro. Até o calendário precisa de um dia off — e você também.',
    icon: '🇧🇷',
    category: 'especial',
    condition: 'ata_saved_holiday',
    praiseworthy: false,
  },
]

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  ...specialAchievements,
  ...buildTotalAtas().filter((a) => a.id !== 'total_atas_1'),
  ...buildAtaWithMinItems(),
  ...buildAtaMinParticipants(),
  ...buildDaysInMonth(),
  ...buildStreakDays(),
  ...buildLifetimeSelos(),
  ...buildAtasArchived(),
  ...buildTotalItensLifetime(),
  ...buildAtasInOneDay(),
  ...buildMonthlyAtas(),
  ...buildUniqueProjects(),
  ...buildAtaExactItems(),
  ...buildTotalParticipantsLifetime(),
  ...nonPraiseworthyAchievements,
]
