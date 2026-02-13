import { useMeetingMinutesList } from '../hooks/useMeetingMinutesList'
import MeetingMinutesCard from './MeetingMinutesCard'
import { Button } from '@components/ui'
import styles from './MeetingMinutesList.module.css'

export interface MeetingMinutesListProps {
  onEdit: (id: string) => void
  onCreate: () => void
  /** Se informado, Copiar abre o formulário em modo cópia; senão, copia imediatamente e atualiza a lista */
  onCopy?: (id: string) => void
}

/**
 * Componente de lista de atas de reunião
 */
export default function MeetingMinutesList({
  onEdit,
  onCreate,
  onCopy: onCopyProp,
}: MeetingMinutesListProps) {
  const { atas, loading, error, remove, copy } = useMeetingMinutesList()

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
        <Button variant="primary" onClick={onCreate}>
          Adicionar nova ata
        </Button>
      </div>

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
