/**
 * Modal com os 3 slots de save (Salvar / Carregar).
 */
import Modal from '@components/ui/Modal'
import SavesSlots from './SavesSlots'

export interface SavesModalProps {
  isOpen: boolean
  onClose: () => void
  onLoadDone: () => void
}

export default function SavesModal({ isOpen, onClose, onLoadDone }: SavesModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Saves" size="lg">
      <SavesSlots onLoadDone={() => { onLoadDone(); onClose() }} />
    </Modal>
  )
}
