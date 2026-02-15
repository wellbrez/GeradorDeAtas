/**
 * Painel de conquistas em tela cheia: apenas ícones; ao passar o mouse, tooltip com detalhes.
 */
import { useState, useRef, useEffect } from 'react'
import type { AchievementDefinition } from '../types'
import styles from './AchievementsSidebar.module.css'

export interface AchievementsSidebarProps {
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
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

export default function AchievementsSidebar({
  isOpen,
  onClose,
  definitions,
  unlockedIds,
  unlockedAt,
}: AchievementsSidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const tileRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    if (!hoveredId) return
    const el = tileRefs.current[hoveredId]
    if (!el) return
    const rect = el.getBoundingClientRect()
    const tooltipWidth = 280
    const tooltipHeight = 140
    let x = rect.left + rect.width / 2 - tooltipWidth / 2
    let y = rect.top - tooltipHeight - 12
    const padding = 16
    if (x < padding) x = padding
    if (x + tooltipWidth > window.innerWidth - padding) x = window.innerWidth - tooltipWidth - padding
    if (y < padding) {
      y = rect.bottom + 12
    }
    if (y + tooltipHeight > window.innerHeight - padding) {
      y = rect.top - tooltipHeight - 12
      if (y < padding) y = padding
    }
    setTooltipPos({ x, y })
  }, [hoveredId])

  if (!isOpen) return null

  const praiseworthyDefs = definitions.filter((d) => d.praiseworthy !== false)
  const nonPraiseworthyDefs = definitions.filter((d) => d.praiseworthy === false)
  const nonPraiseworthyUnlockedOnly = nonPraiseworthyDefs.filter((def) => unlockedIds.has(def.id))

  const praiseworthyUnlockedCount = praiseworthyDefs.filter((d) => unlockedIds.has(d.id)).length
  const praiseworthyTotal = praiseworthyDefs.length
  const completionPercent =
    praiseworthyTotal > 0 ? Math.round((praiseworthyUnlockedCount / praiseworthyTotal) * 100) : 0

  const hoveredDef = hoveredId ? definitions.find((d) => d.id === hoveredId) : null

  const renderGrid = (list: AchievementDefinition[]) =>
    list.map((def) => {
      const unlocked = unlockedIds.has(def.id)
      const showSecret = def.secret && !unlocked
      return (
        <div
          key={def.id}
          ref={(el) => { tileRefs.current[def.id] = el }}
          className={`${styles.tile} ${unlocked ? styles.tileUnlocked : styles.tileLocked}`}
          role="listitem"
          aria-label={unlocked ? `Conquista: ${def.name}` : `Conquista bloqueada: ${showSecret ? '???' : def.name}`}
          onMouseEnter={() => setHoveredId(def.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          <span className={styles.icon} aria-hidden>{def.icon}</span>
        </div>
      )
    })

  return (
    <aside className={styles.overlay} aria-label="Conquistas">
      <div className={styles.panel}>
        <header className={styles.header}>
          <h2 className={styles.title}>Conquistas</h2>
          <div className={styles.progressWrap} aria-live="polite">
            <div className={styles.counter}>
              <span className={styles.counterValue}>{praiseworthyUnlockedCount}</span>
              <span className={styles.counterSep}>/</span>
              <span className={styles.counterTotal}>{praiseworthyTotal}</span>
              <span className={styles.counterPercent} aria-label={`${completionPercent}% concluído`}>
                ({completionPercent}%)
              </span>
            </div>
            <div className={styles.progressBarTrack} role="progressbar" aria-valuenow={completionPercent} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso das conquistas">
              <div className={styles.progressBarFill} style={{ width: `${completionPercent}%` }} />
            </div>
          </div>
          <p className={styles.hint}>
            Passe o mouse sobre um ícone para ver os detalhes
          </p>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            title="Fechar"
            aria-label="Fechar conquistas"
          >
            ✕
          </button>
        </header>
        <div className={styles.scroll}>
          <section className={styles.section} aria-label="Conquistas principais">
            <div className={styles.grid}>
              {renderGrid(praiseworthyDefs)}
            </div>
          </section>
          {nonPraiseworthyUnlockedOnly.length > 0 && (
            <section className={styles.section} aria-label="Outras menções">
              <h3 className={styles.sectionTitle}>Outras menções</h3>
              <p className={styles.sectionHint}>Conquistas que não entram na contagem</p>
              <div className={styles.grid}>
                {renderGrid(nonPraiseworthyUnlockedOnly)}
              </div>
            </section>
          )}
        </div>
      </div>

      {hoveredDef && (
        <div
          className={styles.tooltip}
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
          role="tooltip"
          aria-live="polite"
        >
          <div className={styles.tooltipInner}>
            <div className={styles.tooltipHeader}>
              <span className={styles.tooltipIcon} aria-hidden>{hoveredDef.icon}</span>
              <div className={styles.tooltipTitleWrap}>
                <span className={styles.tooltipName}>
                  {hoveredDef.secret && !unlockedIds.has(hoveredDef.id) ? '???' : hoveredDef.name}
                </span>
                {unlockedIds.has(hoveredDef.id) && (
                  <span className={styles.tooltipBadge}>Desbloqueada</span>
                )}
              </div>
            </div>
            <p className={styles.tooltipDesc}>
              {hoveredDef.secret && !unlockedIds.has(hoveredDef.id)
                ? 'Desbloqueie para revelar.'
                : hoveredDef.description}
            </p>
            {unlockedIds.has(hoveredDef.id) && unlockedAt[hoveredDef.id] && (
              <div className={styles.tooltipDate}>
                {formatUnlockedDate(unlockedAt[hoveredDef.id])}
              </div>
            )}
            {hoveredDef.praiseworthy === false && (
              <span className={styles.tooltipNote}>Não conta na pontuação</span>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}
