import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Button, ConfirmModal } from '@components/ui'
import type { Item, ItemStatus, HistoricoItem, Participant } from '@/types'
import { sanitizeHtml, stripHtml } from '@/utils/htmlSanitize'
import RichTextDescricao from './RichTextDescricao'
import ResponsavelSelect from './ResponsavelSelect'
import styles from './Step2Itens.module.css'

const STATUS_TO_HIDE = ['Concluído', 'Cancelado', 'Info'] as const

/**
 * Interpreta string de data como dia local (evita deslocamento de timezone).
 * Strings "YYYY-MM-DD" sem hora são interpretadas como UTC pelo Date(), o que em fusos
 * como Brasil (UTC-3) faz a data aparecer como dia anterior. Usar T12:00:00 força o dia correto.
 */
function parseDateOnlyAsLocal(s: string): Date {
  const trimmed = (s || '').trim()
  if (trimmed.length === 10 && trimmed[4] === '-' && trimmed[7] === '-') {
    return new Date(trimmed + 'T12:00:00')
  }
  return new Date(s)
}

function formatDate(s: string | null): string {
  if (!s) return '-'
  try {
    return parseDateOnlyAsLocal(s).toLocaleDateString('pt-BR')
  } catch {
    return s
  }
}

/** Opções de status com cores da paleta Vale (como no app antigo) */
const STATUS_OPTIONS: { value: ItemStatus; label: string; hex: string }[] = [
  { value: 'Pendente', label: 'Pendente', hex: '#ECB11F' },
  { value: 'Em Andamento', label: 'Em Andamento', hex: '#EE6F16' },
  { value: 'Concluído', label: 'Concluído', hex: '#007E7A' },
  { value: 'Cancelado', label: 'Cancelado', hex: '#555555' },
  { value: 'Info', label: 'Info', hex: '#3CB5E5' },
]

export interface Step2ItensProps {
  itens: Item[]
  getFilhos: (paiId: string) => Item[]
  onAddItemRaiz: () => void
  onAddSubItem: (paiId: string) => void
  onAddHistorico: (
    itemId: string,
    descricao: string,
    responsavelNome: string,
    responsavelEmail: string,
    data: string | null,
    status: ItemStatus
  ) => void
  onRemoveItem: (itemId: string) => void
  onRemoveHistorico: (itemId: string, historicoId: string) => void
  onUpdateHistoricoCriadoEm: (itemId: string, historicoId: string, novoCriadoEm: string) => void
  participants: Participant[]
  onAddParticipant: (participant: Participant) => void
  /** Data da reunião (YYYY-MM-DD) para filtro "ocultar não editados no dia" */
  dataReuniao: string
  /** Conceder Selos por ação (gamificação). position opcional para toast ao lado do mouse. */
  onAwardSelos?: (baseAmount: number, position?: { clientX: number; clientY: number }) => void
  /** Quando definido, abre esse item para edição, expande o pai se for subitem e rola até ele; depois chama onFocusNewItemHandled */
  focusNewItemId?: string | null
  onFocusNewItemHandled?: () => void
}

/** Formata data para exibição no texto (yyyy-mm-dd) em dia local. */
function formatDateYmd(s: string | null): string {
  if (!s) return ''
  try {
    const trimmed = s.trim()
    if (trimmed.length === 10 && trimmed[4] === '-' && trimmed[7] === '-') return trimmed
    const d = parseDateOnlyAsLocal(s)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  } catch {
    return s
  }
}

/** Indica se o histórico pode ser excluído: mesmo dia ou dia seguinte à data de criação. */
function canDeleteHistorico(h: HistoricoItem): boolean {
  try {
    const criadoEmDate = new Date(h.criadoEm)
    criadoEmDate.setHours(0, 0, 0, 0)
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const diaSeguinte = new Date(criadoEmDate)
    diaSeguinte.setDate(diaSeguinte.getDate() + 1)
    return (
      hoje.getTime() === criadoEmDate.getTime() ||
      hoje.getTime() === diaSeguinte.getTime()
    )
  } catch {
    return false
  }
}

/**
 * Texto do item-pai: apenas a descrição (pode conter HTML sanitizado).
 */
function formatItemPaiDescription(item: Item): React.ReactNode {
  const raw = item.UltimoHistorico?.descricao || ''
  if (!raw) return '(sem descrição)'
  return <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(raw) }} />
}

