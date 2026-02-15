import { useMemo } from 'react'
import { Input, Button, Select } from '@components/ui'
import type { MeetingMinutes } from '@/types'
import styles from './MeetingMinutesListFilters.module.css'

export interface MeetingMinutesFiltersState {
  search: string
  tipo: string
  arquivada: 'todos' | 'ativas' | 'arquivadas'
  dataInicio: string
  dataFim: string
}

export const INITIAL_FILTERS: MeetingMinutesFiltersState = {
  search: '',
  tipo: '',
  arquivada: 'ativas',
  dataInicio: '',
  dataFim: '',
}

export interface MeetingMinutesListFiltersProps {
  atas: MeetingMinutes[]
  filters: MeetingMinutesFiltersState
  onFiltersChange: (filters: MeetingMinutesFiltersState) => void
  onClear: () => void
  resultCount: number
}

/**
 * Componente de filtros para a lista de atas.
 * Permite buscar por texto, filtrar por tipo, status de arquivamento e período.
 */
export default function MeetingMinutesListFilters({
  atas,
  filters,
  onFiltersChange,
  onClear,
  resultCount,
}: MeetingMinutesListFiltersProps) {
  const tipoOptions = useMemo(() => {
    const tipos = new Set(atas.map((a) => a.cabecalho.tipo).filter(Boolean))
    const opts = [{ value: '', label: 'Todos os tipos' }]
    ;[...tipos].sort().forEach((t) => opts.push({ value: t, label: t }))
    return opts
  }, [atas])

  const hasActiveFilters =
    filters.search !== '' ||
    filters.tipo !== '' ||
    filters.arquivada !== 'ativas' ||
    filters.dataInicio !== '' ||
    filters.dataFim !== ''

  const handleChange = (field: keyof MeetingMinutesFiltersState, value: string) => {
    onFiltersChange({ ...filters, [field]: value })
  }

  return (
    <div className={styles.container} role="search" aria-label="Filtros para busca de atas">
      <div className={styles.searchWrap}>
        <Input
          type="search"
          placeholder="Buscar..."
          value={filters.search}
          onChange={(e) => handleChange('search', e.target.value)}
          fullWidth
          aria-label="Buscar atas"
        />
      </div>
      <div className={styles.selectTipo}>
        <Select
          options={tipoOptions}
          value={filters.tipo}
          onChange={(e) => handleChange('tipo', e.target.value)}
          fullWidth
          aria-label="Filtrar por tipo"
        />
      </div>
      <div className={styles.selectArquivada}>
        <Select
          options={[
            { value: 'ativas', label: 'Ativas' },
            { value: 'arquivadas', label: 'Arquivadas' },
            { value: 'todos', label: 'Todas' },
          ]}
          value={filters.arquivada}
          onChange={(e) =>
            handleChange('arquivada', e.target.value as MeetingMinutesFiltersState['arquivada'])
          }
          fullWidth
          aria-label="Filtrar por status"
        />
      </div>
      <div className={styles.dateGroup}>
        <div className={styles.dateInputWrap}>
          <Input
            type="date"
            value={filters.dataInicio}
            onChange={(e) => handleChange('dataInicio', e.target.value)}
            fullWidth
            aria-label="Data inicial"
          />
        </div>
        <span className={styles.dateSeparator}>até</span>
        <div className={styles.dateInputWrap}>
          <Input
            type="date"
            value={filters.dataFim}
            onChange={(e) => handleChange('dataFim', e.target.value)}
            fullWidth
            aria-label="Data final"
          />
        </div>
      </div>
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClear} aria-label="Limpar filtros">
          Limpar
        </Button>
      )}
      <span className={styles.resultCount} aria-live="polite">
        {resultCount} ata{resultCount !== 1 ? 's' : ''}
      </span>
    </div>
  )
}
