/**
 * Ícones personalizados por upgrade da loja (SVG inline).
 */
import type { UpgradeId } from '../types'
import styles from './UpgradeIcon.module.css'

const SIZE = 40

const ICONS: Record<string, React.ReactNode> = {
  caneta: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
    </svg>
  ),
  bloco_notas: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="20" rx="2" />
      <path d="M7 7h10M7 11h10M7 15h6" />
    </svg>
  ),
  grampeador: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 8v8M18 8v8M6 12h12M8 6v2M16 6v2" />
      <rect x="4" y="10" width="16" height="4" rx="1" />
    </svg>
  ),
  organizador_mesa: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="4" width="20" height="14" rx="1" />
      <path d="M6 8v4M10 8v4M14 8v4M18 8v4" />
      <path d="M4 18h16" />
    </svg>
  ),
  gaveta: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="4" width="20" height="16" rx="1" />
      <path d="M2 10h20M2 16h20" />
      <circle cx="6" cy="13" r="1" fill="currentColor" />
      <circle cx="18" cy="13" r="1" fill="currentColor" />
    </svg>
  ),
  pasta_arquivo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 4h6l2 2h8v12H4V4z" />
      <path d="M10 4v4" />
    </svg>
  ),
  arquivo_suspenso: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 2v4M16 2v4M4 8h16v12H4V8z" />
      <path d="M4 8v2h16M8 14h8" />
    </svg>
  ),
  armario_aco: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="20" height="20" rx="1" />
      <path d="M12 2v20M2 12h20M6 8v2M18 8v2M6 16v2M18 16v2" />
    </svg>
  ),
  sala_arquivo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path d="M9 22V12h6v10" />
      <path d="M8 12h8" />
    </svg>
  ),
  biblioteca_atas: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      <path d="M8 7h8M8 11h8M8 15h4" />
    </svg>
  ),
  centro_documentacao: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h4" />
      <path d="M12 2v4M6 6l2-2M18 6l-2-2" />
    </svg>
  ),
  microfilme: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="6" width="20" height="12" rx="1" />
      <path d="M6 10h2M6 14h2M16 10h2M16 14h2M10 10h4" />
    </svg>
  ),
  servidor_documentos: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="20" height="8" rx="1" />
      <rect x="2" y="14" width="20" height="8" rx="1" />
      <circle cx="6" cy="6" r="1" fill="currentColor" />
      <circle cx="6" cy="18" r="1" fill="currentColor" />
      <path d="M10 6h8M10 18h8" />
    </svg>
  ),
  nuvem_corporativa: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
      <path d="M12 12v4M10 14h4" />
    </svg>
  ),
  gestao_documental: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 3v18h18" />
      <path d="M18 9v4M14 9v4M10 9v4M6 9v4M7 3v6M11 3v6M15 3v6M19 3v6" />
    </svg>
  ),
  arquivo_nacional: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 4h6l2 2h8v14H4V4z" />
      <path d="M10 4v2M14 10h4M14 14h4M14 18h2" />
    </svg>
  ),
  memoria_institucional: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  repositorio_digital: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  ),
  camara_permanente: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 6h16v12H4z" />
      <path d="M12 2v4M8 22h8M12 14a2 2 0 100-4 2 2 0 000 4z" />
      <path d="M2 10h2M20 10h2M2 14h2M20 14h2" />
    </svg>
  ),
  patrimonio_documental: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2L15 8l6 1-4 4 1 6-6-3-6 3 1-6-4-4 6-1L12 2z" />
    </svg>
  ),
}

export interface UpgradeIconProps {
  iconKey: string
  size?: number
  className?: string
}

export default function UpgradeIcon({ iconKey, size = SIZE, className = '' }: UpgradeIconProps) {
  const content = ICONS[iconKey as UpgradeId] ?? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 9h6v6H9z" />
    </svg>
  )
  return (
    <span
      className={`${styles.wrap} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {content}
    </span>
  )
}
