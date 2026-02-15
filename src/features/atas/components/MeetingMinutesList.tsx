import { useRef, useState, useMemo, useCallback, useEffect } from 'react'
import { useMeetingMinutesList } from '../hooks/useMeetingMinutesList'
import MeetingMinutesListByProject from './MeetingMinutesListByProject'
import MeetingMinutesListFilters, {
  INITIAL_FILTERS,
  type MeetingMinutesFiltersState,
} from './MeetingMinutesListFilters'
import { Button, ConfirmModal } from '@components/ui'
import { createMeetingMinutes } from '../services/meetingMinutesService'
import { parseAtaFromHtml } from '../services/exportAta'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import {
  useGamification,
  StatsCard,
  GamificationCorner,
  AchievementToast,
  ShopSidebar,
  AchievementsSidebar,
  SavesSidebar,
  saveToSlot,
  useSelosEarned,
} from '@features/gamification'
import type { CornerPanel } from '@features/gamification'
import type { MeetingMinutes, MeetingMinutesStorage } from '@/types'
import styles from './MeetingMinutesList.module.css'

export interface MeetingMinutesListProps {
  /** Quando false, toda a UI de gamificação (loja, conquistas, Selos, saves) fica oculta */
  gamificationEnabled?: boolean
  onEdit: (id: string) => void
  onCreate: () => void
  /** Se informado, Copiar abre o formulário em modo cópia; senão, copia imediatamente e atualiza a lista */
  onCopy?: (id: string) => void
}

function parseJsonToStorage(json: unknown): MeetingMinutesStorage | null {
  if (!json || typeof json !== 'object') return null
  const o = json as Record<string, unknown>
  if (o.cabecalho && o.attendance && Array.isArray(o.attendance) && o.itens && Array.isArray(o.itens)) {
    return {
      cabecalho: o.cabecalho as MeetingMinutesStorage['cabecalho'],
      attendance: o.attendance as MeetingMinutesStorage['attendance'],
      itens: o.itens as MeetingMinutesStorage['itens'],
    }
  }
  return null
}

/**
 * Filtra atas conforme critérios (busca, tipo, arquivada, período).
 * Usa busca com debounce aplicado no componente.
 */
function filterAtas(
  atas: MeetingMinutes[],
  filters: MeetingMinutesFiltersState,
  debouncedSearch: string
): MeetingMinutes[] {
  return atas.filter((ata) => {
    if (filters.arquivada === 'ativas' && ata.arquivada) return false
    if (filters.arquivada === 'arquivadas' && !ata.arquivada) return false

    if (filters.tipo && ata.cabecalho.tipo !== filters.tipo) return false

    const dataAta = ata.cabecalho.data ? new Date(ata.cabecalho.data) : null
    if (filters.dataInicio && dataAta) {
      const inicio = new Date(filters.dataInicio)
      inicio.setHours(0, 0, 0, 0)
      if (dataAta < inicio) return false
    }
    if (filters.dataFim && dataAta) {
      const fim = new Date(filters.dataFim)
      fim.setHours(23, 59, 59, 999)
      if (dataAta > fim) return false
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim()
      const numero = (ata.cabecalho.numero || '').toLowerCase()
      const titulo = (ata.cabecalho.titulo || '').toLowerCase()
      const projeto = (ata.cabecalho.projeto || '').toLowerCase()
      const responsavel = (ata.cabecalho.responsavel || '').toLowerCase()
      const participantes = ata.attendance
        .map((p) => (p.nome || '') + ' ' + (p.email || ''))
        .join(' ')
        .toLowerCase()
      const searchable = [numero, titulo, projeto, responsavel, participantes].join(' ')
      if (!searchable.includes(q)) return false
    }

    return true
  })
}

/**
 * Componente de lista de atas de reunião
 */
const CONFIRM_DELETE_TITLE = 'Confirmar exclusão'
const CONFIRM_DELETE_MESSAGE =
  'Tem certeza que deseja EXCLUIR esta ata? Esta ação não pode ser desfeita e todos os dados serão perdidos permanentemente.'

