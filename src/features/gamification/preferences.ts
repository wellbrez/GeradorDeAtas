/**
 * Preferência de gamificação: usuário pode desativar (oculta loja, conquistas, Selos, etc.).
 * Persistida no localStorage; padrão: ativada (true).
 * Mantido no módulo de gamificação para remoção modular futura.
 */
const PREF_KEY = 'atas-reuniao-gamification-enabled'

export function getGamificationEnabled(): boolean {
  try {
    const v = localStorage.getItem(PREF_KEY)
    if (v === null) return true
    return v === 'true'
  } catch {
    return true
  }
}

export function setGamificationEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(PREF_KEY, String(enabled))
  } catch (e) {
    console.warn('Falha ao salvar preferência de gamificação', e)
  }
}
