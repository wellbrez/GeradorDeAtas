/**
 * Serviço de gamificação: estado persistido, avaliação de conquistas e estatísticas.
 * Projetado para escalar: novos tipos de condição = novo case no evaluateAchievement.
 *
 * @module gamificationService
 * @description Persiste conquistas e streak no localStorage; avalia conquistas a partir das atas; export/import de backup (atas + gamificação).
 */
import type { MeetingMinutes, Item, MeetingMinutesStorage } from '@/types'
import type {
  GamificationState,
  AchievementDefinition,
  AchievementId,
  GamificationStats,
  FullBackupPayload,
  MeetingMinutesBackupItem,
  UpgradeId,
} from './types'
import {
  GAMIFICATION_SCHEMA_VERSION,
  BACKUP_PAYLOAD_VERSION,
} from './types'
import { LEVEL_TIERS } from './achievements.config'
import { ACHIEVEMENT_DEFINITIONS } from './achievements.expanded.config'
import { UPGRADE_DEFINITIONS } from './upgrades.config'
import { storageService } from '@services/storage'
import { getBusinessDayStreak, isHoliday, isWeekend } from './brazilianCalendar'
import { formatSelosGain } from './selosFormat'

const STORAGE_KEY_GAMIFICATION = 'atas-reuniao-gamification'
const SAVE_SLOT_PREFIX = 'atas-reuniao-save-slot-'
const SAVE_SLOT_COUNT = 3

function getState(): GamificationState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GAMIFICATION)
    if (!raw) return null
    const data = JSON.parse(raw) as Record<string, unknown>
    if (!data || typeof data.unlockedAchievements !== 'object') return null
    const state: GamificationState = {
      unlockedAchievements: (data.unlockedAchievements as Record<string, string>) || {},
      lastActivityDate: typeof data.lastActivityDate === 'string' ? data.lastActivityDate : null,
      schemaVersion: GAMIFICATION_SCHEMA_VERSION,
      lifetimeSelos: typeof data.lifetimeSelos === 'number' ? data.lifetimeSelos : 0,
      upgradesOwned: typeof data.upgradesOwned === 'object' && data.upgradesOwned !== null
        ? (data.upgradesOwned as Record<string, number>)
        : {},
    }
    return state
  } catch {
    return null
  }
}

/** Nome do evento disparado quando o estado de gamificação é persistido (para a UI atualizar a contagem de Selos). */
export const GAMIFICATION_UPDATED_EVENT = 'atas-gamification-updated'

function setState(state: GamificationState): void {
  try {
    localStorage.setItem(STORAGE_KEY_GAMIFICATION, JSON.stringify(state))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(GAMIFICATION_UPDATED_EVENT))
    }
  } catch (e) {
    console.warn('Gamification: falha ao salvar estado', e)
  }
}

/**
 * Retorna o estado atual de gamificação (persistido no browser).
 */
export function getGamificationState(): GamificationState {
  const current = getState()
  if (current) return current
  return {
    unlockedAchievements: {},
    lastActivityDate: null,
    schemaVersion: GAMIFICATION_SCHEMA_VERSION,
    lifetimeSelos: 0,
    upgradesOwned: {},
  }
}

/**
 * Persiste o estado de gamificação no browser.
 */
export function saveGamificationState(state: GamificationState): void {
  setState(state)
}

/**
 * Multiplicador de Selos por ata (ganho exponencial estilo Cookie Clicker).
 * Cada tipo contribui (1 + rate)^owned; o total é o produto de todos os tipos.
 */
function getSelosMultiplier(state: GamificationState): number {
  let product = 1
  for (const def of UPGRADE_DEFINITIONS) {
    const owned = state.upgradesOwned[def.id] ?? 0
    if (owned > 0) {
      product *= Math.pow(1 + def.selosPerAtaPerUnit, owned)
    }
  }
  return product
}

const BASE_SELOS_ATA = 1
const SELOS_PER_ITEM = 0.5
const SELOS_PER_PARTICIPANT = 0.2

/**
 * Concede Selos por ter salvo uma ata. Retorna o valor ganho (para exibir).
 * Chamar apenas no fluxo normal de "Salvar Ata" no formulário, não em import/cópia em lote.
 */
