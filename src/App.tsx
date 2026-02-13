import { useState } from 'react'
import { MeetingMinutesList } from '@features/atas/components'
import styles from './App.module.css'

function App() {
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleCreate = () => {
    // TODO: Abrir modal de criação
    alert('Funcionalidade de criação será implementada em breve')
  }

  const handleEdit = (id: string) => {
    // TODO: Abrir modal de edição
    alert(`Funcionalidade de edição será implementada em breve (ID: ${id})`)
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.container}>
          <h1>Sistema de Atas de Reunião</h1>
          <p className={styles.subtitle}>
            Gerencie suas atas de reunião com armazenamento local
          </p>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.container}>
          <MeetingMinutesList onCreate={handleCreate} onEdit={handleEdit} />
        </div>
      </main>
    </div>
  )
}

export default App
