import { useState } from 'react'
import { Input, Button, Select } from '@components/ui'
import type { Cabecalho, Participant, Presenca } from '@/types'
import styles from './Step1CabecalhoParticipantes.module.css'

export interface Step1CabecalhoParticipantesProps {
  cabecalho: Cabecalho
  onCabecalhoChange: (patch: Partial<Cabecalho>) => void
  participants: Participant[]
  onAddParticipant: (p: Participant) => void
  onRemoveParticipant: (index: number) => void
  onTogglePresenca: (index: number) => void
  tiposAta: string[]
}

export default function Step1CabecalhoParticipantes({
  cabecalho,
  onCabecalhoChange,
  participants,
  onAddParticipant,
  onRemoveParticipant,
  onTogglePresenca,
  tiposAta,
}: Step1CabecalhoParticipantesProps) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [telefone, setTelefone] = useState('')
  const [presenca, setPresenca] = useState<Presenca>('P')

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

  const tipoOptions = tiposAta.map((t) => ({ value: t, label: t }))

  return (
    <div className={styles.container}>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Cabeçalho da Ata</h3>
        <div className={styles.cabecalhoGrid}>
          <Input
            label="Número da Ata"
            value={cabecalho.numero}
            onChange={(e) => onCabecalhoChange({ numero: e.target.value })}
            placeholder="Ex: 001"
          />
          <Input
            label="Data"
            type="date"
            value={cabecalho.data}
            onChange={(e) => onCabecalhoChange({ data: e.target.value })}
          />
          <Select
            label="Tipo"
            options={tipoOptions}
            value={cabecalho.tipo}
            onChange={(e) => onCabecalhoChange({ tipo: e.target.value })}
            placeholder="Selecione o tipo"
          />
          <Input
            label="Responsável"
            value={cabecalho.responsavel}
            onChange={(e) => onCabecalhoChange({ responsavel: e.target.value })}
            placeholder="Nome do responsável"
          />
          <Input
            label="Projeto"
            value={cabecalho.projeto}
            onChange={(e) => onCabecalhoChange({ projeto: e.target.value })}
            placeholder="Nome do projeto"
            fullWidth
          />
        </div>
        <Input
          label="Título"
          value={cabecalho.titulo}
          onChange={(e) => onCabecalhoChange({ titulo: e.target.value })}
          placeholder="Título da reunião"
          fullWidth
        />
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Lista de Participantes</h3>
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
          <Select
            options={[
              { value: 'P', label: 'Presente' },
              { value: 'A', label: 'Ausente' },
            ]}
            value={presenca}
            onChange={(e) => setPresenca(e.target.value as Presenca)}
          />
          <Button onClick={handleAdd}>Adicionar</Button>
        </div>

        <div className={styles.participantList}>
          {participants.length === 0 ? (
            <p className={styles.empty}>Nenhum participante. Adicione ao menos um.</p>
          ) : (
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
                    <td>{p.empresa}</td>
                    <td>{p.email}</td>
                    <td>{p.telefone}</td>
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
                    <td>
                      <Button variant="danger" size="sm" onClick={() => onRemoveParticipant(i)}>
                        Remover
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}
