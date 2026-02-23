/**
 * Configuração de ambiente da SPA (localStorage): URL do Power Apps e logomarca.
 * Exportada/importada junto com o backup do ambiente.
 */

const STORAGE_KEY = 'atas-reuniao-env-config'

/** Tamanho máximo da logomarca em bytes (data URL) para não estourar localStorage/URL. */
export const MAX_LOGO_BYTES = 80 * 1024

/** Dimensão máxima (largura ou altura) da imagem da logo em pixels. */
export const MAX_LOGO_DIMENSION = 160

export interface EnvConfig {
  /** URL do Power Apps para onde abrir ao clicar em "Exportar para Power Apps". */
  powerAppsUrl?: string
  /** Data URL da logomarca (imagem pequena) exibida no canto superior esquerdo das atas. */
  logoDataUrl?: string
}

const defaultConfig: EnvConfig = {}

/**
 * Obtém a configuração de ambiente atual.
 */
export function getEnvConfig(): EnvConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultConfig }
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return {
      powerAppsUrl: typeof parsed.powerAppsUrl === 'string' ? parsed.powerAppsUrl : undefined,
      logoDataUrl: typeof parsed.logoDataUrl === 'string' ? parsed.logoDataUrl : undefined,
    }
  } catch {
    return { ...defaultConfig }
  }
}

/**
 * Salva (parcialmente) a configuração de ambiente.
 */
export function setEnvConfig(partial: Partial<EnvConfig>): void {
  const current = getEnvConfig()
  const next: EnvConfig = {
    powerAppsUrl: partial.powerAppsUrl !== undefined ? partial.powerAppsUrl : current.powerAppsUrl,
    logoDataUrl: partial.logoDataUrl !== undefined ? partial.logoDataUrl : current.logoDataUrl,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

/**
 * Comprime uma imagem para caber no limite (MAX_LOGO_BYTES) e retorna data URL.
 * Redimensiona para no máximo MAX_LOGO_DIMENSION e reduz qualidade JPEG se necessário.
 * @param file - Arquivo de imagem selecionado pelo usuário
 * @returns Data URL da imagem comprimida ou rejeita com mensagem
 */
export function compressLogoImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const w = img.naturalWidth
      const h = img.naturalHeight
      const scale = Math.min(1, MAX_LOGO_DIMENSION / Math.max(w, h, 1))
      const cw = Math.round(w * scale)
      const ch = Math.round(h * scale)
      const canvas = document.createElement('canvas')
      canvas.width = cw
      canvas.height = ch
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas não disponível'))
        return
      }
      ctx.drawImage(img, 0, 0, cw, ch)
      let quality = 0.82
      const tryDataUrl = (): string => {
        return canvas.toDataURL('image/jpeg', quality)
      }
      let dataUrl = tryDataUrl()
      while (dataUrl.length > MAX_LOGO_BYTES && quality > 0.2) {
        quality -= 0.1
        dataUrl = tryDataUrl()
      }
      if (dataUrl.length > MAX_LOGO_BYTES) {
        reject(new Error(`Imagem ainda grande após compressão (máx. ${MAX_LOGO_BYTES / 1024} KB). Use uma imagem menor.`))
        return
      }
      resolve(dataUrl)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Não foi possível carregar a imagem.'))
    }
    img.src = url
  })
}
