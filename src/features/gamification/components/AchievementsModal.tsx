/**
 * Modal de conquistas: grid de tiles (desbloqueadas com destaque, bloqueadas esmaecidas).
 */
import Modal from '@components/ui/Modal'
import type { AchievementDefinition } from '../types'
import styles from './AchievementsModal.module.css'

export interface AchievementsModalProps {
  isOpen: boolean
  onClose: () => void
  definitions: AchievementDefinition[]
  unlockedIds: Set<string>
  unlockedAt: Record<string, string>
}

function formatUnlockedDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

export default function AchievementsModal({
  isOpen,
  onClose,
  definitions,
  unlockedIds,
  unlockedAt,
}: AchievementsModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Conquistas"
      size="lg"
    >
      <p className={styles.headerNote}>
        Desbloqueie conquistas ao usar o sistema. Suas conquistas são salvas no navegador e podem ser exportadas junto com as atas.
      </p>
      <div className={styles.grid}>
        {definitions.map((def) => {
          const unlocked = unlockedIds.has(def.id)
          const showSecret = def.secret && !unlocked
          return (
            <div
              key={def.id}
              className={`${styles.tile} ${unlocked ? styles.tileUnlocked : styles.tileLocked}`}
              role="listitem"
              aria-label={unlocked ? `Conquista: ${def.name}` : `Conquista bloqueada: ${showSecret ? '???' : def.name}`}
            >
              <span className={styles.icon} aria-hidden="true">{def.icon}</span>
              <span className={styles.name}>{showSecret ? '???' : def.name}</span>
              <span className={styles.desc}>{showSecret ? '???' : def.description}</span>
              {unlocked && unlockedAt[def.id] && (
                <span className={styles.unlockedAt}>
                  {formatUnlockedDate(unlockedAt[def.id])}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </Modal>
  )
}
