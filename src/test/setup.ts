/**
 * Setup global para testes Vitest no ambiente jsdom.
 */
Object.defineProperty(window, 'alert', {
  writable: true,
  value: vi.fn(),
})
