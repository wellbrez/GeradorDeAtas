import { useState, useRef, useEffect } from 'react'
import type { Participant } from '@/types'
import type { Responsavel } from '@/types'
import styles from './ResponsavelSelect.module.css'

export interface ResponsavelSelectProps {
  /** Integrantes da ata (participantes) */
  participants: Participant[]
  value: Responsavel
  onChange: (nome: string, email: string) => void
  /** Chamado quando o usuário adiciona um novo integrante à ata; em seguida deve-se selecioná-lo */
  onAddParticipant: (participant: Participant) => void
  placeholder?: string
  disabled?: boolean
}

/**
 * Dropdown pesquisável para escolher o responsável entre os integrantes da ata,
 * com opção de adicionar um novo integrante.
 */
export default function ResponsavelSelect({
  participants,
  value,
  onChange,
  onAddParticipant,
  placeholder = 'Selecione ou pesquise',
  disabled = false,
}: ResponsavelSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [addingNew, setAddingNew] = useState(false)
  const [newNome, setNewNome] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const displayLabel =
    value?.nome && value?.email
      ? `${value.nome} (${value.email})`
      : value?.nome || value?.email || ''

  const filtered = query.trim()
    ? participants.filter(
        (p) =>
          p.nome.toLowerCase().includes(query.toLowerCase()) ||
          p.email.toLowerCase().includes(query.toLowerCase())
      )
    : participants

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setAddingNew(false)
      }
    }
    if (open) document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  const handleSelect = (nome: string, email: string) => {
    onChange(nome, email)
    setOpen(false)
    setQuery('')
  }

  const handleAddNew = () => {
    if (!newNome.trim() || !newEmail.trim()) return
    const p: Participant = {
      nome: newNome.trim(),
      email: newEmail.trim(),
      empresa: '',
      telefone: '',
      presenca: 'P',
    }
    onAddParticipant(p)
    onChange(p.nome, p.email)
    setNewNome('')
    setNewEmail('')
    setAddingNew(false)
    setOpen(false)
  }

  return (
    <div className={styles.wrapper} ref={containerRef}>
      <div className={styles.triggerWrap}>
        <input
          type="text"
          className={styles.input}
          value={open ? query : displayLabel}
          onChange={(e) => {
            setQuery(e.target.value)
            if (!open) setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={!open}
        />
        <button
          type="button"
          className={styles.chevron}
          onClick={() => setOpen((o) => !o)}
          disabled={disabled}
          aria-label={open ? 'Fechar' : 'Abrir'}
        >
          {open ? '▲' : '▼'}
        </button>
      </div>

      {open && (
        <div className={styles.dropdown}>
          {!addingNew ? (
            <>
              {filtered.length === 0 && !query.trim() && (
                <div className={styles.empty}>Nenhum integrante na ata.</div>
              )}
              {filtered.length === 0 && query.trim() && (
                <div className={styles.empty}>Nenhum resultado. Adicione um novo integrante abaixo.</div>
              )}
              {filtered.map((p) => (
                <button
                  key={`${p.email}-${p.nome}`}
                  type="button"
                  className={styles.option}
                  onClick={() => handleSelect(p.nome, p.email)}
                >
                  {p.nome} <span className={styles.optionEmail}>{p.email}</span>
                </button>
              ))}
              <button
                type="button"
                className={styles.addNew}
                onClick={() => setAddingNew(true)}
              >
                + Adicionar novo integrante à ata
              </button>
            </>
          ) : (
            <div className={styles.addForm}>
              <input
                type="text"
                className={styles.addInput}
                value={newNome}
                onChange={(e) => setNewNome(e.target.value)}
                placeholder="Nome"
              />
              <input
                type="email"
                className={styles.addInput}
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="E-mail"
              />
              <div className={styles.addFormActions}>
                <button type="button" className={styles.addFormBtn} onClick={() => setAddingNew(false)}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className={styles.addFormBtnPrimary}
                  onClick={handleAddNew}
                  disabled={!newNome.trim() || !newEmail.trim()}
                >
                  Adicionar e selecionar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
