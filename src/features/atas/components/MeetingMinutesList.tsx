import { useRef, useState } from 'react'
import { useMeetingMinutesList } from '../hooks/useMeetingMinutesList'
import MeetingMinutesCard from './MeetingMinutesCard'
import { Button } from '@components/ui'
import { createMeetingMinutes } from '../services/meetingMinutesService'
import { parseAtaFromHtml } from '../services/exportAta'
import type { MeetingMinutesStorage } from '@/types'
import styles from './MeetingMinutesList.module.css'

export interface MeetingMinutesListProps {
  onEdit: (id: string) => void
  onCreate: () => void
  /** Se informado, Copiar abre o formulário em modo cópia; senão, copia imediatamente e atualiza a lista */
  onCopy?: (id: string) => void
}

function parseJsonToStorage(json: unknown): MeetingMinutesStorage | null {
  if (!json || typeof json !== 'object') return null
  const o = json as Record<string, unknown>
  if (o.cabecalho && o.attendance && Array.isArray(o.attendance) && o.itens && Array.isArray(o.itens)) {
    return {
      cabecalho: o.cabecalho as MeetingMinutesStorage['cabecalho'],
      attendance: o.attendance as MeetingMinutesStorage['attendance'],
      itens: o.itens as MeetingMinutesStorage['itens'],
    }
  }
  return null
}

/**
 * Componente de lista de atas de reunião
 */
export default function MeetingMinutesList({
  onEdit,
  onCreate,
  onCopy: onCopyProp,
}: MeetingMinutesListProps) {
  const { atas, loading, error, remove, copy, refresh } = useMeetingMinutesList()
  const [importError, setImportError] = useState<string | null>(null)
  const htmlInputRef = useRef<HTMLInputElement>(null)
  const jsonInputRef = useRef<HTMLInputElement>(null)

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta ata?')) {
      await remove(id)
    }
  }

  const handleCopy = async (id: string) => {
    if (onCopyProp) {
      onCopyProp(id)
      return
    }
    const copied = await copy(id)
    if (copied) {
      alert('Ata copiada com sucesso!')
    }
  }

  const handleImportHtml = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    setImportError(null)
    if (!file) return
    try {
      const text = await file.text()
      const ata = parseAtaFromHtml(text)
      if (!ata) {
        setImportError('Arquivo HTML inválido ou não contém ata exportada por esta plataforma.')
        return
      }
      const storage: MeetingMinutesStorage = {
        cabecalho: ata.cabecalho,
        attendance: ata.attendance,
        itens: ata.itens,
      }
      const created = createMeetingMinutes(storage)
      refresh()
      onEdit(created.id)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Erro ao importar HTML.')
    }
  }

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    setImportError(null)
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text) as unknown
      const storage = parseJsonToStorage(data)
      if (!storage) {
        setImportError('JSON inválido. Esperado: cabecalho, attendance, itens.')
        return
      }
      const created = createMeetingMinutes(storage)
      refresh()
      onEdit(created.id)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Erro ao importar JSON.')
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando atas...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Erro ao carregar atas: {error}</p>
          <Button onClick={() => window.location.reload()}>Recarregar</Button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Atas de Reunião</h2>
        <div className={styles.headerActions}>
          <input
            ref={htmlInputRef}
            type="file"
            accept=".html"
            onChange={handleImportHtml}
            className={styles.hiddenFileInput}
            aria-label="Importar HTML"
          />
          <input
            ref={jsonInputRef}
            type="file"
            accept=".json"
            onChange={handleImportJson}
            className={styles.hiddenFileInput}
            aria-label="Importar JSON"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => jsonInputRef.current?.click()}
            title="Importar ata a partir de arquivo JSON"
          >
            Importar JSON
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => htmlInputRef.current?.click()}
            title="Importar ata a partir de HTML exportado"
          >
            Importar HTML
          </Button>
          <Button variant="primary" onClick={onCreate}>
            Adicionar nova ata
          </Button>
        </div>
      </div>
      {importError && (
        <div className={styles.importError} role="alert">
          {importError}
        </div>
      )}

      {atas.length === 0 ? (
        <div className={styles.empty}>
          <p>Nenhuma ata cadastrada ainda.</p>
          <Button variant="primary" onClick={onCreate}>
            Criar primeira ata
          </Button>
        </div>
      ) : (
        <div className={styles.list}>
          {atas.map((ata) => (
            <MeetingMinutesCard
              key={ata.id}
              meetingMinutes={ata}
              onEdit={onEdit}
              onCopy={handleCopy}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
