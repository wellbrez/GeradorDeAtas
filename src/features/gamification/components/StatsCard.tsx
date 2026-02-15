/**
 * Card de estatísticas colapsável: barra compacta (~50px) com Selos e nível; expandir para detalhes em texto pequeno com tooltips.
 */
import { useState } from 'react'
import type { GamificationStats } from '../types'
import { LEVEL_TIERS } from '../achievements.config'
import { formatSelos } from '../gamificationService'
import styles from './StatsCard.module.css'

export interface StatsCardProps {
  stats: GamificationStats
  /** Meta opcional de atas no mês (ex: 4) para exibir barra */
  monthlyGoal?: number
}

/** Uma linha de estatística: label + ícone info (tooltip) + valor */
function StatRow({
  label,
  value,
  tooltip,
}: {
  label: string
  value: React.ReactNode
  tooltip: string
}) {
  return (
    <div className={styles.statRow}>
      <span className={styles.statLabel}>
        {label}
        <span className={styles.statInfo} title={tooltip} aria-label={tooltip}>
          ⓘ
        </span>
      </span>
      <span className={styles.statValue}>{value}</span>
    </div>
  )
}

export default function StatsCard({ stats, monthlyGoal = 4 }: StatsCardProps) {
  const [collapsed, setCollapsed] = useState(true)
  const nextMin = stats.nextLevelAtas
  const atCurrentMax = stats.totalAtas >= (LEVEL_TIERS[LEVEL_TIERS.length - 1]?.minAtas ?? 25)
  const progressToNext = atCurrentMax ? 100 : (stats.totalAtas / nextMin) * 100
  const progressMeta = monthlyGoal > 0 ? Math.min(100, (stats.atasThisMonth / monthlyGoal) * 100) : 0

  return (
    <div
      className={`${styles.card} ${collapsed ? styles.cardCollapsed : ''}`}
      role="region"
      aria-label="Estatísticas de gamificação"
    >
      <button
        type="button"
        className={styles.bar}
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Expandir estatísticas' : 'Recolher estatísticas'}
      >
        <span className={styles.barSelos} aria-hidden="true">{formatSelos(stats.lifetimeSelos, 'compact')}</span>
        <span className={styles.barLabel}>Selos</span>
        <span className={styles.barLevelIcon} aria-hidden="true">{stats.level.icon}</span>
        <span className={styles.barLevelTitle}>{stats.level.title}</span>
        <span className={styles.barChevron} aria-hidden="true">{collapsed ? '▶' : '▼'}</span>
      </button>
      {!collapsed && (
        <div className={styles.expanded}>
          <div className={styles.statsGrid}>
            <StatRow
              label="Selos"
              value={formatSelos(stats.lifetimeSelos, 'standard')}
              tooltip="Pontos acumulados ao salvar atas. Use na loja para comprar melhorias."
            />
            <StatRow
              label="Atas este mês"
              value={
                monthlyGoal > 0 ? (
                  <>{stats.atasThisMonth} / {monthlyGoal}</>
                ) : (
                  stats.atasThisMonth
                )
              }
              tooltip="Quantidade de atas criadas ou salvas no mês atual. Meta opcional para acompanhar produtividade."
            />
            {monthlyGoal > 0 && (
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Meta do mês</span>
                <div className={styles.progressWrap} title={`${stats.atasThisMonth}/${monthlyGoal} atas`}>
                  <div className={styles.progressBar} style={{ width: `${progressMeta}%` }} role="progressbar" />
                </div>
              </div>
            )}
            <StatRow
              label="Dias seguidos"
              value={stats.streakDays}
              tooltip="Quantidade de dias consecutivos (em ordem decrescente a partir de hoje) em que existe pelo menos uma ata."
            />
            <StatRow
              label="Total de atas"
              value={stats.totalAtas}
              tooltip="Número total de atas cadastradas (ativas e arquivadas)."
            />
            <StatRow
              label="Atas arquivadas"
              value={stats.atasArquivadas}
              tooltip="Atas marcadas como arquivadas (ex.: após copiar para nova ata)."
            />
            <StatRow
              label="Atas esta semana"
              value={stats.atasEstaSemana}
              tooltip="Atas com data ou criação nos últimos 7 dias."
            />
            <StatRow
              label="Total de itens"
              value={stats.totalItens}
              tooltip="Soma de todos os itens de pauta em todas as atas."
            />
            <StatRow
              label="Itens este mês"
              value={stats.itensThisMonth}
              tooltip="Itens de pauta nas atas criadas ou salvas no mês atual."
            />
            <StatRow
              label="Média itens/ata"
              value={stats.mediaItensPorAta}
              tooltip="Média de itens de pauta por ata (total de itens ÷ total de atas)."
            />
            <StatRow
              label="Maior ata (itens)"
              value={stats.maiorAtaItens}
              tooltip="Quantidade de itens na ata com mais itens de pauta."
            />
            <StatRow
              label="Participantes (total)"
              value={stats.totalParticipantes}
              tooltip="Soma de participantes listados em todas as atas."
            />
            <StatRow
              label="Projetos distintos"
              value={stats.projetosUnicos}
              tooltip="Quantidade de valores diferentes no campo projeto das atas."
            />
            <StatRow
              label="Dias c/ ata no mês"
              value={stats.diasComAtaNoMes}
              tooltip="Quantidade de dias distintos no mês atual em que há pelo menos uma ata."
            />
            <StatRow
              label="Conquistas"
              value={`${stats.unlockedCount} / ${stats.totalAchievements}`}
              tooltip="Conquistas desbloqueadas em relação ao total disponível."
            />
          </div>
          <div className={styles.levelCompact}>
            <div className={styles.levelRow}>
              <span className={styles.levelIcon} aria-hidden="true">{stats.level.icon}</span>
              <span className={styles.levelTitle}>{stats.level.title}</span>
            </div>
            <div className={styles.progressWrap} title={atCurrentMax ? 'Nível máximo' : `Próximo nível em ${nextMin} atas`}>
              <div
                className={styles.progressBar}
                style={{ width: `${progressToNext}%` }}
                role="progressbar"
                aria-valuenow={stats.totalAtas}
                aria-valuemin={0}
                aria-valuemax={atCurrentMax ? stats.totalAtas : nextMin}
              />
            </div>
            <span className={styles.levelSubtitle}>
              {atCurrentMax ? 'Nível máximo' : `Próximo: ${nextMin} atas`}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
