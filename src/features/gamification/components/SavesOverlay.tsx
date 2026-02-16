/**
 * Saves em popup/modal centralizado em tela cheia.
 * Exportar/Importar backup no topo; slots abaixo.
 */
import SavesSlots from './SavesSlots'
import BackupExportImport from './BackupExportImport'
import styles from './SavesOverlay.module.css'

export interface SavesOverlayProps {
  isOpen: boolean
  onClose: () => void
  onLoadDone: () => void
}

export default function SavesOverlay({ isOpen, onClose, onLoadDone }: SavesOverlayProps) {
  if (!isOpen) return null

  return (
    <aside className={styles.overlay} aria-label="Saves e backup">
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="saves-title">
        <header className={styles.header}>
          <h2 id="saves-title" className={styles.title}>
            Saves e Backup
          </h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            title="Fechar"
            aria-label="Fechar saves"
          >
            ✕
          </button>
        </header>
        <div className={styles.scroll}>
          <div className={styles.backupSection}>
            <BackupExportImport onImportDone={onLoadDone} />
          </div>
          <SavesSlots onLoadDone={() => { onLoadDone(); onClose() }} />
        </div>
      </div>
    </aside>
  )
}
