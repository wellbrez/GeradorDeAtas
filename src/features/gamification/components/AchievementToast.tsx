/**
 * Toast de uma conquista desbloqueada. Exibe ~6s e pode ser fechado pelo clique.
 */
import { useEffect } from 'react'
import type { AchievementDefinition } from '../types'
import styles from './AchievementToast.module.css'

const DISPLAY_DURATION_MS = 6000

export interface AchievementToastProps {
  achievement: AchievementDefinition
  onDismiss: () => void
}

export default function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, DISPLAY_DURATION_MS)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div
      className={styles.toast}
      role="status"
      aria-live="polite"
      onClick={onDismiss}
      onKeyDown={(e) => e.key === 'Escape' && onDismiss()}
      tabIndex={0}
    >
      <span className={styles.icon} aria-hidden="true">{achievement.icon}</span>
      <div className={styles.text}>
        <span className={styles.title}>Conquista desbloqueada: {achievement.name}</span>
        <span className={styles.desc}>{achievement.description}</span>
      </div>
    </div>
  )
}