export function awardSelosForAta(storage: MeetingMinutesStorage, _isNew: boolean): number {
  const state = getGamificationState()
  const baseSelos = Math.round(
    BASE_SELOS_ATA +
    storage.itens.length * SELOS_PER_ITEM +
    storage.attendance.length * SELOS_PER_PARTICIPANT
  )
  const multiplier = getSelosMultiplier(state)
  const earned = Math.max(1, Math.round(baseSelos * multiplier))
  const nextState: GamificationState = {
    ...state,
    lifetimeSelos: state.lifetimeSelos + earned,
  }
  setState(nextState)
  return earned
}

/**
 * Concede Selos por uma ação (cliques, import, export, etc.).
 * Aplica o multiplicador da loja. Retorna o valor ganho com 3 decimais (para exibir "Ganhou 1,020").
 */
export function awardSelos(baseAmount: number): number {
  const state = getGamificationState()
  const multiplier = getSelosMultiplier(state)
  const earned = Math.round(baseAmount * multiplier * 1000) / 1000
  if (earned <= 0) return 0
  const nextState: GamificationState = {
    ...state,
    lifetimeSelos: Math.round((state.lifetimeSelos + earned) * 1000) / 1000,
  }
  setState(nextState)
  return earned
}

/** Formata ganho de Selos para toast (ex.: 1,020 ou 1,23k). Estilo Cookie Clicker. */
export function formatSelosForDisplay(value: number): string {
  return formatSelosGain(value)
}

/** Formata valor de Selos para exibição (barra, loja, painel). mode: 'compact' | 'standard'. */
export { formatSelos } from './selosFormat'

/**
 * Custo em Selos da próxima unidade de um upgrade.
 */
export function getUpgradeCost(upgradeId: UpgradeId): number {
  const def = UPGRADE_DEFINITIONS.find((d) => d.id === upgradeId)
  if (!def) return Infinity
  const state = getGamificationState()
  const owned = state.upgradesOwned[upgradeId] ?? 0
  return Math.floor(def.baseCost * Math.pow(def.costMultiplier, owned))
}

/**
 * Compra uma unidade do upgrade. Retorna true se a compra foi feita.
 */
export function buyUpgrade(upgradeId: UpgradeId): boolean {
  const def = UPGRADE_DEFINITIONS.find((d) => d.id === upgradeId)
  if (!def) return false
  const state = getGamificationState()
  const cost = getUpgradeCost(upgradeId)
  if (state.lifetimeSelos < cost) return false
  const owned = state.upgradesOwned[upgradeId] ?? 0
  setState({
    ...state,
    lifetimeSelos: state.lifetimeSelos - cost,
    upgradesOwned: { ...state.upgradesOwned, [upgradeId]: owned + 1 },
  })
  return true
}

/**
 * Retorna definições de todos os upgrades (para UI).
 */
export function getUpgradeDefinitions() {
  return UPGRADE_DEFINITIONS
}

/**
 * Retorna apenas os upgrades já desbloqueados (lifetimeSelos >= unlockAtLifetimeSelos).
 */
export function getUnlockedUpgradeDefinitions(lifetimeSelos: number) {
  return UPGRADE_DEFINITIONS.filter((d) => lifetimeSelos >= (d.unlockAtLifetimeSelos ?? 0))
}

/**
 * Avalia se uma conquista é desbloqueada com base nas atas atuais.
 */
