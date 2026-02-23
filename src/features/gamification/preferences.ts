/**
 * Preferência de gamificação: usuário pode ativar/desativar (oculta loja, conquistas, Selos, etc.).
 * Persistida no localStorage; padrão: desativada (false).
 * Mantido no módulo de gamificação para remoção modular futura.
 */
const PREF_KEY = 'atas-reuniao-gamification-enabled'

export function getGamificationEnabled(): boolean {
  try {
    const v = localStorage.getItem(PREF_KEY)
    if (v === null) return false
    return v === 'true'
  } catch {
    return false
  }
}

export function setGamificationEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(PREF_KEY, String(enabled))
  } catch (e) {
    console.warn('Falha ao salvar preferência de gamificação', e)
  }
}
