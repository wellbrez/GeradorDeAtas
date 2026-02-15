/**
 * Overlay de celebração ao salvar ata (mensagem + partículas leves).
 */
import { useEffect, useState } from 'react'
import styles from './Celebration.module.css'

export interface CelebrationProps {
  /** Mensagem principal (ex: "Ata salva!") */
  title: string
  /** Mensagem secundária (ex: "+5 Selos · Obrigado...") */
  subtitle?: string
  /** Duração em ms antes de chamar onDone */
  duration?: number
  onDone: () => void
}

const COLORS = ['#007e7a', '#c9a227', '#2e7d32', '#e65100']

export default function Celebration({
  title,
  subtitle,
  duration = 2200,
  onDone,
}: CelebrationProps) {
  const [particles] = useState(() =>
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      color: COLORS[i % COLORS.length],
    }))
  )

  useEffect(() => {
    const t = setTimeout(onDone, duration)
    return () => clearTimeout(t)
  }, [duration, onDone])

  return (
    <div className={styles.overlay} aria-live="polite">
      <div className={styles.particles}>
        {particles.map((p) => (
          <div
            key={p.id}
            className={styles.particle}
            style={{
              left: `${p.left}%`,
              backgroundColor: p.color,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>
      <div className={styles.message}>
        <div className={styles.title}>{title}</div>
        {subtitle && <div className={styles.sub}>{subtitle}</div>}
      </div>
    </div>
  )
}