function evaluateAchievement(
  def: AchievementDefinition,
  atas: MeetingMinutes[],
  alreadyUnlocked: boolean
): boolean {
  if (alreadyUnlocked) return true

  const p = def.params || {}

  switch (def.condition) {
    case 'first_ata':
      return atas.length >= 1

    case 'total_atas': {
      const min = (p.minAtas as number) ?? 5
      return atas.length >= min
    }

    case 'ata_with_min_items': {
      const min = (p.minItens as number) ?? 10
      return atas.some((ata) => ata.itens.length >= min)
    }

    case 'ata_all_items_with_responsible': {
      const hasResponsible = (item: Item) => {
        const r = item.UltimoHistorico?.responsavel
        return !!(r && (r.nome?.trim() || r.email?.trim()))
      }
      return atas.some((ata) => ata.itens.length > 0 && ata.itens.every(hasResponsible))
    }

    case 'ata_min_participants': {
      const min = (p.minParticipants as number) ?? 5
      return atas.some((ata) => ata.attendance.length >= min)
    }

    case 'first_archived':
      return atas.some((ata) => ata.arquivada === true)

    case 'ata_no_pendentes': {
      const noPendente = (item: Item) => item.UltimoHistorico?.status !== 'Pendente'
      return atas.some((ata) => ata.itens.length > 0 && ata.itens.every(noPendente))
    }

    case 'days_with_ata_in_month': {
      const minDays = (p.minDays as number) ?? 3
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()
      const days = new Set<string>()
      atas.forEach((ata) => {
        try {
          const d = new Date(ata.cabecalho.data || ata.createdAt)
          if (d.getFullYear() === year && d.getMonth() === month) {
            days.add(d.toISOString().slice(0, 10))
          }
        } catch {
          // ignore
        }
      })
      return days.size >= minDays
    }

    case 'total_itens_lifetime': {
      const min = (p.minItens as number) ?? 10
      const total = atas.reduce((acc, ata) => acc + ata.itens.length, 0)
      return total >= min
    }

    case 'total_participants_lifetime': {
      const min = (p.minParticipants as number) ?? 10
      const total = atas.reduce((acc, ata) => acc + ata.attendance.length, 0)
      return total >= min
    }

    case 'streak_days': {
      const minDays = (p.minDays as number) ?? 2
      const today = new Date().toISOString().slice(0, 10)
      const datesWithAta = new Set<string>()
      atas.forEach((ata) => {
        try {
          datesWithAta.add(new Date(ata.cabecalho.data || ata.createdAt).toISOString().slice(0, 10))
        } catch {
          // ignore
        }
      })
      const streak = getBusinessDayStreak(datesWithAta, today)
      return streak >= minDays
    }

    case 'atas_archived': {
      const min = (p.minArchived as number) ?? 1
      const count = atas.filter((a) => a.arquivada === true).length
      return count >= min
    }

    case 'atas_in_one_day': {
      const minAtas = (p.minAtas as number) ?? 2
      const byDay: Record<string, number> = {}
      atas.forEach((ata) => {
        try {
          const key = new Date(ata.cabecalho.data || ata.createdAt).toISOString().slice(0, 10)
          byDay[key] = (byDay[key] ?? 0) + 1
        } catch {
          // ignore
        }
      })
      return Object.values(byDay).some((n) => n >= minAtas)
    }

    case 'ata_with_exactly_n_items': {
      const exact = (p.exactItens as number) ?? 5
      return atas.some((ata) => ata.itens.length === exact)
    }

    case 'ata_saved_at_hour': {
      const hour = (p.hour as number) ?? 11
      return atas.some((ata) => {
        try {
          const d = new Date(ata.createdAt)
          return d.getHours() === hour
        } catch {
          return false
        }
      })
    }

    case 'monthly_atas': {
      const minAtas = (p.minAtas as number) ?? 5
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()
      let count = 0
      atas.forEach((ata) => {
        try {
          const d = new Date(ata.createdAt)
          if (d.getFullYear() === year && d.getMonth() === month) count++
        } catch {
          // ignore
        }
      })
      return count >= minAtas
    }

    case 'unique_projects': {
      const minProjects = (p.minProjects as number) ?? 2
      const projects = new Set<string>()
      atas.forEach((ata) => {
        const proj = (ata.cabecalho.projeto || '').trim()
        if (proj) projects.add(proj)
      })
      return projects.size >= minProjects
    }

    case 'ata_saved_lunch': {
      return atas.some((ata) => {
        try {
          const d = new Date(ata.createdAt)
          const h = d.getHours()
          return h >= 12 && h <= 13
        } catch {
          return false
        }
      })
    }

    case 'ata_saved_after_hours': {
      return atas.some((ata) => {
        try {
          const d = new Date(ata.createdAt)
          return d.getHours() >= 16
        } catch {
          return false
        }
      })
    }

    case 'ata_saved_madrugada': {
      return atas.some((ata) => {
        try {
          const d = new Date(ata.createdAt)
          const h = d.getHours()
          return h >= 0 && h <= 2
        } catch {
          return false
        }
      })
    }

    case 'ata_saved_weekend': {
      return atas.some((ata) => {
        try {
          const d = new Date(ata.createdAt)
          const key = d.toISOString().slice(0, 10)
          return isWeekend(key)
        } catch {
          return false
        }
      })
    }

    case 'ata_saved_holiday': {
      return atas.some((ata) => {
        try {
          const d = new Date(ata.createdAt)
          const key = d.toISOString().slice(0, 10)
          return isHoliday(key)
        } catch {
          return false
        }
      })
    }

    case 'lifetime_selos': {
      const minSelos = (p.minSelos as number) ?? 10
      const state = getGamificationState()
      return state.lifetimeSelos >= minSelos
    }

    default:
      return false
  }
}

