import { useRef, useState, useMemo, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useMeetingMinutesList } from '../hooks/useMeetingMinutesList'
import MeetingMinutesListByProject from './MeetingMinutesListByProject'
import MeetingMinutesListFilters, {
  INITIAL_FILTERS,
  type MeetingMinutesFiltersState,
} from './MeetingMinutesListFilters'
import { Button, ConfirmModal, Modal } from '@components/ui'
import { PROMPT_IA_ATA } from '../constants/promptIaAta'
import { createMeetingMinutes } from '../services/meetingMinutesService'
import { parseAtaFromHtml } from '../services/exportAta'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import {
  useGamification,
  StatsCard,
  GamificationCorner,
  AchievementToast,
  ShopOverlay,
  AchievementsSidebar,
  SavesOverlay,
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
  const htmlInputRef = useRef<HTMLInputElement>(null)
  const jsonInputRef = useRef<HTMLInputElement>(null)
  const newAtaButtonRef = useRef<HTMLButtonElement>(null)
  const listSectionRef = useRef<HTMLDivElement>(null)
  const [newAtaMenuOpen, setNewAtaMenuOpen] = useState(false)
  const [newAtaMenuAnchor, setNewAtaMenuAnchor] = useState<DOMRect | null>(null)
  const newAtaMenuRef = useRef<HTMLDivElement>(null)
  const [showImportFromIAPopup, setShowImportFromIAPopup] = useState(false)
  const [promptCopied, setPromptCopied] = useState(false)
  const showSelos = useSelosEarned()

  const handleCopyPrompt = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(PROMPT_IA_ATA)
      setPromptCopied(true)
      setTimeout(() => setPromptCopied(false), 2000)
    } catch {
      // fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = PROMPT_IA_ATA
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setPromptCopied(true)
      setTimeout(() => setPromptCopied(false), 2000)
    }
  }, [])

  const handleOpenImportFromIA = useCallback(() => {
    setNewAtaMenuOpen(false)
    setShowImportFromIAPopup(true)
  }, [])

  const handleCloseImportFromIA = useCallback(() => {
    setShowImportFromIAPopup(false)
  }, [])

  const handleImportJsonFromIAPopup = useCallback(() => {
    setShowImportFromIAPopup(false)
    jsonInputRef.current?.click()
  }, [])

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
    upgradeDefinitions,
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
    setNewAtaMenuOpen(false)
    onCreate()
  }

  const openNewAtaMenu = (ev?: React.MouseEvent) => {
    const el = ev?.currentTarget instanceof HTMLElement ? ev.currentTarget : newAtaButtonRef.current
    if (el) setNewAtaMenuAnchor(el.getBoundingClientRect())
    setNewAtaMenuOpen((v) => !v)
  }

  useEffect(() => {
    if (!newAtaMenuOpen) return
    const handleClickOutside = (ev: MouseEvent) => {
      if (newAtaMenuRef.current?.contains(ev.target as Node) || newAtaButtonRef.current?.contains(ev.target as Node)) return
      setNewAtaMenuOpen(false)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [newAtaMenuOpen])

  const newAtaMenuWidth = 280
  const newAtaMenuEstimatedHeight = 220
  const newAtaMenuStyle = newAtaMenuAnchor
    ? (() => {
        const left = Math.min(newAtaMenuAnchor.left, window.innerWidth - newAtaMenuWidth)
        const spaceBelow = window.innerHeight - (newAtaMenuAnchor.bottom + 8)
        const top = spaceBelow >= newAtaMenuEstimatedHeight
          ? newAtaMenuAnchor.bottom + 8
          : Math.max(8, newAtaMenuAnchor.top - newAtaMenuEstimatedHeight - 8)
        return { left, top }
      })()
    : undefined

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
        <p className={styles.backupWarning}>
          Faça backup sempre que for trocar de computador, navegador ou perfil. Cuidado ao limpar dados do navegador, pois as atas podem ser perdidas. Sempre exporte e arquive no repositório da sua empresa.
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
        <div className={styles.primaryCta}>
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
            ref={newAtaButtonRef}
            type="button"
            onClick={(e) => openNewAtaMenu(e)}
            className={styles.primaryCtaButton}
            title="Adicionar nova ata"
            aria-label="Adicionar nova ata"
            aria-haspopup="menu"
            aria-expanded={newAtaMenuOpen}
          >
            <span className={styles.primaryCtaIcon} aria-hidden>➕</span>
            <span className={styles.primaryCtaText}>Nova ata</span>
            <span className={styles.primaryCtaChevron} aria-hidden>{newAtaMenuOpen ? '▲' : '▼'}</span>
          </button>
        </div>
      </section>

      {newAtaMenuOpen && newAtaMenuAnchor && newAtaMenuStyle &&
        createPortal(
          <div
            ref={newAtaMenuRef}
            className={styles.newAtaPopup}
            style={newAtaMenuStyle}
            role="menu"
            aria-label="Opções para nova ata"
          >
            <button
              type="button"
              className={styles.newAtaPopupItem}
              onClick={handleCreate}
              role="menuitem"
            >
              <span className={styles.newAtaPopupIcon} aria-hidden>📝</span>
              <span className={styles.newAtaPopupText}>
                <span className={styles.newAtaPopupLabel}>Adicionar manualmente</span>
                <span className={styles.newAtaPopupDesc}>Criar ata em branco</span>
              </span>
            </button>
            <button
              type="button"
              className={styles.newAtaPopupItem}
              onClick={() => { jsonInputRef.current?.click(); setNewAtaMenuOpen(false) }}
              role="menuitem"
            >
              <span className={styles.newAtaPopupIcon} aria-hidden>📄</span>
              <span className={styles.newAtaPopupText}>
                <span className={styles.newAtaPopupLabel}>Importar de JSON</span>
                <span className={styles.newAtaPopupDesc}>Arquivo .json da ata</span>
              </span>
            </button>
            <button
              type="button"
              className={styles.newAtaPopupItem}
              onClick={() => { htmlInputRef.current?.click(); setNewAtaMenuOpen(false) }}
              role="menuitem"
            >
              <span className={styles.newAtaPopupIcon} aria-hidden>🌐</span>
              <span className={styles.newAtaPopupText}>
                <span className={styles.newAtaPopupLabel}>Importar de HTML</span>
                <span className={styles.newAtaPopupDesc}>Arquivo .html exportado</span>
              </span>
            </button>
            <button
              type="button"
              className={styles.newAtaPopupItem}
              onClick={() => { setNewAtaMenuOpen(false); listSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}
              role="menuitem"
              title="Selecione uma ata na lista e clique em Copiar"
            >
              <span className={styles.newAtaPopupIcon} aria-hidden>📋</span>
              <span className={styles.newAtaPopupText}>
                <span className={styles.newAtaPopupLabel}>Copiar de outra ata</span>
                <span className={styles.newAtaPopupDesc}>Escolha uma ata na lista e use Copiar</span>
              </span>
            </button>
            <button
              type="button"
              className={styles.newAtaPopupItem}
              onClick={handleOpenImportFromIA}
              role="menuitem"
            >
              <span className={styles.newAtaPopupIcon} aria-hidden>🤖</span>
              <span className={styles.newAtaPopupText}>
                <span className={styles.newAtaPopupLabel}>Importar de outra plataforma ou arquivo</span>
                <span className={styles.newAtaPopupDesc}>Usar IA para converter PDF, transcrição etc.</span>
              </span>
            </button>
          </div>,
          document.body
        )}

      <Modal
        isOpen={showImportFromIAPopup}
        onClose={handleCloseImportFromIA}
        title="Importar de outra plataforma ou arquivo"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseImportFromIA}>
              Fechar
            </Button>
            <Button variant="primary" onClick={handleImportJsonFromIAPopup}>
              Importar JSON
            </Button>
          </>
        }
      >
        <div className={styles.importFromIAPopupContent}>
          <ol className={styles.importFromIASteps}>
            <li>
              <strong>Copie o prompt</strong> usando o botão abaixo. O prompt contém instruções completas para um agente de IA converter seu documento em JSON.
            </li>
            <li>
              <strong>Cole o prompt</strong> em ChatGPT, Claude, Copilot ou outro agente de IA, junto com o conteúdo da sua reunião (texto extraído de PDF, transcrição, e-mail, anexo etc.).
            </li>
            <li>
              O agente gerará um <strong>JSON</strong>. Salve o resultado em um arquivo <code>.json</code> (copie apenas o objeto JSON, sem markdown).
            </li>
            <li>
              <strong>Clique em &quot;Importar JSON&quot;</strong> (botão abaixo) e selecione o arquivo <code>.json</code> gerado. A ata será criada e aberta para edição.
            </li>
          </ol>
          <div className={styles.importFromIACopyWrap}>
            <Button
              variant="primary"
              onClick={handleCopyPrompt}
              className={styles.importFromIACopyBtn}
            >
              {promptCopied ? '✓ Copiado!' : 'Copiar prompt'}
            </Button>
            {promptCopied && (
              <span className={styles.importFromIACopiedHint} role="status">Prompt copiado para a área de transferência.</span>
            )}
          </div>
        </div>
      </Modal>

      {importError && (
        <div className={styles.importError} role="alert">
          {importError}
        </div>
      )}

      <div ref={listSectionRef}>
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
          <Button variant="primary" onClick={(e) => openNewAtaMenu(e)} className={styles.emptyCta}>
            Nova ata
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

      </div>
      {gamificationEnabled ? (
        <>
          <GamificationCorner
            levelIcon={stats.level.icon}
            activePanel={cornerPanel}
            onOpen={(panel) => setCornerPanel((prev) => (prev === panel ? null : panel))}
          />
          <AchievementsSidebar
            isOpen={cornerPanel === 'achievements'}
            onClose={() => setCornerPanel(null)}
            definitions={definitions}
            unlockedIds={unlockedIds}
            unlockedAt={unlockedAt}
          />
          <ShopOverlay
            isOpen={cornerPanel === 'shop'}
            onClose={() => setCornerPanel(null)}
            lifetimeSelos={lifetimeSelos}
            upgradesOwned={upgradesOwned}
            buyUpgrade={buyUpgrade}
            getUpgradeCost={getUpgradeCost}
            definitions={upgradeDefinitions}
          />
        </>
      ) : (
        <button
          type="button"
          className={styles.saveBtnStandalone}
          onClick={() => setCornerPanel('saves')}
          title="Saves e backup"
          aria-label="Abrir saves e backup"
        >
          <span className={styles.saveBtnIcon} aria-hidden>💾</span>
        </button>
      )}
      <SavesOverlay
        isOpen={cornerPanel === 'saves'}
        onClose={() => setCornerPanel(null)}
        onLoadDone={refresh}
      />

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
