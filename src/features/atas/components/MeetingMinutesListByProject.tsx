/**
 * Lista de atas agrupadas por projeto (pastas). Cada ata em linha com ícones de ação rápida e menu em popup.
 */
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { MeetingMinutes } from '@/types'
import { downloadAtaAsHtml, downloadAtaAsJson, printAtaAsPdf } from '../services/exportAta'
import { encodeAtaToHash } from '@/utils/urlAtaImport'
import { getEnvConfig } from '@services/envConfig'
import styles from './MeetingMinutesListByProject.module.css'

export interface MeetingMinutesListByProjectProps {
  atas: MeetingMinutes[]
  onEdit: (id: string) => void
  onCopy: (id: string) => void
  onDelete: (id: string) => void
  /** Conceder Selos por ação (ex.: 1 para editar, 2 para HTML+PDF). position opcional para toast ao lado do mouse. */
  onAwardSelos?: (baseAmount: number, position?: { clientX: number; clientY: number }) => void
}

/**
 * Interpreta string de data (YYYY-MM-DD ou ISO) como dia local, evitando deslocamento por timezone.
 * Strings "YYYY-MM-DD" são tratadas como meio-dia local para não cair no dia anterior em fusos como UTC-3.
 */
function parseDateOnlyAsLocal(s: string): Date {
  const t = (s || '').trim()
  if (t.length === 10 && t[4] === '-' && t[7] === '-') return new Date(t + 'T12:00:00')
  return new Date(s)
}

function formatDate(dateString: string): string {
  try {
    return parseDateOnlyAsLocal(dateString).toLocaleDateString('pt-BR')
  } catch {
    return dateString
  }
}

function canEdit(ata: MeetingMinutes): boolean {
  if (ata.arquivada) return false
  try {
    const dataAta = parseDateOnlyAsLocal(ata.cabecalho.data)
    dataAta.setHours(0, 0, 0, 0)
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const umDiaAtras = new Date(hoje)
    umDiaAtras.setDate(umDiaAtras.getDate() - 1)
    return dataAta >= umDiaAtras
  } catch {
    return false
  }
}

interface RowProps {
  meetingMinutes: MeetingMinutes
  onEdit: (id: string) => void
  onCopy: (id: string) => void
  onDelete: (id: string) => void
  onAwardSelos?: (baseAmount: number, position?: { clientX: number; clientY: number }) => void
  isMenuOpen: boolean
  onToggleMenu: () => void
  onCloseMenu: () => void
}

