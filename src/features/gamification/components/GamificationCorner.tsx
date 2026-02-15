/**
 * Ícones fixos no canto superior direito: Conquistas, Loja, Saves.
 * Fundo amarelo, colados à lateral direita da página.
 */
import styles from './GamificationCorner.module.css'

export type CornerPanel = 'achievements' | 'shop' | 'saves'

export interface GamificationCornerProps {
  /** Ícone do nível atual (ex.: para Conquistas) */
  levelIcon: string
  /** Qual painel está aberto; null = nenhum */
  activePanel: CornerPanel | null
  onOpen: (panel: CornerPanel) => void
}

export default function GamificationCorner({
  levelIcon,
  activePanel,
  onOpen,
}: GamificationCornerProps) {
  return (
    <div className={styles.corner} aria-label="Gamificação">
      <button
        type="button"
        className={`${styles.iconBtn} ${activePanel === 'achievements' ? styles.iconBtnActive : ''}`}
        onClick={() => onOpen('achievements')}
        title="Conquistas e nível"
        aria-label="Abrir conquistas"
      >
        <span className={styles.icon} aria-hidden>{levelIcon}</span>
      </button>
      <button
        type="button"
        className={`${styles.iconBtn} ${activePanel === 'shop' ? styles.iconBtnActive : ''}`}
        onClick={() => onOpen('shop')}
        title="Loja"
        aria-label="Abrir loja"
      >
        <span className={styles.icon} aria-hidden>🛒</span>
      </button>
      <button
        type="button"
        className={`${styles.iconBtn} ${activePanel === 'saves' ? styles.iconBtnActive : ''}`}
        onClick={() => onOpen('saves')}
        title="Saves"
        aria-label="Abrir saves"
      >
        <span className={styles.icon} aria-hidden>💾</span>
      </button>
    </div>
  )
}