/** Verifica se o item foi editado no dia da reunião (criadoEm do último histórico, comparado à data do cabeçalho). */
function editadoNoDiaDaReuniao(item: Item, dataReuniao: string): boolean {
  const criadoEm = item.UltimoHistorico?.criadoEm
  if (!criadoEm || !dataReuniao) return false
  const diaItem = criadoEm.split('T')[0]
  const diaReuniao = dataReuniao.trim().split('T')[0]
  return diaItem === diaReuniao
}

/**
 * Com o filtro ativo, itens Concluído/Cancelado/Info só permanecem se o último histórico foi criado no dia da reunião.
 * Pendente e Em andamento nunca são ocultados por este critério.
 */
function deveOcultarPeloFiltro(item: Item, dataReuniao: string): boolean {
  const status = item.UltimoHistorico?.status ?? 'Pendente'
  if (!STATUS_TO_HIDE.includes(status as (typeof STATUS_TO_HIDE)[number])) return false
  return !editadoNoDiaDaReuniao(item, dataReuniao)
}

/** Item “em foco” no filtro: não está entre os que devem sumir (pendente, em andamento ou tocado no dia). */
function itemEntraNoFocoFiltro(item: Item, dataReuniao: string): boolean {
  return !deveOcultarPeloFiltro(item, dataReuniao)
}

/**
 * Com filtro ativo: filhos visíveis diretos de `paiId`, **pulando** intermediários que não estão em `visibleIds`
 * (para manter ligação até folhas “em foco” sem exibir ancestrais que falharam na regra de status).
 */
function getFilhosVisiveisComPulo(
  paiId: string,
  getFilhos: (paiId: string) => Item[],
  visibleIds: Set<string>
): Item[] {
  const out: Item[] = []
  for (const child of getFilhos(paiId)) {
    if (visibleIds.has(child.id)) {
      out.push(child)
    } else {
      out.push(...getFilhosVisiveisComPulo(child.id, getFilhos, visibleIds))
    }
  }
  return out
}

function itemMatchesSearch(item: Item, query: string): boolean {
  if (!query.trim()) return true
  const q = query.trim().toLowerCase()
  const num = (item.item ?? '').toLowerCase()
  const desc = stripHtml(item.UltimoHistorico?.descricao ?? '').toLowerCase()
  const full = (item.historico ?? []).map((h) => stripHtml(h.descricao)).join(' ').toLowerCase()
  return num.includes(q) || desc.includes(q) || full.includes(q)
}

const STATUS_PENDENTE_EM_ANDAMENTO: ItemStatus[] = ['Pendente', 'Em Andamento']
/** Concluído, Cancelado e Info: data e responsável opcionais; quando vazios não exibir alerta nem traço. */
const STATUS_NAO_EXIGE_DATA_RESP: ItemStatus[] = ['Concluído', 'Cancelado', 'Info']

/**
 * IDs visíveis com o filtro de foco: mesma regra de status para todos, exceto que **pais** com
 * Pendente ou Em andamento **só** entram se forem ancestrais de alguma **folha** que está em foco
 * (folha = sem filhos em `getFilhos`, pesquisa OK, e Pendente/Em andamento ou tocado no dia).
 * Pais Concluído/Cancelado/Info editados no dia podem aparecer sem folha em foco abaixo (bloco tocado hoje).
 */
function buildVisibleIdsComFiltroFoco(
  itens: Item[],
  getFilhos: (paiId: string) => Item[],
  searchQuery: string,
  dataReuniao: string
): Set<string> {
  const idToItem = new Map(itens.map((i) => [i.id, i]))
  const folhasEmFoco = itens.filter(
    (i) =>
      getFilhos(i.id).length === 0 &&
      itemMatchesSearch(i, searchQuery) &&
      itemEntraNoFocoFiltro(i, dataReuniao)
  )
  const ancestralDeFolhaEmFoco = new Set<string>()
  for (const leaf of folhasEmFoco) {
    let p: string | null = leaf.pai
    while (p) {
      ancestralDeFolhaEmFoco.add(p)
      p = idToItem.get(p)?.pai ?? null
    }
  }
  const set = new Set<string>()
  for (const i of itens) {
    if (!itemMatchesSearch(i, searchQuery) || !itemEntraNoFocoFiltro(i, dataReuniao)) continue
    const temFilhos = getFilhos(i.id).length > 0
    if (!temFilhos) {
      set.add(i.id)
      continue
    }
    const st = (i.UltimoHistorico?.status ?? 'Pendente') as ItemStatus
    if (STATUS_PENDENTE_EM_ANDAMENTO.includes(st)) {
      if (ancestralDeFolhaEmFoco.has(i.id)) set.add(i.id)
    } else {
      set.add(i.id)
    }
  }
  return set
}

