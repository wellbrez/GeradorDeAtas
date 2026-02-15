/**
 * Saves como sidebar direita (altura total), mesmo padrão da Loja.
 * Inclui slots manuais e exportar/importar backup completo.
 */
import SavesSlots from './SavesSlots'
import BackupExportImport from './BackupExportImport'
import styles from './SavesSidebar.module.css'

export interface SavesSidebarProps {
  isOpen: boolean
  onClose: () => void
  onLoadDone: () => void
}

export default function SavesSidebar({ isOpen, onClose, onLoadDone }: SavesSidebarProps) {
  if (!isOpen) return null

  return (
    <aside className={styles.sidebar} aria-label="Saves">
      <div className={styles.panel}>
        <header className={styles.header}>
          <h2 className={styles.title}>Saves</h2>
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
          <SavesSlots onLoadDone={() => { onLoadDone(); onClose() }} />
          <div className={styles.backupSection}>
            <BackupExportImport onImportDone={onLoadDone} />
          </div>
        </div>
      </div>
    </aside>
  )
}
