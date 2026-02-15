import { useState, useEffect } from 'react'

/**
 * Hook que retorna um valor com debounce.
 * Útil para inputs de busca/filtro, evitando processamento em cada tecla.
 * @param value - Valor atual
 * @param delay - Delay em ms
 * @returns Valor com debounce aplicado
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
