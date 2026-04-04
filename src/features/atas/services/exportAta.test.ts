import { describe, expect, it } from 'vitest'
import { parseAtaFromHtml } from './exportAta'

describe('parseAtaFromHtml', () => {
  it('retorna ata quando HTML contém payload válido no script esperado', () => {
    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <body>
          <script type="application/json" id="ata-data">
            {
              "id": "ata-1",
              "cabecalho": {
                "numero": "ATA-1",
                "data": "2026-04-04",
                "tipo": "Reunião de Acompanhamento",
                "titulo": "Status",
                "responsavel": "Maria",
                "projeto": "Projeto X",
                "contrato": "CTR-1"
              },
              "attendance": [],
              "itens": [],
              "createdAt": "2026-04-04T10:00:00.000Z",
              "updatedAt": "2026-04-04T10:00:00.000Z"
            }
          </script>
        </body>
      </html>
    `

    const parsed = parseAtaFromHtml(html)

    expect(parsed).not.toBeNull()
    expect(parsed?.id).toBe('ata-1')
    expect(parsed?.cabecalho.numero).toBe('ATA-1')
  })

  it('retorna null quando script não existe', () => {
    const html = '<html><body><h1>Sem payload</h1></body></html>'

    const parsed = parseAtaFromHtml(html)

    expect(parsed).toBeNull()
  })

  it('retorna null para payload inválido sem campos mínimos', () => {
    const html = `
      <html>
        <body>
          <script type="application/json" id="ata-data">{"cabecalho":{},"attendance":"x","itens":[]}</script>
        </body>
      </html>
    `

    const parsed = parseAtaFromHtml(html)

    expect(parsed).toBeNull()
  })
})
