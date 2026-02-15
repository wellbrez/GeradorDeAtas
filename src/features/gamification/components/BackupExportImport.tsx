/**
 * Botões para exportar e importar backup completo (atas + gamificação) para outro browser.
 */
import { useRef } from 'react'
import { Button } from '@components/ui'
import { buildFullBackupPayload, applyFullBackupPayload } from '../gamificationService'
import styles from './BackupExportImport.module.css'

export interface BackupExportImportProps {
  onImportDone: () => void
}

export default function BackupExportImport({ onImportDone }: BackupExportImportProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const payload = buildFullBackupPayload()
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `atas-reuniao-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportClick = () => {
    inputRef.current?.click()
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text) as unknown
      const ok = applyFullBackupPayload(data)
      if (ok) {
        onImportDone()
        alert('Backup importado com sucesso. As atas e conquistas foram restauradas.')
      } else {
        alert('Arquivo inválido. Use um backup exportado por este sistema.')
      }
    } catch (err) {
      alert('Erro ao importar: ' + (err instanceof Error ? err.message : 'arquivo inválido'))
    }
  }

  return (
    <div className={styles.wrap}>
      <input
        ref={inputRef}
        type="file"
        accept=".json"
        onChange={handleImportFile}
        className={styles.hiddenInput}
        aria-label="Importar backup"
      />
      <Button variant="secondary" size="sm" onClick={handleExport} title="Baixar backup (atas + conquistas)">
        Exportar backup
      </Button>
      <Button variant="secondary" size="sm" onClick={handleImportClick} title="Restaurar atas e conquistas de um arquivo">
        Importar backup
      </Button>
    </div>
  )
}
