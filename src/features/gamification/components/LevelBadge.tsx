/**
 * Badge de nível (e opcionalmente streak) para o header. Clicável abre conquistas.
 */
import type { LevelTier } from '../types'
import styles from './LevelBadge.module.css'

export interface LevelBadgeProps {
  level: LevelTier
  streakDays?: number
  onClick?: () => void
}

export default function LevelBadge({ level, streakDays = 0, onClick }: LevelBadgeProps) {
  const content = (
    <>
      <span className={styles.icon} aria-hidden="true">{level.icon}</span>
      <span className={styles.title}>{level.title}</span>
      {streakDays > 0 && (
        <span className={styles.streak} aria-label={`${streakDays} dias seguidos com atividade`}>
          🔥 {streakDays}
        </span>
      )}
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        className={styles.button}
        onClick={onClick}
        aria-label="Ver conquistas e nível"
      >
        {content}
      </button>
    )
  }

  return <div className={styles.badge}>{content}</div>
}
