import { useEffect, useRef } from 'react'
import { Modal, Button } from '@components/ui'
import styles from './ConfirmModal.module.css'

export interface ConfirmModalProps {
  /** Se o modal está visível */
  isOpen: boolean
  /** Chamado ao fechar (Cancelar, ESC ou overlay) */
  onClose: () => void
  /** Chamado ao confirmar (botão Excluir ou Enter) */
  onConfirm: () => void
  /** Título do modal */
  title: string
  /** Mensagem de confirmação */
  message: string | React.ReactNode
  /** Rótulo do botão de confirmação */
  confirmLabel?: string
  /** Rótulo do botão de cancelar */
  cancelLabel?: string
  /** Variante do botão de confirmação */
  confirmVariant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  /** Se Enter dispara onConfirm. Padrão: true */
  confirmOnEnter?: boolean
  /** Fechar ao clicar no overlay */
  closeOnOverlayClick?: boolean
}

/**
 * Modal de confirmação reutilizável.
 * Substitui window.confirm com UX consistente e suporte a Enter para confirmar.
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Excluir',
  cancelLabel = 'Cancelar',
  confirmVariant = 'danger',
  confirmOnEnter = true,
  closeOnOverlayClick = false,
}: ConfirmModalProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return
    confirmButtonRef.current?.focus()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !confirmOnEnter) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        onConfirm()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, confirmOnEnter, onConfirm])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      closeOnOverlayClick={closeOnOverlayClick}
      closeOnEscape={true}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            ref={confirmButtonRef}
            variant={confirmVariant}
            onClick={onConfirm}
            aria-label={confirmLabel}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className={styles.message}>{message}</div>
    </Modal>
  )
}