/**
 * Atualiza o estado de conquistas com base nas atas atuais e retorna IDs recém-desbloqueados.
 */
export function updateAchievementsFromAtas(atas: MeetingMinutes[]): AchievementId[] {
  const state = getGamificationState()
  const unlocked = state.unlockedAchievements
  const newlyUnlocked: AchievementId[] = []
  const now = new Date().toISOString()

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    const wasUnlocked = !!unlocked[def.id]
    const isUnlocked = evaluateAchievement(def, atas, wasUnlocked)
    if (isUnlocked && !wasUnlocked) {
      unlocked[def.id] = now
      newlyUnlocked.push(def.id)
    }
  }

  if (newlyUnlocked.length > 0) {
    setState({
      ...state,
      unlockedAchievements: { ...unlocked },
    })
  }

  return newlyUnlocked
}

/**
 * Atualiza lastActivityDate para hoje (para streak). Chamar ao salvar ata.
 */
export function recordActivityToday(): void {
  const today = new Date().toISOString().slice(0, 10)
  const state = getGamificationState()
  if (state.lastActivityDate === today) return
  setState({
    ...state,
    lastActivityDate: today,
  })
}

/**
 * Retorna o mínimo de atas para o próximo nível.
 */
function getNextLevelMinAtas(totalAtas: number): number {
  const next = LEVEL_TIERS.find((t) => t.minAtas > totalAtas)
  return next ? next.minAtas : LEVEL_TIERS[LEVEL_TIERS.length - 1]?.minAtas ?? totalAtas
}

/**
 * Calcula estatísticas atuais (este mês, streak, nível, totais e extras).
 */
export function computeStats(atas: MeetingMinutes[]): GamificationStats {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.toISOString().slice(0, 10)
  const oneWeekAgo = new Date(now)
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  let atasThisMonth = 0
  let itensThisMonth = 0
  const totalItens = atas.reduce((acc, ata) => acc + ata.itens.length, 0)
  const totalParticipantes = atas.reduce((acc, ata) => acc + ata.attendance.length, 0)
  const atasArquivadas = atas.filter((a) => a.arquivada).length
  const projetosUnicos = new Set(atas.map((a) => (a.cabecalho.projeto || '').trim()).filter(Boolean)).size
  const diasNoMes = new Set<string>()
  let atasEstaSemana = 0
  let maiorAtaItens = 0

  atas.forEach((ata) => {
    try {
      const d = new Date(ata.createdAt)
      if (d.getFullYear() === year && d.getMonth() === month) {
        atasThisMonth += 1
        itensThisMonth += ata.itens.length
        diasNoMes.add(d.toISOString().slice(0, 10))
      }
      const dataAta = new Date(ata.cabecalho.data || ata.createdAt)
      if (dataAta >= oneWeekAgo) atasEstaSemana += 1
      if (ata.itens.length > maiorAtaItens) maiorAtaItens = ata.itens.length
    } catch {
      // ignore
    }
  })

  const state = getGamificationState()
  const datesWithAtaForStreak = new Set<string>()
  atas.forEach((ata) => {
    try {
      datesWithAtaForStreak.add(new Date(ata.cabecalho.data || ata.createdAt).toISOString().slice(0, 10))
    } catch {
      // ignore
    }
  })
  const streakDays = getBusinessDayStreak(datesWithAtaForStreak, today)

  const level = LEVEL_TIERS.slice()
    .reverse()
    .find((t) => atas.length >= t.minAtas)
  const currentLevel = level || LEVEL_TIERS[0]
  const nextLevelAtas = getNextLevelMinAtas(atas.length)
  const praiseworthyIds = new Set(
    ACHIEVEMENT_DEFINITIONS.filter((d) => d.praiseworthy !== false).map((d) => d.id)
  )
  const unlockedCount = Object.keys(state.unlockedAchievements).filter((id) =>
    praiseworthyIds.has(id)
  ).length
  const totalAchievementsPraiseworthy = praiseworthyIds.size
  const mediaItensPorAta = atas.length > 0 ? Math.round((totalItens / atas.length) * 10) / 10 : 0

  return {
    atasThisMonth,
    itensThisMonth,
    streakDays,
    level: currentLevel,
    totalAtas: atas.length,
    totalItens,
    unlockedCount,
    totalAchievements: totalAchievementsPraiseworthy,
    lifetimeSelos: state.lifetimeSelos,
    totalParticipantes,
    atasArquivadas,
    projetosUnicos,
    diasComAtaNoMes: diasNoMes.size,
    atasEstaSemana,
    mediaItensPorAta,
    maiorAtaItens,
    nextLevelAtas,
  }
}

