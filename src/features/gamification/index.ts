/**
 * Módulo de gamificação: conquistas, níveis, estatísticas e backup.
 * Exporta tipos, serviço, hooks e componentes para uso no App.
 */
export * from './types'
export * from './gamificationService'
export * from './achievements.config'
export { getGamificationEnabled, setGamificationEnabled } from './preferences'
export { useGamification } from './hooks/useGamification'
export type { UseGamificationResult } from './hooks/useGamification'
export * from './components'
