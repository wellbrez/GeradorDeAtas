import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@components/ui'
import type { Item, ItemStatus, HistoricoItem, Participant } from '@/types'
import { sanitizeHtml, stripHtml } from '@/utils/htmlSanitize'
import RichTextDescricao from './RichTextDescricao'
import ResponsavelSelect from './ResponsavelSelect'
import styles from './Step2Itens.module.css'

const STATUS_TO_HIDE = ['Concluído', 'Cancelado', 'Info'] as const

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
}

function formatDate(s: string | null): string {
  if (!s) return '-'
  try {
    return new Date(s).toLocaleDateString('pt-BR')
  } catch {
    return s
  }
}

/** Formata data para exibição no texto (yyyy-mm-dd) */
function formatDateYmd(s: string | null): string {
  if (!s) return ''
  try {
    const d = new Date(s)
    return d.toISOString().split('T')[0]
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

/** Verifica se o item foi editado no dia da reunião (criadoEm do último histórico). */
function editadoNoDiaDaReuniao(item: Item, dataReuniao: string): boolean {
  const criadoEm = item.UltimoHistorico?.criadoEm
  if (!criadoEm || !dataReuniao) return false
  const diaItem = criadoEm.split('T')[0]
  return diaItem === dataReuniao
}

/** Item deve ser ocultado quando filtro ativo: Concluído/Cancelado/Info não editados no dia. */
function deveOcultarPeloFiltro(item: Item, dataReuniao: string): boolean {
  const status = item.UltimoHistorico?.status ?? 'Pendente'
  if (!STATUS_TO_HIDE.includes(status as (typeof STATUS_TO_HIDE)[number])) return false
  return !editadoNoDiaDaReuniao(item, dataReuniao)
}

function itemMatchesSearch(item: Item, query: string): boolean {
  if (!query.trim()) return true
  const q = query.trim().toLowerCase()
  const num = (item.item ?? '').toLowerCase()
  const desc = stripHtml(item.UltimoHistorico?.descricao ?? '').toLowerCase()
  const full = (item.historico ?? []).map((h) => stripHtml(h.descricao)).join(' ').toLowerCase()
  return num.includes(q) || desc.includes(q) || full.includes(q)
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
}: {
  item: Item
  editandoHistorico: { itemId: string; historicoId: string; criadoEm: string } | null
  setEditandoHistorico: (v: { itemId: string; historicoId: string; criadoEm: string } | null) => void
  onSalvarDataHistorico: (historicoId: string, novoCriadoEm: string) => void
  onExcluirHistorico: (historicoId: string) => void
  canDeleteHistorico: (h: HistoricoItem) => boolean
  formatDateYmd: (s: string | null) => string
  styles: Record<string, string>
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
}: Step2ItensProps) {
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

  const itensRaiz = itens.filter((i) => !i.pai)

  const visibleIds = useMemo(() => {
    const set = new Set<string>()
    const visit = (item: Item) => {
      const matchSearch = itemMatchesSearch(item, searchQuery)
      const hideByFilter = hideConcluidosCancInfo && deveOcultarPeloFiltro(item, dataReuniao)
      if (matchSearch && !hideByFilter) set.add(item.id)
      getFilhos(item.id).forEach(visit)
    }
    itensRaiz.forEach(visit)
    return set
  }, [itensRaiz, searchQuery, hideConcluidosCancInfo, dataReuniao, getFilhos])

  const getFilhosFiltered = useMemo(
    () => (paiId: string) => getFilhos(paiId).filter((f) => visibleIds.has(f.id)),
    [getFilhos, visibleIds]
  )

  useEffect(() => {
    const parents = itens.filter((i) => (i.filhos?.length ?? 0) > 0).map((i) => i.id)
    setExpandedIds((prev) => {
      if (prev.size === 0 && parents.length > 0) return new Set(parents)
      return prev
    })
  }, [itens])

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAddSubItem = (paiId: string) => {
    onAddSubItem(paiId)
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.add(paiId)
      return next
    })
  }

  const itensRaizVisiveis = itensRaiz.filter((i) => visibleIds.has(i.id))

  return (
    <div className={styles.container}>
      <div className={styles.toolbarTop}>
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
          Ocultar Concluídos, Cancelados e Info (não editados no dia)
        </label>
      </div>
      <div className={styles.toolbar}>
        <Button variant="primary" onClick={onAddItemRaiz}>
          Adicionar Item Raiz
        </Button>
      </div>

      <div className={styles.list}>
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
              nivel={1}
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
              onRemoveItem={onRemoveItem}
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
}: ItemRowProps) {
  const filhos = getFilhos(item.id)
  const temFilhos = filhos.length > 0
  const isExpandido = expandedIds.has(item.id)
  const isItemPai = temFilhos
  const isEditandoEste = editandoItemId === item.id
  const qtdHistorico = item.historico?.length ?? 0
  const podeExcluirItem = qtdHistorico <= 1

  const handleExcluirItem = () => {
    if (!podeExcluirItem) return
    const msg =
      'Tem certeza que deseja EXCLUIR este item? Esta ação não pode ser desfeita e excluirá também todos os subitens, se houver.'
    if (!window.confirm(msg)) return
    onRemoveItem(item.id)
  }

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

  const handleExcluirHistorico = (historicoId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este histórico?')) return
    onRemoveHistorico(item.id, historicoId)
  }

  const handleSalvarDataHistorico = (historicoId: string, novoCriadoEm: string) => {
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
      onExcluirHistorico={handleExcluirHistorico}
      canDeleteHistorico={canDeleteHistorico}
      formatDateYmd={formatDateYmd}
      styles={styles}
    />
  )

  return (
    <div className={`${styles.itemRow} ${nivelClass}`} style={{ paddingLeft: (nivel - 1) * 10 }}>
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
        {!isItemPai && (
          <>
            <span className={styles.itemMeta}>
              {formatDate(item.UltimoHistorico?.data)} | {item.UltimoHistorico?.responsavel?.nome || '-'}
            </span>
            <span className={`${styles.statusBadge} ${styles['status-' + (item.UltimoHistorico?.status || 'Pendente').replace(/\s/g, '')]}`}>
              {item.UltimoHistorico?.status || 'Pendente'}
            </span>
          </>
        )}
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
              onClick={handleExcluirItem}
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
                        onClick={() => setStatus(opt.value)}
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
              />
            ))
      }
    </div>
  )
}