/**
 * Retorna definições de todas as conquistas (para UI).
 */
export function getAchievementDefinitions(): AchievementDefinition[] {
  return ACHIEVEMENT_DEFINITIONS
}

/**
 * Gera payload completo para export (atas + gamificação).
 */
export function buildFullBackupPayload(): FullBackupPayload {
  const ids = storageService.getAllMeetingMinutes()
  const meetingMinutes: MeetingMinutesBackupItem[] = []
  for (const id of ids) {
    const data = storageService.getMeetingMinutes(id)
    if (data) meetingMinutes.push({ id, data: data as Record<string, unknown> })
  }
  return {
    version: BACKUP_PAYLOAD_VERSION,
    exportedAt: new Date().toISOString(),
    meetingMinutes,
    gamification: getGamificationState(),
  }
}

/**
 * Aplica payload de backup (import): restaura atas e estado de gamificação.
 * Substitui dados atuais. Retorna true se aplicado com sucesso.
 */
export function applyFullBackupPayload(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false
  const p = payload as Record<string, unknown>
  if (p.version !== BACKUP_PAYLOAD_VERSION || !Array.isArray(p.meetingMinutes)) return false

  const gamification = p.gamification as GamificationState | undefined
  if (gamification && typeof gamification.unlockedAchievements === 'object') {
    setState({
      unlockedAchievements: gamification.unlockedAchievements,
      lastActivityDate:
        typeof gamification.lastActivityDate === 'string' ? gamification.lastActivityDate : null,
      schemaVersion:
        typeof gamification.schemaVersion === 'number'
          ? gamification.schemaVersion
          : GAMIFICATION_SCHEMA_VERSION,
      lifetimeSelos: typeof gamification.lifetimeSelos === 'number' ? gamification.lifetimeSelos : 0,
      upgradesOwned:
        typeof gamification.upgradesOwned === 'object' && gamification.upgradesOwned !== null
          ? (gamification.upgradesOwned as Record<string, number>)
          : {},
    })
  }

  const ids: string[] = []
  for (const item of p.meetingMinutes as MeetingMinutesBackupItem[]) {
    if (!item.id || !item.data) continue
    try {
      storageService.saveMeetingMinutes(item.id, item.data)
      ids.push(item.id)
    } catch (e) {
      console.warn('Falha ao restaurar ata', item.id, e)
    }
  }
  storageService.saveMeetingMinutesIds(ids)
  return true
}

/**
 * Salva o estado atual (atas + gamificação) no slot N (1, 2 ou 3).
 */
export function saveToSlot(slotIndex: number): boolean {
  if (slotIndex < 1 || slotIndex > SAVE_SLOT_COUNT) return false
  const payload = buildFullBackupPayload()
  try {
    localStorage.setItem(SAVE_SLOT_PREFIX + slotIndex, JSON.stringify(payload))
    return true
  } catch (e) {
    console.warn('Falha ao salvar no slot', slotIndex, e)
    return false
  }
}

/**
 * Retorna o payload do slot N ou null se vazio/inválido.
 */
export function getSlotPayload(slotIndex: number): FullBackupPayload | null {
  if (slotIndex < 1 || slotIndex > SAVE_SLOT_COUNT) return null
  try {
    const raw = localStorage.getItem(SAVE_SLOT_PREFIX + slotIndex)
    if (!raw) return null
    const data = JSON.parse(raw) as unknown
    if (!data || typeof data !== 'object') return null
    const p = data as Record<string, unknown>
    if (p.version !== BACKUP_PAYLOAD_VERSION || !Array.isArray(p.meetingMinutes)) return null
    return data as FullBackupPayload
  } catch {
    return null
  }
}

/**
 * Carrega o slot N no estado atual (substitui atas e gamificação). Retorna true se carregou.
 */
export function loadFromSlot(slotIndex: number): boolean {
  const payload = getSlotPayload(slotIndex)
  if (!payload) return false
  return applyFullBackupPayload(payload)
}
