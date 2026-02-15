/**
 * Barra de completude da ata (etapa 2): itens com responsável, participantes, etc.
 */
import type { Item } from '@/types'
import styles from './CompletudeProgress.module.css'

export interface CompletudeProgressProps {
  itens: Item[]
  participantCount: number
}

function hasResponsible(item: Item): boolean {
  const r = item.UltimoHistorico?.responsavel
  return !!(r && (r.nome?.trim() || r.email?.trim()))
}

export default function CompletudeProgress({ itens, participantCount }: CompletudeProgressProps) {
  const totalItens = itens.length
  const withResponsible = totalItens === 0 ? 0 : itens.filter(hasResponsible).length
  const scoreParticipant = Math.min(1, participantCount / 3)
  const scoreItens = totalItens === 0 ? 0 : withResponsible / totalItens
  const percent = totalItens === 0
    ? Math.round(scoreParticipant * 50)
    : Math.round((scoreParticipant * 30) + (scoreItens * 70))
  const isComplete = percent >= 100 && totalItens > 0 && withResponsible === totalItens

  return (
    <div className={styles.wrap}>
      <div className={styles.barWrap}>
        <div className={styles.bar} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <div className={styles.fill} style={{ width: `${percent}%` }} />
        </div>
        <span className={styles.percent}>{percent}%</span>
      </div>
      <div className={styles.label}>
        {isComplete ? (
          <span className={styles.complete}>Ata completa — pronta para arquivar</span>
        ) : (
          <>
            {withResponsible}/{totalItens} itens com responsável
            {participantCount > 0 && ` · ${participantCount} participante(s)`}
          </>
        )}
      </div>
    </div>
  )
}