export default function MeetingMinutesList({
  gamificationEnabled = true,
  onEdit,
  onCreate,
  onCopy: onCopyProp,
}: MeetingMinutesListProps) {
  const { atas, loading, error, remove, copy, refresh } = useMeetingMinutesList()
  const [importError, setImportError] = useState<string | null>(null)
  const [filters, setFilters] = useState<MeetingMinutesFiltersState>(INITIAL_FILTERS)
  const [ataToDelete, setAtaToDelete] = useState<string | null>(null)
  const [cornerPanel, setCornerPanel] = useState<CornerPanel | null>(null)
  const [shopExpanded, setShopExpanded] = useState(true)
  const htmlInputRef = useRef<HTMLInputElement>(null)
  const jsonInputRef = useRef<HTMLInputElement>(null)
  const showSelos = useSelosEarned()

  const gamification = useGamification(atas)
  const {
    stats,
    definitions,
    unlockedIds,
    unlockedAt,
    newlyUnlocked,
    clearNewlyUnlocked,
    lifetimeSelos,
    upgradesOwned,
    buyUpgrade,
    getUpgradeCost,
    unlockedUpgradeDefinitions,
  } = gamification
  /** Pilha de toasts de conquistas: um por conquista, 6s cada, clique para fechar */
  const [achievementToastStack, setAchievementToastStack] = useState<{ id: string; def: (typeof definitions)[0] }[]>([])
  const newlyUnlockedDefs = useMemo(
    () => definitions.filter((d) => newlyUnlocked.includes(d.id)),
    [definitions, newlyUnlocked]
  )
  useEffect(() => {
    if (newlyUnlockedDefs.length === 0) return
    const newItems = newlyUnlockedDefs.map((def) => ({ id: `${def.id}-${Date.now()}-${Math.random()}`, def }))
    setAchievementToastStack((prev) => [...prev, ...newItems])
    clearNewlyUnlocked()
  }, [newlyUnlockedDefs.length, clearNewlyUnlocked])
  const dismissAchievementToast = useCallback((id: string) => {
    setAchievementToastStack((prev) => prev.filter((t) => t.id !== id))
  }, [])

  /** Salvamento completo periódico a cada 1 minuto (slot 1) quando gamificação ativa */
  useEffect(() => {
    if (!gamificationEnabled) return
    const intervalMs = 60 * 1000
    const interval = setInterval(() => saveToSlot(1), intervalMs)
    return () => clearInterval(interval)
  }, [gamificationEnabled])

  const debouncedSearch = useDebouncedValue(filters.search, 300)
  const filteredAtas = useMemo(
    () => filterAtas(atas, filters, debouncedSearch),
    [atas, filters, debouncedSearch]
  )

  const handleClearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS)
  }, [])

  const handleDeleteClick = useCallback((id: string) => {
    setAtaToDelete(id)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (ataToDelete) {
      await remove(ataToDelete)
      setAtaToDelete(null)
    }
  }, [ataToDelete, remove])

  const handleDeleteCancel = useCallback(() => {
    setAtaToDelete(null)
  }, [])

  const handleCopy = async (id: string) => {
    if (onCopyProp) {
      onCopyProp(id)
      return
    }
    const copied = await copy(id)
    if (copied) {
      alert('Ata copiada com sucesso!')
    }
  }

  const handleImportHtml = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    setImportError(null)
    if (!file) return
    try {
      const text = await file.text()
      const ata = parseAtaFromHtml(text)
      if (!ata) {
        setImportError('Arquivo HTML inválido ou não contém ata exportada por esta plataforma.')
        return
      }
      const storage: MeetingMinutesStorage = {
        cabecalho: ata.cabecalho,
        attendance: ata.attendance,
        itens: ata.itens,
      }
      const created = createMeetingMinutes(storage)
      refresh()
      showSelos?.(3)
      onEdit(created.id)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Erro ao importar HTML.')
    }
  }

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    setImportError(null)
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text) as unknown
      const storage = parseJsonToStorage(data)
      if (!storage) {
        setImportError('JSON inválido. Esperado: cabecalho, attendance, itens.')
        return
      }
      const created = createMeetingMinutes(storage)
      refresh()
      showSelos?.(3)
      onEdit(created.id)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Erro ao importar JSON.')
    }
  }

  const handleCreate = (e: React.MouseEvent) => {
    showSelos?.(1, { clientX: e.clientX, clientY: e.clientY })
    onCreate()
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando atas...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Erro ao carregar atas: {error}</p>
          <Button onClick={() => window.location.reload()}>Recarregar</Button>
        </div>
      </div>
    )
  }

  return (
    <div className={gamificationEnabled ? styles.pageWithSidebar : styles.listPage}>
      <div className={gamificationEnabled ? styles.mainContent : styles.listPage}>
      <section className={styles.hero}>
        <h2 className={styles.heroTitle}>Atas de Reunião</h2>
        <p className={styles.heroSubtitle}>
          {atas.length === 0
            ? 'Organize e arquive as discussões das suas reuniões.'
            : `${atas.length} ata${atas.length !== 1 ? 's' : ''} · Gerencie e exporte quando quiser.`}
        </p>
      </section>

      <section className={`${styles.dashboard} ${gamificationEnabled ? styles.dashboardWithGamification : ''}`}>
        {gamificationEnabled && (
          <div className={styles.statsPanel}>
            <div className={styles.statsPanelInner}>
              <StatsCard stats={stats} monthlyGoal={4} />
            </div>
          </div>
        )}
        <div className={styles.importExportPanel}>
          <span className={styles.importExportTitle}>Importar</span>
          <div className={styles.importExportActions}>
            <input
              ref={htmlInputRef}
              type="file"
              accept=".html"
              onChange={handleImportHtml}
              className={styles.hiddenFileInput}
              aria-label="Importar HTML"
            />
            <input
              ref={jsonInputRef}
              type="file"
              accept=".json"
              onChange={handleImportJson}
              className={styles.hiddenFileInput}
              aria-label="Importar JSON"
            />
            <button
              type="button"
              className={styles.iconImportBtn}
              onClick={() => jsonInputRef.current?.click()}
              title="Importar ata a partir de arquivo JSON"
              aria-label="Importar JSON"
            >
              📄
            </button>
            <button
              type="button"
              className={styles.iconImportBtn}
              onClick={() => htmlInputRef.current?.click()}
              title="Importar ata a partir de HTML exportado"
              aria-label="Importar HTML"
            >
              🌐
            </button>
          </div>
        </div>
        <div className={styles.primaryCta}>
          <button
            type="button"
            onClick={(e) => handleCreate(e)}
            className={styles.primaryCtaButton}
            title="Adicionar nova ata"
            aria-label="Adicionar nova ata"
          >
            <span className={styles.primaryCtaIcon} aria-hidden>➕</span>
            <span className={styles.primaryCtaText}>Nova ata</span>
          </button>
        </div>
      </section>

      {importError && (
        <div className={styles.importError} role="alert">
          {importError}
        </div>
      )}

      {atas.length > 0 && (
        <MeetingMinutesListFilters
          atas={atas}
          filters={filters}
          onFiltersChange={setFilters}
          onClear={handleClearFilters}
          resultCount={filteredAtas.length}
        />
      )}

      {atas.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>Nenhuma ata cadastrada ainda.</p>
          <Button variant="primary" onClick={handleCreate} className={styles.emptyCta}>
            Criar primeira ata
          </Button>
        </div>
      ) : filteredAtas.length === 0 ? (
        <div className={styles.empty}>
          <p>Nenhuma ata encontrada com os filtros aplicados.</p>
          <Button variant="secondary" onClick={handleClearFilters}>
            Limpar filtros
          </Button>
        </div>
      ) : (
        <MeetingMinutesListByProject
          atas={filteredAtas}
          onEdit={onEdit}
          onCopy={handleCopy}
          onDelete={handleDeleteClick}
          onAwardSelos={showSelos ?? undefined}
        />
      )}

      </div>
      {gamificationEnabled && (
        <>
          <GamificationCorner
            levelIcon={stats.level.icon}
            activePanel={cornerPanel}
            onOpen={(panel) => {
              setCornerPanel((prev) => (prev === panel ? null : panel))
              if (panel === 'shop') setShopExpanded(true)
            }}
          />
          <AchievementsSidebar
            isOpen={cornerPanel === 'achievements'}
            onClose={() => setCornerPanel(null)}
            definitions={definitions}
            unlockedIds={unlockedIds}
            unlockedAt={unlockedAt}
          />
          <ShopSidebar
            isOpen={cornerPanel === 'shop'}
            isExpanded={shopExpanded}
            onClose={() => setCornerPanel(null)}
            onToggleExpand={() => setShopExpanded((s) => !s)}
            lifetimeSelos={lifetimeSelos}
            upgradesOwned={upgradesOwned}
            buyUpgrade={buyUpgrade}
            getUpgradeCost={getUpgradeCost}
            definitions={unlockedUpgradeDefinitions}
          />
          <SavesSidebar
            isOpen={cornerPanel === 'saves'}
            onClose={() => setCornerPanel(null)}
            onLoadDone={refresh}
          />
        </>
      )}

      <ConfirmModal
        isOpen={ataToDelete !== null}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={CONFIRM_DELETE_TITLE}
        message={CONFIRM_DELETE_MESSAGE}
        confirmLabel="Excluir"
        closeOnOverlayClick={false}
      />

      {gamificationEnabled && achievementToastStack.length > 0 && (
        <div className={styles.achievementToastStack} aria-label="Conquistas desbloqueadas">
          {achievementToastStack.map(({ id, def }) => (
            <AchievementToast
              key={id}
              achievement={def}
              onDismiss={() => dismissAchievementToast(id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
