import { useRef, useState } from 'react'
import { Input, Button, Textarea, ConfirmModal } from '@components/ui'
import type { Cabecalho, Participant, Presenca } from '@/types'
import { parseParticipantsFromFile } from '../utils/importParticipants'
import styles from './Step1CabecalhoParticipantes.module.css'

export interface Step1CabecalhoParticipantesProps {
  cabecalho: Cabecalho
  onCabecalhoChange: (patch: Partial<Cabecalho>) => void
  participants: Participant[]
  onAddParticipant: (p: Participant) => void
  onRemoveParticipant: (index: number) => void
  onUpdateParticipant: (index: number, patch: Partial<Participant>) => void
  onTogglePresenca: (index: number) => void
  onMarkAllAbsent: () => void
  tiposAta: string[]
}

export default function Step1CabecalhoParticipantes({
  cabecalho,
  onCabecalhoChange,
  participants,
  onAddParticipant,
  onRemoveParticipant,
  onUpdateParticipant,
  onTogglePresenca,
  onMarkAllAbsent,
  tiposAta,
}: Step1CabecalhoParticipantesProps) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [telefone, setTelefone] = useState('')
  const [presenca, setPresenca] = useState<Presenca>('P')
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; field: 'empresa' | 'telefone' } | null>(null)
  const [confirmState, setConfirmState] = useState<
    { type: 'removeParticipant'; index: number } | { type: 'markAllAbsent' } | null
  >(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAdd = () => {
    const n = nome.trim()
    const e = email.trim()
    if (!n || !e) {
      alert('Nome e e-mail são obrigatórios.')
      return
    }
    onAddParticipant({ nome: n, email: e, empresa: empresa.trim(), telefone: telefone.trim(), presenca })
    setNome('')
    setEmail('')
    setEmpresa('')
    setTelefone('')
    setPresenca('P')
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    setImportStatus(null)
    if (!file) return
    try {
      const list = await parseParticipantsFromFile(file)
      if (list.length === 0) {
        setImportStatus({ type: 'error', message: 'Nenhum participante encontrado no arquivo. Verifique as colunas (Nome, E-mail).' })
        return
      }
      let added = 0
      let updated = 0
      const emailNorm = (s: string) => (s || '').trim().toLowerCase()
      list.forEach((p) => {
        const idx = participants.findIndex((prev) => emailNorm(prev.email) === emailNorm(p.email))
        if (idx >= 0) {
          onUpdateParticipant(idx, { presenca: 'P' })
          updated += 1
        } else {
          onAddParticipant(p)
          added += 1
        }
      })
      const parts = []
      if (added) parts.push(`${added} adicionado(s)`)
      if (updated) parts.push(`${updated} atualizado(s) para presente`)
      setImportStatus({ type: 'success', message: parts.length ? parts.join('; ') + '.' : 'Nenhuma alteração.' })
    } catch (err) {
      setImportStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Erro ao ler o arquivo.',
      })
    }
  }

  const handleRemoveClick = (index: number) => {
    setConfirmState({ type: 'removeParticipant', index })
  }

  const handleCellSave = (rowIndex: number, field: 'empresa' | 'telefone', value: string) => {
    onUpdateParticipant(rowIndex, { [field]: value })
    setEditingCell(null)
  }

  const handleMarkAllAbsentClick = () => {
    setConfirmState({ type: 'markAllAbsent' })
  }

  const handleConfirmModalConfirm = () => {
    if (confirmState?.type === 'removeParticipant') {
      onRemoveParticipant(confirmState.index)
    } else if (confirmState?.type === 'markAllAbsent') {
      onMarkAllAbsent()
    }
    setConfirmState(null)
  }

  return (
    <div className={styles.container}>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Cabeçalho da Ata</h3>
        <div className={styles.cabecalhoGrid}>
          <div className={styles.cabecalhoRow1}>
            <Input
              label="Número da Ata"
              value={cabecalho.numero}
              onChange={(e) => onCabecalhoChange({ numero: e.target.value })}
              placeholder="Ex: AR-8001PZ-G-00044"
            />
            <Input
              label="Data"
              type="date"
              value={cabecalho.data}
              onChange={(e) => onCabecalhoChange({ data: e.target.value })}
            />
            <div className={styles.inputWithDatalist}>
              <label className={styles.label}>Tipo de reunião</label>
              <input
                type="text"
                list="tipo-ata-list"
                value={cabecalho.tipo}
                onChange={(e) => onCabecalhoChange({ tipo: e.target.value })}
                placeholder="Selecione ou digite o tipo"
                className={styles.input}
              />
              <datalist id="tipo-ata-list">
                {tiposAta.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
            <Input
              label="Responsável"
              value={cabecalho.responsavel}
              onChange={(e) => onCabecalhoChange({ responsavel: e.target.value })}
              placeholder="Nome do responsável"
            />
          </div>
          <div className={styles.projetoWrap}>
            <Input
              label="Projeto"
              value={cabecalho.projeto}
              onChange={(e) => onCabecalhoChange({ projeto: e.target.value })}
              placeholder="Nome do projeto"
              fullWidth
            />
          </div>
        </div>
        <div className={styles.tituloWrap}>
          <Textarea
            label="Título"
            value={cabecalho.titulo}
            onChange={(e) => onCabecalhoChange({ titulo: e.target.value })}
            placeholder="Título da reunião (até várias linhas)"
            fullWidth
            rows={4}
            className={styles.tituloTextarea}
          />
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Lista de Participantes</h3>
          <div className={styles.importActions}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleImport}
              className={styles.fileInput}
              aria-label="Importar lista de participantes"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              title="CSV (Teams) ou Excel"
            >
              📂 Importar lista (Teams ou Excel)
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleMarkAllAbsentClick}
              disabled={participants.length === 0}
              title="Marcar todos como ausentes"
            >
              Marcar todos ausentes
            </Button>
            <span className={styles.importHint}>CSV do Teams ou Excel com colunas Nome e E-mail</span>
          </div>
        </div>
        {importStatus && (
          <p className={importStatus.type === 'success' ? styles.importSuccess : styles.importError}>
            {importStatus.message}
          </p>
        )}
        <div className={styles.addParticipant}>
          <Input
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          <Input
            placeholder="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            placeholder="Empresa"
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
          />
          <Input
            placeholder="Telefone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
          />
          <select
            className={styles.presencaSelect}
            value={presenca}
            onChange={(e) => setPresenca(e.target.value as Presenca)}
            title="Presença"
          >
            <option value="P">Presente</option>
            <option value="A">Ausente</option>
          </select>
          <Button onClick={handleAdd}>Adicionar</Button>
        </div>

        <div className={styles.participantList}>
          {participants.length === 0 ? (
            <p className={styles.empty}>Nenhum participante. Adicione manualmente ou importe um arquivo CSV (exportação Teams) ou Excel.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Empresa</th>
                    <th>E-mail</th>
                    <th>Telefone</th>
                    <th>Presença</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p, i) => (
                    <tr key={i}>
                      <td>{p.nome}</td>
                      <td
                        className={styles.editableCell}
                        onClick={() => setEditingCell({ rowIndex: i, field: 'empresa' })}
                        title="Clique para editar"
                      >
                        {editingCell?.rowIndex === i && editingCell?.field === 'empresa' ? (
                          <input
                            type="text"
                            className={styles.cellInput}
                            value={p.empresa}
                            onChange={(e) => onUpdateParticipant(i, { empresa: e.target.value })}
                            onBlur={(e) => handleCellSave(i, 'empresa', e.target.value.trim())}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur()
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        ) : (
                          <span className={styles.cellValue}>{p.empresa || '—'}</span>
                        )}
                      </td>
                      <td>{p.email}</td>
                      <td
                        className={styles.editableCell}
                        onClick={() => setEditingCell({ rowIndex: i, field: 'telefone' })}
                        title="Clique para editar"
                      >
                        {editingCell?.rowIndex === i && editingCell?.field === 'telefone' ? (
                          <input
                            type="text"
                            className={styles.cellInput}
                            value={p.telefone}
                            onChange={(e) => onUpdateParticipant(i, { telefone: e.target.value })}
                            onBlur={(e) => handleCellSave(i, 'telefone', e.target.value.trim())}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur()
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        ) : (
                          <span className={styles.cellValue}>{p.telefone || '—'}</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`${styles.presencaBadge} ${p.presenca === 'P' ? styles.presente : styles.ausente}`}
                          onClick={() => onTogglePresenca(i)}
                          title="Clique para alternar"
                        >
                          {p.presenca === 'P' ? 'P' : 'A'}
                        </button>
                      </td>
                      <td className={styles.removeCell}>
                        <button
                          type="button"
                          className={styles.removeBtn}
                          onClick={() => handleRemoveClick(i)}
                          title="Remover participante"
                          aria-label="Remover participante"
                        >
                          <svg className={styles.removeIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <ConfirmModal
        isOpen={confirmState !== null}
        onClose={() => setConfirmState(null)}
        onConfirm={handleConfirmModalConfirm}
        title={
          confirmState?.type === 'removeParticipant'
            ? 'Remover participante'
            : 'Marcar todos ausentes'
        }
        message={
          confirmState?.type === 'removeParticipant'
            ? 'Remover este participante da lista?'
            : 'Marcar todos os participantes como ausentes?'
        }
        confirmLabel="Confirmar"
        cancelLabel="Cancelar"
        confirmVariant={confirmState?.type === 'removeParticipant' ? 'danger' : 'primary'}
        closeOnOverlayClick={false}
      />
    </div>
  )
}
