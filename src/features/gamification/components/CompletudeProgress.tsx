/**
 * Barra de completude da ata (etapa 2).
 * Base: todos os itens folha (sem filhos). Pendente/Em Andamento exigem descrição + responsável + data válida;
 * Concluído, Cancelado e Info exigem apenas descrição para contar como completos.
 */
import type { Item, ItemStatus } from '@/types'
import styles from './CompletudeProgress.module.css'

export interface CompletudeProgressProps {
  itens: Item[]
  participantCount: number
}

const STATUS_PENDENTE_EM_ANDAMENTO: ItemStatus[] = ['Pendente', 'Em Andamento']

function hasResponsible(item: Item): boolean {
  const r = item.UltimoHistorico?.responsavel
  return !!(r && (r.nome?.trim() || r.email?.trim()))
}

function hasDescription(item: Item): boolean {
  const raw = item.UltimoHistorico?.descricao ?? ''
  const text = raw.replace(/<[^>]*>/g, '').trim()
  return !!text
}

/** Data presente e não vencida (>= hoje). */
function hasValidData(item: Item): boolean {
  const data = item.UltimoHistorico?.data
  if (!data) return false
  try {
    const d = new Date(data.split('T')[0])
    d.setHours(0, 0, 0, 0)
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    return d.getTime() >= hoje.getTime()
  } catch {
    return false
  }
}

/** Todos os itens folha (sem filhos) — base da contagem. */
function itensContabilizados(itens: Item[]): Item[] {
  return itens.filter((item) => (item.filhos?.length ?? 0) === 0)
}

/** Pendente/Em Andamento: descrição + responsável + data válida. Concluído/Cancelado/Info: apenas descrição. */
function itemCompleto(item: Item): boolean {
  const status = item.UltimoHistorico?.status
  const exigeTudo = status && STATUS_PENDENTE_EM_ANDAMENTO.includes(status)
  if (exigeTudo) return hasDescription(item) && hasResponsible(item) && hasValidData(item)
  return hasDescription(item)
}

export default function CompletudeProgress({ itens, participantCount }: CompletudeProgressProps) {
  const base = itensContabilizados(itens)
  const totalItens = base.length
  const withComplete =
    totalItens === 0 ? 0 : base.filter(itemCompleto).length
  const scoreParticipant = Math.min(1, participantCount / 3)
  const scoreItens = totalItens === 0 ? 0 : withComplete / totalItens
  const percent = totalItens === 0
    ? Math.round(scoreParticipant * 50)
    : Math.round((scoreParticipant * 30) + (scoreItens * 70))
  const isComplete = totalItens > 0 && withComplete === totalItens

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
            {withComplete}/{totalItens} itens com dados preenchidos
            {participantCount > 0 && ` · ${participantCount} participante(s)`}
          </>
        )}
      </div>
    </div>
  )
}