function hasResponsible(item: Item): boolean {
  const r = item.UltimoHistorico?.responsavel
  return !!(r && (r.nome?.trim() || r.email?.trim()))
}

function hasDescription(item: Item): boolean {
  const raw = item.UltimoHistorico?.descricao ?? ''
  return !!stripHtml(raw).trim()
}

/** Retorna hoje em YYYY-MM-DD (meia-noite local). */
function todayYmd(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Data presente e não vencida (>= hoje). */
function hasValidData(item: Item): boolean {
  const data = item.UltimoHistorico?.data
  if (!data) return false
  try {
    const dayStr = data.length === 10 && data[4] === '-' && data[7] === '-'
      ? data
      : formatDateYmd(data)
    return dayStr >= todayYmd()
  } catch {
    return false
  }
}

/** Data presente mas já vencida (< hoje). */
function isDataVencida(item: Item): boolean {
  const data = item.UltimoHistorico?.data
  if (!data) return false
  try {
    const dayStr = data.length === 10 && data[4] === '-' && data[7] === '-'
      ? data
      : formatDateYmd(data)
    return dayStr < todayYmd()
  } catch {
    return false
  }
}

/** Item folha precisa de ajuste: Pendente/Em Andamento sem descrição, responsável ou data válida; Concluído/Cancelado/Info sem descrição. */
function needsDateAdjustment(item: Item): boolean {
  const semFilhos = (item.filhos?.length ?? 0) === 0
  if (!semFilhos) return false
  const status = (item.UltimoHistorico?.status ?? 'Pendente') as ItemStatus
  if (STATUS_PENDENTE_EM_ANDAMENTO.includes(status))
    return !hasDescription(item) || !hasResponsible(item) || !hasValidData(item)
  if (STATUS_NAO_EXIGE_DATA_RESP.includes(status)) return !hasDescription(item)
  return false
}

/** Linhas do histórico com botões de editar data e excluir (X). */
function HistoricoLines({
  item,
  editandoHistorico,
  setEditandoHistorico,
  onSalvarDataHistorico,
  onExcluirHistorico,
  canDeleteHistorico,
  formatDateYmd,
  styles: css,
  semDescricaoAlert,
}: {
  item: Item
  editandoHistorico: { itemId: string; historicoId: string; criadoEm: string } | null
  setEditandoHistorico: (v: { itemId: string; historicoId: string; criadoEm: string } | null) => void
  onSalvarDataHistorico: (historicoId: string, novoCriadoEm: string) => void
  onExcluirHistorico: (historicoId: string) => void
  canDeleteHistorico: (h: HistoricoItem) => boolean
  formatDateYmd: (s: string | null) => string
  styles: Record<string, string>
  /** Alerta "sem descrição" a exibir antes dos botões da última linha quando o último histórico não tem descrição */
  semDescricaoAlert?: React.ReactNode
}) {
  const historico = item.historico ?? []
  if (historico.length === 0) return <>(sem descrição)</>

  return (
    <>
      {historico.map((h, idx) => {
        const isLast = idx === historico.length - 1
        const datePart = formatDateYmd(h.criadoEm)
        const descricaoHtml = sanitizeHtml(h.descricao || '')
        const isEditingThis =
          editandoHistorico?.itemId === item.id && editandoHistorico?.historicoId === h.id
        const podeExcluir = historico.length > 1 && canDeleteHistorico(h)
        const criadoEmDate = h.criadoEm ? h.criadoEm.split('T')[0]! : ''

        return (
          <span key={h.id} className={isLast ? undefined : css.historicoAnterior}>
            {isEditingThis && editandoHistorico ? (
              <span className={css.historicoEditRow}>
                <input
                  type="date"
                  className={css.historicoDateInput}
                  value={editandoHistorico.criadoEm.split('T')[0] ?? ''}
                  onChange={(e) =>
                    setEditandoHistorico({
                      ...editandoHistorico,
                      criadoEm: e.target.value ? new Date(e.target.value + 'T12:00:00').toISOString() : editandoHistorico.criadoEm,
                    })
                  }
                />
                <button
                  type="button"
                  className={css.historicoBtnOk}
                  onClick={() =>
                    onSalvarDataHistorico(
                      h.id,
                      editandoHistorico.criadoEm
                    )
                  }
                >
                  Ok
                </button>
                <button
                  type="button"
                  className={css.historicoBtnCancel}
                  onClick={() => setEditandoHistorico(null)}
                >
                  Cancelar
                </button>
              </span>
            ) : (
              <>
                {datePart}: <span dangerouslySetInnerHTML={{ __html: descricaoHtml }} />
                {isLast && semDescricaoAlert}
                <span className={css.historicoActions}>
                  <button
                    type="button"
                    className={css.historicoBtnIcon}
                    onClick={() =>
                      setEditandoHistorico({
                        itemId: item.id,
                        historicoId: h.id,
                        criadoEm: criadoEmDate ? new Date(criadoEmDate + 'T12:00:00').toISOString() : new Date().toISOString(),
                      })
                    }
                    title="Editar data de criação"
                  >
                    📅
                  </button>
                  {podeExcluir && (
                    <button
                      type="button"
                      className={css.historicoBtnIconDanger}
                      onClick={() => onExcluirHistorico(h.id)}
                      title="Excluir histórico"
                    >
                      ✕
                    </button>
                  )}
                </span>
              </>
            )}
            {!isLast && <br />}
          </span>
        )
      })}
    </>
  )
}

export default function Step2Itens({
  itens,
  getFilhos,
  onAddItemRaiz,
  onAddSubItem,
  onAddHistorico,
  onRemoveItem,
  onRemoveHistorico,
  onUpdateHistoricoCriadoEm,
  participants,
  onAddParticipant,
  dataReuniao,
  onAwardSelos,
  focusNewItemId,
  onFocusNewItemHandled,
}: Step2ItensProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [hideConcluidosCancInfo, setHideConcluidosCancInfo] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [editandoItemId, setEditandoItemId] = useState<string | null>(null)
  const [editandoEPai, setEditandoEPai] = useState(false)
  const [descricao, setDescricao] = useState('')
  const [respNome, setRespNome] = useState('')
  const [respEmail, setRespEmail] = useState('')
  const [data, setData] = useState('')
  const [status, setStatus] = useState<ItemStatus>('Pendente')
  /** Estado para edição da data de criação de um histórico (itemId + historicoId). */
  const [editandoHistorico, setEditandoHistorico] = useState<{
    itemId: string
    historicoId: string
    criadoEm: string
  } | null>(null)

  const iniciarEdicao = (item: Item) => {
    const temFilhos = (item.filhos?.length ?? 0) > 0
    setEditandoItemId(item.id)
    setEditandoEPai(temFilhos)
    setDescricao(item.UltimoHistorico?.descricao ?? '')
    setRespNome(item.UltimoHistorico?.responsavel?.nome ?? '')
    setRespEmail(item.UltimoHistorico?.responsavel?.email ?? '')
    setData(item.UltimoHistorico?.data ? item.UltimoHistorico.data.split('T')[0] : '')
    setStatus((item.UltimoHistorico?.status as ItemStatus) ?? 'Pendente')
  }

  const salvarHistorico = () => {
    if (!editandoItemId) return
    onAwardSelos?.(1)
    onAddHistorico(
      editandoItemId,
      descricao,
      editandoEPai ? '' : respNome,
      editandoEPai ? '' : respEmail,
      editandoEPai ? null : data || null,
      editandoEPai ? 'Pendente' : status
    )
    setEditandoItemId(null)
    setEditandoEPai(false)
    setDescricao('')
    setRespNome('')
    setRespEmail('')
    setData('')
    setStatus('Pendente')
  }

  /** Remove item e, se era o que estava sendo editado, reseta o estado de edição para habilitar os demais botões. */
  const handleRemoveItem = useCallback(
    (itemId: string) => {
      onRemoveItem(itemId)
      if (editandoItemId === itemId) {
        setEditandoItemId(null)
        setEditandoEPai(false)
        setEditandoHistorico(null)
      }
    },
    [onRemoveItem, editandoItemId]
  )

  const itensRaiz = itens.filter((i) => !i.pai)

  const visibleIds = useMemo(() => {
    if (!hideConcluidosCancInfo) {
      const set = new Set<string>()
      const visit = (item: Item) => {
        if (itemMatchesSearch(item, searchQuery)) set.add(item.id)
        getFilhos(item.id).forEach(visit)
      }
      itensRaiz.forEach(visit)
      return set
    }
    return buildVisibleIdsComFiltroFoco(itens, getFilhos, searchQuery, dataReuniao)
  }, [itens, itensRaiz, getFilhos, searchQuery, hideConcluidosCancInfo, dataReuniao])

  const getFilhosFiltered = useMemo(() => {
    if (!hideConcluidosCancInfo) {
      return (paiId: string) => getFilhos(paiId).filter((f) => visibleIds.has(f.id))
    }
    return (paiId: string) => getFilhosVisiveisComPulo(paiId, getFilhos, visibleIds)
  }, [getFilhos, visibleIds, hideConcluidosCancInfo])

  useEffect(() => {
    const parents = itens.filter((i) => (i.filhos?.length ?? 0) > 0).map((i) => i.id)
    setExpandedIds((prev) => {
      if (prev.size === 0 && parents.length > 0) return new Set(parents)
      return prev
    })
  }, [itens])

  /** Foco no item recém-adicionado: abrir para edição, expandir pai se for subitem, rolar até ele */
  useEffect(() => {
    if (!focusNewItemId || !onFocusNewItemHandled) return
    const item = itens.find((i) => i.id === focusNewItemId)
    if (!item) return
    const temFilhos = (item.filhos?.length ?? 0) > 0
    setEditandoItemId(focusNewItemId)
    setEditandoEPai(temFilhos)
    setDescricao(item.UltimoHistorico?.descricao ?? '')
    setRespNome(item.UltimoHistorico?.responsavel?.nome ?? '')
    setRespEmail(item.UltimoHistorico?.responsavel?.email ?? '')
    setData(item.UltimoHistorico?.data ? item.UltimoHistorico.data.split('T')[0] : '')
    setStatus((item.UltimoHistorico?.status as ItemStatus) ?? 'Pendente')
    if (item.pai) {
      setExpandedIds((prev) => {
        const next = new Set(prev)
        next.add(item.pai!)
        return next
      })
    }
    const t = setTimeout(() => {
      const el = listRef.current?.querySelector(`[data-item-id="${focusNewItemId}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      onFocusNewItemHandled()
    }, 80)
    return () => clearTimeout(t)
  }, [focusNewItemId, itens, onFocusNewItemHandled])

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAddSubItem = (paiId: string) => {
    onAwardSelos?.(1)
    onAddSubItem(paiId)
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.add(paiId)
      return next
    })
  }

  const itensRaizVisiveis = useMemo(() => {
    if (!hideConcluidosCancInfo) {
      return itensRaiz.filter((i) => visibleIds.has(i.id))
    }
    return itens.filter(
      (i) => visibleIds.has(i.id) && (i.pai == null || !visibleIds.has(i.pai))
    )
  }, [itens, itensRaiz, visibleIds, hideConcluidosCancInfo])

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Pesquisar item (número ou texto)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <label className={styles.filterLabel}>
          <input
            type="checkbox"
            checked={hideConcluidosCancInfo}
            onChange={(e) => setHideConcluidosCancInfo(e.target.checked)}
          />
          Só itens em foco (Pendente, Em andamento ou editado na data da reunião); hierarquia só entre eles
        </label>
        <button
          type="button"
          className={styles.addItemBtn}
          onClick={(e) => { onAwardSelos?.(1, { clientX: e.clientX, clientY: e.clientY }); onAddItemRaiz() }}
          title="Adicionar item raiz"
          aria-label="Adicionar item raiz"
        >
          ➕
        </button>
      </div>

      <div ref={listRef} className={styles.list}>
        {itensRaizVisiveis.length === 0 ? (
          <p className={styles.empty}>
            {itensRaiz.length === 0
              ? 'Nenhum item. Adicione ao menos um item raiz.'
              : 'Nenhum item corresponde à pesquisa ou filtros.'}
          </p>
        ) : (
          itensRaizVisiveis.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              getFilhos={getFilhosFiltered}
              nivel={item.nivel}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              editandoItemId={editandoItemId}
              editandoEPai={editandoEPai}
              descricao={descricao}
              setDescricao={setDescricao}
              respNome={respNome}
              setRespNome={setRespNome}
              respEmail={respEmail}
              setRespEmail={setRespEmail}
              data={data}
              setData={setData}
              status={status}
              setStatus={setStatus}
              onAddSubItem={handleAddSubItem}
              onRemoveItem={handleRemoveItem}
                onRemoveHistorico={onRemoveHistorico}
                onUpdateHistoricoCriadoEm={onUpdateHistoricoCriadoEm}
                participants={participants}
                onAddParticipant={onAddParticipant}
                onIniciarEdicao={iniciarEdicao}
                onSalvarHistorico={salvarHistorico}
                onCancelarEdicao={() => { setEditandoItemId(null); setEditandoEPai(false) }}
                formatItemPaiDescription={formatItemPaiDescription}
                editandoHistorico={editandoHistorico}
                setEditandoHistorico={setEditandoHistorico}
                canDeleteHistorico={canDeleteHistorico}
                formatDateYmd={formatDateYmd}
                STATUS_OPTIONS={STATUS_OPTIONS}
                onAwardSelos={onAwardSelos}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface ItemRowProps {
  item: Item
  getFilhos: (paiId: string) => Item[]
  nivel: number
  expandedIds: Set<string>
  toggleExpand: (id: string) => void
  editandoItemId: string | null
  editandoEPai: boolean
  descricao: string
  setDescricao: (v: string) => void
  respNome: string
  setRespNome: (v: string) => void
  respEmail: string
  setRespEmail: (v: string) => void
  data: string
  setData: (v: string) => void
  status: ItemStatus
  setStatus: (v: ItemStatus) => void
  onAddSubItem: (paiId: string) => void
  onRemoveItem: (itemId: string) => void
  onRemoveHistorico: (itemId: string, historicoId: string) => void
  onUpdateHistoricoCriadoEm: (itemId: string, historicoId: string, novoCriadoEm: string) => void
  participants: Participant[]
  onAddParticipant: (participant: Participant) => void
  onIniciarEdicao: (item: Item) => void
  onSalvarHistorico: () => void
  onCancelarEdicao: () => void
  formatItemPaiDescription: (item: Item) => React.ReactNode
  editandoHistorico: { itemId: string; historicoId: string; criadoEm: string } | null
  setEditandoHistorico: (v: { itemId: string; historicoId: string; criadoEm: string } | null) => void
  canDeleteHistorico: (h: HistoricoItem) => boolean
  formatDateYmd: (s: string | null) => string
  STATUS_OPTIONS: { value: ItemStatus; label: string; hex: string }[]
  onAwardSelos?: (baseAmount: number, position?: { clientX: number; clientY: number }) => void
}

function ItemRow({
  item,
  getFilhos,
  nivel,
  expandedIds,
  toggleExpand,
  editandoItemId,
  editandoEPai,
  descricao,
  setDescricao,
  respNome,
  setRespNome,
  respEmail,
  setRespEmail,
  data,
  setData,
  status,
  setStatus,
  onAddSubItem,
  onRemoveItem,
  onRemoveHistorico,
  onUpdateHistoricoCriadoEm,
  participants,
  onAddParticipant,
  onIniciarEdicao,
  onSalvarHistorico,
  onCancelarEdicao,
  formatItemPaiDescription,
  editandoHistorico,
  setEditandoHistorico,
  canDeleteHistorico,
  formatDateYmd,
  STATUS_OPTIONS,
  onAwardSelos,
}: ItemRowProps) {
  const filhos = getFilhos(item.id)
  const temFilhos = filhos.length > 0
  const isExpandido = expandedIds.has(item.id)
  const isItemPai = temFilhos
  const isEditandoEste = editandoItemId === item.id
  const qtdHistorico = item.historico?.length ?? 0
  const podeExcluirItem = qtdHistorico <= 1
  const [confirmExcluirItem, setConfirmExcluirItem] = useState(false)
  const [historicoToDelete, setHistoricoToDelete] = useState<string | null>(null)

  const handleExcluirItemClick = () => {
    if (!podeExcluirItem) return
    setConfirmExcluirItem(true)
  }

  const handleExcluirItemConfirm = () => {
    onAwardSelos?.(1)
    onRemoveItem(item.id)
    setConfirmExcluirItem(false)
  }

  const dataVencida = isDataVencida(item)
  const nivelClass = temFilhos
    ? (nivel === 1
        ? styles.itemRowComFilhosNivel1
        : nivel === 2
          ? styles.itemRowComFilhosNivel2
          : nivel === 3
            ? styles.itemRowComFilhosNivel3
            : nivel === 4
              ? styles.itemRowComFilhosNivel4
              : styles.itemRowComFilhosNivel5)
    : styles.itemRowSemFilhos
  const precisaAjusteData = needsDateAdjustment(item)

  const handleExcluirHistoricoClick = (historicoId: string) => {
    setHistoricoToDelete(historicoId)
  }

  const handleExcluirHistoricoConfirm = () => {
    if (historicoToDelete) {
      onAwardSelos?.(1)
      onRemoveHistorico(item.id, historicoToDelete)
      setHistoricoToDelete(null)
    }
  }

  const handleSalvarDataHistorico = (historicoId: string, novoCriadoEm: string) => {
    onAwardSelos?.(1)
    onUpdateHistoricoCriadoEm(item.id, historicoId, novoCriadoEm)
    setEditandoHistorico(null)
  }

  const descricaoContent = isItemPai ? (
    formatItemPaiDescription(item)
  ) : (
    <HistoricoLines
      item={item}
      editandoHistorico={editandoHistorico}
      setEditandoHistorico={setEditandoHistorico}
      onSalvarDataHistorico={handleSalvarDataHistorico}
      onExcluirHistorico={handleExcluirHistoricoClick}
      canDeleteHistorico={canDeleteHistorico}
      formatDateYmd={formatDateYmd}
      styles={styles}
      semDescricaoAlert={!hasDescription(item) ? (
        <span className={styles.itemMetaAlert} title="Descrição não preenchida">
          <span className={styles.itemMetaAlertDot} aria-hidden />
          {' '}sem descrição
        </span>
      ) : undefined}
    />
  )

  return (
    <div
      className={`${styles.itemRow} ${nivelClass} ${precisaAjusteData ? styles.itemNeedsDateAdjustment : ''}`}
      style={{ paddingLeft: (nivel - 1) * 10 }}
      data-item-id={item.id}
      title={precisaAjusteData ? 'Sem descrição, responsável ou data/data vencida — preencha para contar na completude' : undefined}
    >
      <div className={styles.itemHeader}>
        <span className={styles.expandCell}>
          {temFilhos ? (
            <button
              type="button"
              className={styles.toggleFilhos}
              onClick={() => toggleExpand(item.id)}
              title={isExpandido ? 'Recolher subitens' : 'Expandir subitens'}
              aria-expanded={isExpandido}
            >
              {isExpandido ? '▼' : '▶'}
            </button>
          ) : null}
        </span>
        <span className={styles.itemNumero} title="Número automático (somente leitura)">
          {item.item}
        </span>
        <span className={styles.itemDescricao}>
          {descricaoContent}
        </span>
        {!isItemPai && (() => {
          const status = (item.UltimoHistorico?.status ?? 'Pendente') as ItemStatus
          const exigeDataResp = status && STATUS_PENDENTE_EM_ANDAMENTO.includes(status)
          const historico = item.historico ?? []
          const anteriores = historico.slice(0, -1)
          const datePart = exigeDataResp
            ? !item.UltimoHistorico?.data
              ? (
                  <span className={styles.itemMetaAlert} title="Data não definida">
                    <span className={styles.itemMetaAlertDot} aria-hidden />
                    sem data
                  </span>
                )
              : dataVencida
                ? (
                    <span className={styles.itemMetaAlert} title="Data vencida">
                      <span className={styles.itemMetaAlertDot} aria-hidden />
                      {formatDate(item.UltimoHistorico?.data)}
                    </span>
                  )
                : formatDate(item.UltimoHistorico?.data)
            : item.UltimoHistorico?.data
              ? formatDate(item.UltimoHistorico?.data)
              : null
          const respPart = exigeDataResp
            ? !hasResponsible(item)
              ? (
                  <span className={styles.itemMetaAlert} title="Responsável não definido">
                    <span className={styles.itemMetaAlertDot} aria-hidden />
                    sem responsável
                  </span>
                )
              : (item.UltimoHistorico?.responsavel?.nome || '-')
            : hasResponsible(item)
              ? (item.UltimoHistorico?.responsavel?.nome ?? '')
              : null
          const showDate = datePart != null
          const showResp = respPart != null
          return (
            <>
              <span className={styles.itemMeta}>
                {anteriores.length > 0 && (
                  <span className={styles.itemMetaHistoricoWrap}>
                    {anteriores.map((h) => (
                      <span key={h.id} className={styles.itemMetaHistoricoAnterior}>
                        {formatDate(h.data)} | {h.responsavel?.nome || '-'}
                      </span>
                    ))}
                  </span>
                )}
                <span className={styles.itemMetaAtual}>
                  {showDate && datePart}
                  {showDate && showResp && ' | '}
                  {showResp && respPart}
                </span>
              </span>
              <span className={`${styles.statusBadge} ${styles['status-' + (item.UltimoHistorico?.status || 'Pendente').replace(/\s/g, '')]}`}>
                {item.UltimoHistorico?.status || 'Pendente'}
              </span>
            </>
          )
        })()}
        <div className={styles.itemActions}>
          <button
            type="button"
            className={styles.itemActionIcon}
            onClick={() => onIniciarEdicao(item)}
            disabled={!!editandoItemId && !isEditandoEste}
            title={isItemPai ? 'Editar descrição' : 'Editar item'}
          >
            ✏️
          </button>
          <button
            type="button"
            className={styles.itemActionIconPrimary}
            onClick={() => onAddSubItem(item.id)}
            title="Adicionar subitem"
          >
            ➕
          </button>
          {!temFilhos && (
            <button
              type="button"
              className={styles.itemActionIconDanger}
              onClick={handleExcluirItemClick}
              disabled={!podeExcluirItem}
              title={
                podeExcluirItem
                  ? 'Excluir item'
                  : 'Exclua os históricos extras antes de excluir o item'
              }
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {isEditandoEste && (
        <div className={styles.inlineEdit}>
          <div className={styles.inlineEditRow}>
            <div className={styles.inlineEditDesc}>
              <label>Descrição</label>
              <RichTextDescricao
                value={descricao}
                onChange={setDescricao}
                placeholder={editandoEPai ? 'Descrição do item (organização)' : 'Descrição'}
                minRows={4}
                onFormatApplied={onAwardSelos ? () => onAwardSelos(1) : undefined}
              />
            </div>
            {!editandoEPai && (
              <>
                <div className={styles.inlineEditField}>
                  <label>Responsável</label>
                  <ResponsavelSelect
                    participants={participants}
                    value={{ nome: respNome, email: respEmail }}
                    onChange={(nome, email) => {
                      setRespNome(nome)
                      setRespEmail(email)
                    }}
                    onAddParticipant={onAddParticipant}
                    placeholder="Selecione ou pesquise integrante"
                  />
                </div>
                <div className={styles.inlineEditField}>
                  <label>Data</label>
                  <input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                  />
                </div>
                <div className={styles.statusSelector}>
                  <label>Status</label>
                  <div className={styles.statusChips} role="group" aria-label="Status do item">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={styles.statusChip}
                        style={{
                          ['--status-color' as string]: opt.hex,
                          ...(status === opt.value
                            ? { backgroundColor: opt.hex, color: '#fff' }
                            : {}),
                        }}
                        data-selected={status === opt.value}
                        onClick={(e) => {
                          if (opt.value !== status) onAwardSelos?.(1, { clientX: e.clientX, clientY: e.clientY })
                          setStatus(opt.value)
                        }}
                        title={opt.label}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div className={styles.inlineEditActions}>
              <Button size="sm" variant="secondary" onClick={onCancelarEdicao}>Cancelar</Button>
              <Button size="sm" variant="primary" onClick={onSalvarHistorico}>Salvar</Button>
            </div>
          </div>
        </div>
      )}

      {temFilhos && isExpandido &&
            filhos.map((filho) => (
              <ItemRow
                key={filho.id}
                item={filho}
                getFilhos={getFilhos}
                nivel={nivel + 1}
                expandedIds={expandedIds}
                toggleExpand={toggleExpand}
                editandoItemId={editandoItemId}
                editandoEPai={editandoEPai}
                descricao={descricao}
                setDescricao={setDescricao}
                respNome={respNome}
                setRespNome={setRespNome}
                respEmail={respEmail}
                setRespEmail={setRespEmail}
                data={data}
                setData={setData}
                status={status}
                setStatus={setStatus}
                onAddSubItem={onAddSubItem}
                onRemoveItem={onRemoveItem}
                onRemoveHistorico={onRemoveHistorico}
                onUpdateHistoricoCriadoEm={onUpdateHistoricoCriadoEm}
                participants={participants}
                onAddParticipant={onAddParticipant}
                onIniciarEdicao={onIniciarEdicao}
                onSalvarHistorico={onSalvarHistorico}
                onCancelarEdicao={onCancelarEdicao}
                formatItemPaiDescription={formatItemPaiDescription}
                editandoHistorico={editandoHistorico}
                setEditandoHistorico={setEditandoHistorico}
                canDeleteHistorico={canDeleteHistorico}
                formatDateYmd={formatDateYmd}
                STATUS_OPTIONS={STATUS_OPTIONS}
                onAwardSelos={onAwardSelos}
              />
            ))
      }

      <ConfirmModal
        isOpen={confirmExcluirItem}
        onClose={() => setConfirmExcluirItem(false)}
        onConfirm={handleExcluirItemConfirm}
        title="Excluir item"
        message="Tem certeza que deseja EXCLUIR este item? Esta ação não pode ser desfeita e excluirá também todos os subitens, se houver."
        confirmLabel="Excluir"
        closeOnOverlayClick={false}
      />

      <ConfirmModal
        isOpen={historicoToDelete !== null}
        onClose={() => setHistoricoToDelete(null)}
        onConfirm={handleExcluirHistoricoConfirm}
        title="Excluir histórico"
        message="Tem certeza que deseja excluir este histórico?"
        confirmLabel="Excluir"
        closeOnOverlayClick={false}
      />
    </div>
  )
}