function MeetingMinutesRowCompact({
  meetingMinutes,
  onEdit,
  onCopy,
  onDelete,
  onAwardSelos,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
}: RowProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const moreButtonRef = useRef<HTMLButtonElement>(null)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (!isMenuOpen || !moreButtonRef.current) return
    setAnchorRect(moreButtonRef.current.getBoundingClientRect())
  }, [isMenuOpen])

  useEffect(() => {
    if (!isMenuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return
      const more = moreButtonRef.current
      if (more?.contains(e.target as Node)) return
      onCloseMenu()
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isMenuOpen, onCloseMenu])

  const openPopup = () => {
    if (moreButtonRef.current) setAnchorRect(moreButtonRef.current.getBoundingClientRect())
    onToggleMenu()
  }

  const popupItem = (
    icon: string,
    label: string,
    desc: string,
    onClick: (e: React.MouseEvent) => void,
    variant: 'default' | 'danger' = 'default'
  ) => (
    <button
      type="button"
      className={variant === 'danger' ? styles.menuPopupItemDanger : styles.menuPopupItem}
      onClick={onClick}
      title={desc}
    >
      <span className={styles.menuPopupIcon} aria-hidden>{icon}</span>
      <span className={styles.menuPopupText}>
        <span className={styles.menuPopupLabel}>{label}</span>
        <span className={styles.menuPopupDesc}>{desc}</span>
      </span>
    </button>
  )

  const popupWidth = 280
  const popupEstimatedHeight = 380
  const gap = 4
  const popupStyle = anchorRect
    ? (() => {
        const left = Math.min(anchorRect.left, window.innerWidth - popupWidth)
        const spaceBelow = window.innerHeight - (anchorRect.bottom + gap)
        const openDown = spaceBelow >= popupEstimatedHeight
        const top = openDown
          ? anchorRect.bottom + gap
          : Math.max(gap, anchorRect.top - popupEstimatedHeight - gap)
        return { left, top }
      })()
    : undefined

  const popupContent =
    isMenuOpen &&
    anchorRect &&
    popupStyle &&
    createPortal(
      <div
        ref={menuRef}
        className={styles.menuPopup}
        style={popupStyle}
        role="menu"
        aria-label="Ações da ata"
      >
        {canEdit(meetingMinutes) &&
          popupItem('✏️', 'Editar', 'Abrir ata para alterar', (e) => { onAwardSelos?.(1, { clientX: e.clientX, clientY: e.clientY }); onEdit(meetingMinutes.id); onCloseMenu() })}
        {popupItem('📋', 'Copiar', 'Criar nova ata igual (original fica arquivada)', (e) => { onAwardSelos?.(1, { clientX: e.clientX, clientY: e.clientY }); onCopy(meetingMinutes.id); onCloseMenu() })}
        {popupItem('🌐📄', 'HTML e PDF', 'Baixar HTML e imprimir como PDF', (e) => { onAwardSelos?.(2, { clientX: e.clientX, clientY: e.clientY }); downloadAtaAsHtml(meetingMinutes); printAtaAsPdf(meetingMinutes); onCloseMenu() })}
        {popupItem('🌐', 'Exportar HTML', 'Baixar arquivo .html da ata', (e) => { onAwardSelos?.(1, { clientX: e.clientX, clientY: e.clientY }); downloadAtaAsHtml(meetingMinutes); onCloseMenu() })}
        {popupItem('📄', 'Imprimir PDF', 'Abrir diálogo de impressão (Ctrl+P)', (e) => { onAwardSelos?.(1, { clientX: e.clientX, clientY: e.clientY }); printAtaAsPdf(meetingMinutes); onCloseMenu() })}
        {popupItem('{}', 'Baixar JSON', 'Arquivo .json com os dados da ata', (e) => { onAwardSelos?.(1, { clientX: e.clientX, clientY: e.clientY }); downloadAtaAsJson(meetingMinutes); onCloseMenu() })}
        {popupItem('📋{}', 'Exportar para Power Apps', 'Copiar JSON e abrir Power App (se configurado)', async (e) => {
          onAwardSelos?.(1, { clientX: e.clientX, clientY: e.clientY })
          const payload = { cabecalho: meetingMinutes.cabecalho, attendance: meetingMinutes.attendance, itens: meetingMinutes.itens }
          try {
            await navigator.clipboard.writeText(JSON.stringify(payload, null, 0))
            const { powerAppsUrl } = getEnvConfig()
            if (powerAppsUrl?.trim()) window.open(powerAppsUrl.trim(), '_blank', 'noopener,noreferrer')
            alert(powerAppsUrl?.trim() ? 'JSON copiado! A página do Power App foi aberta.' : 'JSON copiado! Cole no Power App para importar.')
          } catch { alert('Não foi possível copiar o JSON.') }
          onCloseMenu()
        })}
        {popupItem('🔗', 'Copiar link', 'Link para compartilhar ou importar esta ata', async (e) => {
          onAwardSelos?.(1, { clientX: e.clientX, clientY: e.clientY })
          const link = `${window.location.origin}${window.location.pathname}#${encodeAtaToHash(meetingMinutes)}`
          try { await navigator.clipboard.writeText(link); alert('Link copiado!') } catch { alert('Não foi possível copiar o link.') }
          onCloseMenu()
        })}
        {popupItem('🗑️', 'Descartar', 'Excluir ata permanentemente', (e) => { onAwardSelos?.(1, { clientX: e.clientX, clientY: e.clientY }); onDelete(meetingMinutes.id); onCloseMenu() }, 'danger')}
      </div>,
      document.body
    )

  return (
    <>
      <div className={styles.row} data-open={isMenuOpen}>
        <div className={styles.rowMain}>
          <span className={styles.rowIcon} aria-hidden>📄</span>
          <span className={styles.rowNumero}>{meetingMinutes.cabecalho.numero}</span>
          <span className={styles.rowTitulo} title={meetingMinutes.cabecalho.titulo || ''}>
            {meetingMinutes.cabecalho.titulo || meetingMinutes.cabecalho.tipo || '—'}
          </span>
          <span className={styles.rowMeta}>
            {meetingMinutes.cabecalho.tipo} · {formatDate(meetingMinutes.cabecalho.data)}
            {meetingMinutes.cabecalho.contrato
              ? ` · Contrato: ${meetingMinutes.cabecalho.contrato}`
              : ''}
          </span>
          {meetingMinutes.arquivada && (
            <span className={styles.badgeArquivada}>Arquivada</span>
          )}
        </div>
        <div className={styles.rowActions}>
          {canEdit(meetingMinutes) && (
            <button
              type="button"
              className={styles.quickIcon}
              title="Editar"
              aria-label="Editar ata"
              onClick={(e) => { e.stopPropagation(); onAwardSelos?.(1, { clientX: e.clientX, clientY: e.clientY }); onEdit(meetingMinutes.id) }}
            >
              ✏️
            </button>
          )}
          <button
            type="button"
            className={styles.quickIcon}
            title="Copiar"
            aria-label="Copiar ata"
            onClick={(e) => { e.stopPropagation(); onAwardSelos?.(1, { clientX: e.clientX, clientY: e.clientY }); onCopy(meetingMinutes.id) }}
          >
            📋
          </button>
          <button
            type="button"
            className={styles.quickIcon}
            title="Exportar HTML"
            aria-label="Exportar HTML"
            onClick={(e) => { e.stopPropagation(); onAwardSelos?.(1, { clientX: e.clientX, clientY: e.clientY }); downloadAtaAsHtml(meetingMinutes) }}
          >
            🌐
          </button>
          <button
            type="button"
            className={styles.quickIcon}
            title="Excluir"
            aria-label="Excluir ata"
            onClick={(e) => { e.stopPropagation(); onAwardSelos?.(1, { clientX: e.clientX, clientY: e.clientY }); onDelete(meetingMinutes.id) }}
          >
            🗑️
          </button>
          <button
            ref={moreButtonRef}
            type="button"
            className={styles.moreBtn}
            onClick={(e) => { e.stopPropagation(); openPopup() }}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            aria-label="Mais ações"
            title="Mais ações"
          >
            {isMenuOpen ? '▲' : '▼'}
          </button>
        </div>
      </div>
      {popupContent}
    </>
  )
}

