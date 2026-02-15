/**
 * Modal da loja: comprar upgrades com Selos (multiplicadores por ata).
 */
import Modal from '@components/ui/Modal'
import { Button } from '@components/ui'
import type { UpgradeDefinition } from '../types'
import type { UpgradeId } from '../types'
import { formatSelos } from '../gamificationService'
import styles from './ShopModal.module.css'

export interface ShopModalProps {
  isOpen: boolean
  onClose: () => void
  lifetimeSelos: number
  upgradesOwned: Record<UpgradeId, number>
  buyUpgrade: (id: UpgradeId) => boolean
  getUpgradeCost: (id: UpgradeId) => number
  definitions: UpgradeDefinition[]
}

export default function ShopModal({
  isOpen,
  onClose,
  lifetimeSelos,
  upgradesOwned,
  buyUpgrade,
  getUpgradeCost,
  definitions,
}: ShopModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Loja" size="lg">
      <p className={styles.headerNote}>
        Gaste Selos em upgrades para ganhar mais Selos a cada ata salva. Os Selos não decaem ao descartar atas.
      </p>
      <div className={styles.selosDisplay}>
        <span className={styles.selosLabel}>Seus Selos:</span>
        <span className={styles.selosValue}>{formatSelos(lifetimeSelos, 'standard')}</span>
      </div>
      <div className={styles.list}>
        {definitions.map((def) => {
          const owned = upgradesOwned[def.id] ?? 0
          const cost = getUpgradeCost(def.id)
          const canBuy = lifetimeSelos >= cost
          return (
            <div key={def.id} className={canBuy ? styles.row : `${styles.row} ${styles.rowDisabled}`}>
              <span className={styles.icon} aria-hidden="true">{def.icon}</span>
              <div className={styles.info}>
                <div className={styles.name}>{def.name}</div>
                <div className={styles.desc}>{def.description}</div>
                {owned > 0 && <div className={styles.owned}>Owned: {owned}</div>}
              </div>
              <span className={styles.cost}>{formatSelos(cost, 'standard')} Selos</span>
              <div className={styles.buy}>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!canBuy}
                  onClick={() => buyUpgrade(def.id)}
                >
                  Comprar
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}
