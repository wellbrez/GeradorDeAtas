import { Button } from '@components/ui'
import type { MeetingMinutes } from '@/types'
import { downloadAtaAsHtml, downloadAtaAsJson, printAtaAsPdf } from '../services/exportAta'
import { encodeAtaToHash } from '@/utils/urlAtaImport'
import styles from './MeetingMinutesCard.module.css'

export interface MeetingMinutesCardProps {
  meetingMinutes: MeetingMinutes
  onEdit: (id: string) => void
  onCopy: (id: string) => void
  onDelete: (id: string) => void
}

/**
 * Componente Card para exibir uma ata na lista
 */
export default function MeetingMinutesCard({
  meetingMinutes,
  onEdit,
  onCopy,
  onDelete,
}: MeetingMinutesCardProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('pt-BR')
    } catch {
      return dateString
    }
  }

  const canEdit = () => {
    if (meetingMinutes.arquivada) return false
    try {
      const dataAta = new Date(meetingMinutes.cabecalho.data)
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      const umDiaAtras = new Date(hoje)
      umDiaAtras.setDate(umDiaAtras.getDate() - 1)
      return dataAta >= umDiaAtras
    } catch {
      return false
    }
  }

  const canDelete = () => {
    try {
      const dataAta = new Date(meetingMinutes.cabecalho.data)
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      return dataAta.getTime() === hoje.getTime()
    } catch {
      return false
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.numero}>{meetingMinutes.cabecalho.numero}</h3>
          {meetingMinutes.arquivada && (
            <span className={styles.badgeArquivada}>Arquivada</span>
          )}
          <span className={styles.meta}>
            {meetingMinutes.cabecalho.tipo} - {formatDate(meetingMinutes.cabecalho.data)}
          </span>
        </div>
        {meetingMinutes.cabecalho.titulo && (
          <p className={styles.titulo}>{meetingMinutes.cabecalho.titulo}</p>
        )}
        <div className={styles.info}>
          <span className={styles.infoItem}>
            <strong>Projeto:</strong> {meetingMinutes.cabecalho.projeto || 'Não informado'}
          </span>
          <span className={styles.infoItem}>
            <strong>Responsável:</strong> {meetingMinutes.cabecalho.responsavel || 'Não informado'}
          </span>
          <span className={styles.infoItem}>
            <strong>Participantes:</strong> {meetingMinutes.attendance.length}
          </span>
          <span className={styles.infoItem}>
            <strong>Itens:</strong> {meetingMinutes.itens.length}
          </span>
        </div>
      </div>
      <div className={styles.actions}>
        {canEdit() && (
          <Button variant="primary" size="sm" onClick={() => onEdit(meetingMinutes.id)}>
            Editar
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={() => onCopy(meetingMinutes.id)}>
          Copiar
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={async () => {
            await downloadAtaAsHtml(meetingMinutes)
            await printAtaAsPdf(meetingMinutes)
          }}
          title="Baixar HTML e abrir impressão (Salvar como PDF)"
        >
          Exportar HTML e PDF
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={async () => { await downloadAtaAsHtml(meetingMinutes) }}
          title="Baixar apenas HTML"
        >
          Exportar HTML
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={async () => { await printAtaAsPdf(meetingMinutes) }}
          title="Abrir impressão (Salvar como PDF)"
        >
          Exportar PDF
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => downloadAtaAsJson(meetingMinutes)}
          title="Baixar JSON da ata"
        >
          Exportar JSON
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={async () => {
            const baseUrl = window.location.origin + window.location.pathname
            const hash = encodeAtaToHash(meetingMinutes)
            const link = `${baseUrl}#${hash}`
            try {
              await navigator.clipboard.writeText(link)
              alert('Link copiado! Quem acessar abrirá esta ata diretamente.')
            } catch {
              alert('Não foi possível copiar o link.')
            }
          }}
          title="Gerar link compartilhável (#base64). Ao acessar, a ata será importada automaticamente."
        >
          Copiar link
        </Button>
        {canDelete() && (
          <Button variant="danger" size="sm" onClick={() => onDelete(meetingMinutes.id)}>
            Excluir
          </Button>
        )}
      </div>
    </div>
  )
}
