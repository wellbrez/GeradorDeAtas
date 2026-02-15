/**
 * Hook que expõe estatísticas, conquistas e ações de gamificação.
 * Atualiza conquistas quando a lista de atas muda e expõe recém-desbloqueadas.
 */
import { useMemo, useCallback, useEffect, useState } from 'react'
import type { MeetingMinutes } from '@/types'
import {
  getGamificationState,
  updateAchievementsFromAtas,
  computeStats,
  recordActivityToday,
  getAchievementDefinitions,
  buyUpgrade as buyUpgradeService,
  getUpgradeCost,
  getUpgradeDefinitions,
  getUnlockedUpgradeDefinitions,
  GAMIFICATION_UPDATED_EVENT,
} from '../gamificationService'
import type { GamificationStats, AchievementDefinition, AchievementId, UpgradeId } from '../types'

export interface UseGamificationResult {
  stats: GamificationStats
  definitions: AchievementDefinition[]
  unlockedIds: Set<AchievementId>
  unlockedAt: Record<AchievementId, string>
  newlyUnlocked: AchievementId[]
  onAtaSaved: () => void
  clearNewlyUnlocked: () => void
  /** Selos atuais (persistente) */
  lifetimeSelos: number
  /** Quantidade owned por upgrade */
  upgradesOwned: Record<UpgradeId, number>
  /** Compra uma unidade do upgrade; retorna true se comprou e atualiza estado */
  buyUpgrade: (id: UpgradeId) => boolean
  /** Custo em Selos da próxima unidade */
  getUpgradeCost: (id: UpgradeId) => number
  /** Definições dos upgrades para a loja (todas) */
  upgradeDefinitions: ReturnType<typeof getUpgradeDefinitions>
  /** Apenas upgrades já desbloqueados (lifetimeSelos >= unlockAtLifetimeSelos) para exibir na loja */
  unlockedUpgradeDefinitions: ReturnType<typeof getUnlockedUpgradeDefinitions>
}

export function useGamification(atas: MeetingMinutes[]): UseGamificationResult {
  const [gamificationState, setGamificationState] = useState(getGamificationState)
  const [newlyUnlocked, setNewlyUnlocked] = useState<AchievementId[]>([])

  useEffect(() => {
    const ids = updateAchievementsFromAtas(atas)
    setGamificationState(getGamificationState())
    if (ids.length > 0) setNewlyUnlocked(ids)
  }, [atas])

  /** Atualiza estado quando Selos (ou upgrades) mudam fora do hook (ex.: awardSelos no toast). */
  useEffect(() => {
    const handler = () => setGamificationState(getGamificationState())
    window.addEventListener(GAMIFICATION_UPDATED_EVENT, handler)
    return () => window.removeEventListener(GAMIFICATION_UPDATED_EVENT, handler)
  }, [])

  const unlockedIds = useMemo(() => {
    const set = new Set<AchievementId>()
    Object.keys(gamificationState.unlockedAchievements).forEach((id) => set.add(id))
    return set
  }, [gamificationState.unlockedAchievements])

  const stats = useMemo(
    () => computeStats(atas),
    [atas, gamificationState.unlockedAchievements, gamificationState.lifetimeSelos, gamificationState.upgradesOwned]
  )
  const definitions = useMemo(() => getAchievementDefinitions(), [])

  const onAtaSaved = useCallback(() => {
    recordActivityToday()
  }, [])

  const clearNewlyUnlocked = useCallback(() => setNewlyUnlocked([]), [])

  const buyUpgrade = useCallback((id: UpgradeId) => {
    const ok = buyUpgradeService(id)
    if (ok) setGamificationState(getGamificationState())
    return ok
  }, [])

  const upgradeDefinitions = useMemo(() => getUpgradeDefinitions(), [])
  const unlockedUpgradeDefinitions = useMemo(
    () => getUnlockedUpgradeDefinitions(gamificationState.lifetimeSelos),
    [gamificationState.lifetimeSelos]
  )

  return {
    stats,
    definitions,
    unlockedIds,
    unlockedAt: gamificationState.unlockedAchievements,
    newlyUnlocked,
    onAtaSaved,
    clearNewlyUnlocked,
    lifetimeSelos: gamificationState.lifetimeSelos,
    upgradesOwned: gamificationState.upgradesOwned,
    buyUpgrade,
    getUpgradeCost,
    upgradeDefinitions,
    unlockedUpgradeDefinitions,
  }
}