const PROJECT_KEY_NONE = '\u200bSem projeto'

export default function MeetingMinutesListByProject({
  atas,
  onEdit,
  onCopy,
  onDelete,
  onAwardSelos,
}: MeetingMinutesListByProjectProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const byProject = atas.reduce<Record<string, MeetingMinutes[]>>((acc, ata) => {
    const key = (ata.cabecalho.projeto || '').trim() || PROJECT_KEY_NONE
    if (!acc[key]) acc[key] = []
    acc[key].push(ata)
    return acc
  }, {})

  const projectKeys = Object.keys(byProject).sort((a, b) => {
    if (a === PROJECT_KEY_NONE) return 1
    if (b === PROJECT_KEY_NONE) return -1
    return a.localeCompare(b)
  })

  return (
    <div className={styles.container}>
      {projectKeys.map((projectName) => (
        <section key={projectName} className={styles.folder}>
          <h3 className={styles.folderTitle}>
            <span className={styles.folderIcon} aria-hidden>📁</span>
            {projectName === PROJECT_KEY_NONE ? 'Sem projeto' : projectName}
            <span className={styles.folderCount}>{byProject[projectName].length} ata(s)</span>
          </h3>
          <ul className={styles.list} aria-label={`Atas do projeto ${projectName}`}>
            {byProject[projectName].map((ata) => (
              <li key={ata.id}>
                <MeetingMinutesRowCompact
                  meetingMinutes={ata}
                  onEdit={onEdit}
                  onCopy={onCopy}
                  onDelete={onDelete}
                  onAwardSelos={onAwardSelos}
                  isMenuOpen={openMenuId === ata.id}
                  onToggleMenu={() => setOpenMenuId((id) => (id === ata.id ? null : ata.id))}
                  onCloseMenu={() => setOpenMenuId(null)}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
