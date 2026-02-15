/**
 * Toast discreto "+ X,XXX" ao ganhar Selos, posicionado ao lado do ponteiro do mouse.
 */
import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { awardSelos, formatSelosForDisplay } from '../gamificationService'
import { getGamificationEnabled } from '../preferences'
import styles from './SelosEarnedToast.module.css'

const TOAST_DURATION_MS = 2000
const POINTER_OFFSET_PX = 14

export type SelosEarnedPosition = { clientX: number; clientY: number }

/** (baseAmount, position?) — position opcional (ex.: event do clique) para exibir ao lado do mouse */
type ShowSelosEarned = (baseAmount: number, position?: SelosEarnedPosition) => void

const SelosEarnedContext = createContext<ShowSelosEarned | null>(null)

export function useSelosEarned(): ShowSelosEarned | undefined {
  const value = useContext(SelosEarnedContext)
  return value ?? undefined
}

export interface SelosEarnedToastProviderProps {
  children: React.ReactNode
}

export function SelosEarnedToastProvider({ children }: SelosEarnedToastProviderProps) {
  const [toast, setToast] = useState<{ text: string; x: number; y: number } | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showSelosEarned = useCallback((baseAmount: number, position?: SelosEarnedPosition) => {
    if (!getGamificationEnabled()) return
    const earned = awardSelos(baseAmount)
    if (earned <= 0) return
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    const x = position ? position.clientX + POINTER_OFFSET_PX : window.innerWidth / 2 - 24
    const y = position ? position.clientY + POINTER_OFFSET_PX : window.innerHeight / 2 - 12
    setToast({ text: `+ ${formatSelosForDisplay(earned)}`, x, y })
    timeoutRef.current = setTimeout(() => {
      setToast(null)
      timeoutRef.current = null
    }, TOAST_DURATION_MS)
  }, [])

  return (
    <SelosEarnedContext.Provider value={showSelosEarned}>
      {children}
      {toast && (
        <div
          className={styles.toast}
          role="status"
          aria-live="polite"
          style={{ left: toast.x, top: toast.y }}
        >
          {toast.text}
        </div>
      )}
    </SelosEarnedContext.Provider>
  )
}
