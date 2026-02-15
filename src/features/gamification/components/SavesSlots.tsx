/**
 * UI dos 3 slots de save (estilo Cookie Clicker): Salvar aqui / Carregar.
 */
import { useCallback, useState } from 'react'
import { Button, ConfirmModal } from '@components/ui'
import { saveToSlot, getSlotPayload, loadFromSlot } from '../gamificationService'
import styles from './SavesSlots.module.css'

export interface SavesSlotsProps {
  /** Chamado após carregar um slot (para refresh da lista) */
  onLoadDone: () => void
}

function formatSavedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function SavesSlots({ onLoadDone }: SavesSlotsProps) {
  const [loadConfirmSlot, setLoadConfirmSlot] = useState<number | null>(null)
  const [slotVersion, setSlotVersion] = useState(0)

  const handleSave = useCallback((slot: number) => {
    saveToSlot(slot)
    setSlotVersion((v) => v + 1)
    setLoadConfirmSlot(null)
  }, [])

  const handleLoadConfirm = useCallback(() => {
    if (loadConfirmSlot === null) return
    const ok = loadFromSlot(loadConfirmSlot)
    setLoadConfirmSlot(null)
    if (ok) onLoadDone()
  }, [loadConfirmSlot, onLoadDone])

  return (
    <div className={styles.wrap}>
      <p className={styles.note}>
        Salve ou carregue um snapshot completo (atas + Selos + conquistas + upgrades). Carregar substitui o progresso atual. O <strong>Slot 1</strong> é sobrescrito automaticamente a cada 1 minuto (backup periódico).
      </p>
      <div className={styles.slots}>
        {[1, 2, 3].map((slot) => {
          const payload = getSlotPayload(slot)
          const savedAt = payload?.exportedAt
          return (
            <div key={`slot-${slot}-${slotVersion}`} className={styles.card}>
              <span className={styles.slotTitle}>Slot {slot}</span>
              {savedAt ? (
                <span className={styles.savedAt}>Salvo em {formatSavedAt(savedAt)}</span>
              ) : (
                <span className={styles.empty}>Vazio</span>
              )}
              <div className={styles.actions}>
                <Button variant="secondary" size="sm" onClick={() => handleSave(slot)}>
                  Salvar aqui
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!payload}
                  onClick={() => setLoadConfirmSlot(slot)}
                >
                  Carregar
                </Button>
              </div>
            </div>
          )
        })}
      </div>
      <ConfirmModal
        isOpen={loadConfirmSlot !== null}
        onClose={() => setLoadConfirmSlot(null)}
        onConfirm={handleLoadConfirm}
        title="Carregar slot"
        message="Isso substituirá todas as atas e o progresso de gamificação atuais. Continuar?"
        confirmLabel="Carregar"
        cancelLabel="Cancelar"
      />
    </div>
  )
}
