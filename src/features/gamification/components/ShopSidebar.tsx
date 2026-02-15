/**
 * Loja como sidebar direita: retrátil/expansível, ícones personalizados, lore e apenas upgrades desbloqueados.
 */
import { Button } from '@components/ui'
import UpgradeIcon from './UpgradeIcon'
import type { UpgradeDefinition } from '../types'
import type { UpgradeId } from '../types'
import { formatSelos } from '../gamificationService'
import styles from './ShopSidebar.module.css'

export interface ShopSidebarProps {
  /** Sidebar visível (aberta); quando false não renderiza */
  isOpen: boolean
  /** Expandida (painel largo) vs recolhida (faixa fina) */
  isExpanded: boolean
  onClose: () => void
  onToggleExpand: () => void
  lifetimeSelos: number
  upgradesOwned: Record<UpgradeId, number>
  buyUpgrade: (id: UpgradeId) => boolean
  getUpgradeCost: (id: UpgradeId) => number
  /** Apenas definições já desbloqueadas para exibir */
  definitions: UpgradeDefinition[]
}

export default function ShopSidebar({
  isOpen,
  isExpanded,
  onClose,
  onToggleExpand,
  lifetimeSelos,
  upgradesOwned,
  buyUpgrade,
  getUpgradeCost,
  definitions,
}: ShopSidebarProps) {
  if (!isOpen) return null

  return (
    <aside
      className={`${styles.sidebar} ${isExpanded ? styles.sidebarExpanded : styles.sidebarCollapsed}`}
      aria-label="Loja de upgrades"
    >
      {/* Faixa recolhida: ícone + expandir */}
      <div className={styles.collapsedStrip} aria-hidden={isExpanded}>
        <button
          type="button"
          className={styles.collapsedBtn}
          onClick={onToggleExpand}
          title="Expandir loja"
          aria-label="Expandir loja"
        >
          <span className={styles.collapsedIcon} aria-hidden>🛒</span>
          <span className={styles.collapsedLabel}>Loja</span>
        </button>
      </div>

      {/* Painel expandido */}
      <div className={styles.panel} aria-hidden={!isExpanded}>
        <header className={styles.header}>
          <h2 className={styles.title}>Loja</h2>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={onToggleExpand}
              title="Recolher"
              aria-label="Recolher loja"
            >
              ◀
            </button>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={onClose}
              title="Fechar"
              aria-label="Fechar loja"
            >
              ✕
            </button>
          </div>
        </header>
        <p className={styles.hint}>
          Gaste Selos em upgrades para ganhar mais Selos a cada ata. Ganho exponencial por unidade.
        </p>
        <div className={styles.selosBox}>
          <span className={styles.selosLabel}>Seus Selos</span>
          <span className={styles.selosValue}>{formatSelos(lifetimeSelos, 'standard')}</span>
        </div>
        <div className={styles.list}>
          {definitions.length === 0 ? (
            <p className={styles.empty}>Junte mais Selos para desbloquear novos itens.</p>
          ) : (
            definitions.map((def) => {
              const owned = upgradesOwned[def.id] ?? 0
              const cost = getUpgradeCost(def.id)
              const canBuy = lifetimeSelos >= cost
              return (
                <article
                  key={def.id}
                  className={`${styles.card} ${canBuy ? '' : styles.cardDisabled}`}
                >
                  <div className={styles.cardIcon}>
                    <UpgradeIcon iconKey={def.icon} size={36} />
                  </div>
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardName}>{def.name}</h3>
                    <p className={styles.cardLore}>{def.lore}</p>
                    <p className={styles.cardDesc}>{def.description}</p>
                    {owned > 0 && (
                      <p className={styles.cardOwned}>Possuídos: {owned}</p>
                    )}
                  </div>
                  <div className={styles.cardActions}>
                    <span className={styles.cost}>{formatSelos(cost, 'standard')} Selos</span>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={!canBuy}
                      onClick={() => buyUpgrade(def.id)}
                    >
                      Comprar
                    </Button>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </div>
    </aside>
  )
}
