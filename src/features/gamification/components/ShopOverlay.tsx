/**
 * Loja em tela cheia (full page), mesmo padrão das Conquistas.
 * Cards bem definidos para cada upgrade; mostra todos (desbloqueados e bloqueados).
 */
import { Button } from '@components/ui'
import UpgradeIcon from './UpgradeIcon'
import type { UpgradeDefinition } from '../types'
import type { UpgradeId } from '../types'
import { formatSelos } from '../gamificationService'
import styles from './ShopOverlay.module.css'

export interface ShopOverlayProps {
  isOpen: boolean
  onClose: () => void
  lifetimeSelos: number
  upgradesOwned: Record<UpgradeId, number>
  buyUpgrade: (id: UpgradeId) => boolean
  getUpgradeCost: (id: UpgradeId) => number
  /** Todas as definições (para exibir catálogo completo em full page) */
  definitions: UpgradeDefinition[]
}

export default function ShopOverlay({
  isOpen,
  onClose,
  lifetimeSelos,
  upgradesOwned,
  buyUpgrade,
  getUpgradeCost,
  definitions,
}: ShopOverlayProps) {
  if (!isOpen) return null

  return (
    <aside className={styles.overlay} aria-label="Loja de upgrades">
      <div className={styles.panel}>
        <header className={styles.header}>
          <h2 className={styles.title}>Loja</h2>
          <div className={styles.selosWrap}>
            <span className={styles.selosLabel}>Seus Selos</span>
            <span className={styles.selosValue}>{formatSelos(lifetimeSelos, 'standard')}</span>
          </div>
          <p className={styles.hint}>
            Gaste Selos em upgrades para ganhar mais Selos a cada ata. Ganho exponencial por unidade.
          </p>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            title="Fechar"
            aria-label="Fechar loja"
          >
            ✕
          </button>
        </header>
        <div className={styles.scroll}>
          <section className={styles.section} aria-label="Upgrades disponíveis">
            <div className={styles.grid}>
              {definitions.map((def) => {
                const isUnlocked = lifetimeSelos >= def.unlockAtLifetimeSelos
                const owned = upgradesOwned[def.id] ?? 0
                const cost = getUpgradeCost(def.id)
                const canBuy = isUnlocked && lifetimeSelos >= cost
                return (
                  <article
                    key={def.id}
                    className={`${styles.card} ${isUnlocked ? '' : styles.cardLocked}`}
                  >
                    <div className={styles.cardIcon}>
                      <UpgradeIcon iconKey={def.icon} size={44} />
                    </div>
                    <div className={styles.cardBody}>
                      <h3 className={styles.cardName}>{def.name}</h3>
                      <p className={styles.cardLore}>{def.lore}</p>
                      <p className={styles.cardDesc}>{def.description}</p>
                      {owned > 0 && (
                        <p className={styles.cardOwned}>Possuídos: {owned}</p>
                      )}
                      {!isUnlocked && (
                        <p className={styles.cardUnlock}>
                          Desbloqueie ao atingir {formatSelos(def.unlockAtLifetimeSelos, 'standard')} Selos
                        </p>
                      )}
                    </div>
                    <div className={styles.cardActions}>
                      {isUnlocked ? (
                        <>
                          <span className={styles.cost}>{formatSelos(cost, 'standard')} Selos</span>
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={!canBuy}
                            onClick={() => buyUpgrade(def.id)}
                          >
                            Comprar
                          </Button>
                        </>
                      ) : (
                        <span className={styles.lockedLabel}>Bloqueado</span>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        </div>
      </div>
    </aside>
  )
}
