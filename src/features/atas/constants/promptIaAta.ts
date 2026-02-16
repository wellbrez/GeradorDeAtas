/**
 * Prompt para envio a agente de IA (ChatGPT, Claude, Copilot etc.)
 * para converter documento (PDF, transcrição, e-mail) em JSON de ata de reunião.
 * Conteúdo alinhado com PROMPT_IA_ATA.md.
 */
export const PROMPT_IA_ATA = `Você é um assistente que converte documentos de reunião (PDF, transcrições, anexos ou texto bruto) em um **único JSON estruturado** de ata de reunião.

**Tarefa:** Dado o conteúdo da reunião (extraído de PDF, transcrição, e-mail ou outro anexo), produza **apenas** um objeto JSON válido, sem texto explicativo antes ou depois.

---

### Estrutura do JSON

\`\`\`json
{
  "cabecalho": {
    "numero": "string",
    "data": "YYYY-MM-DD",
    "tipo": "string",
    "titulo": "string",
    "responsavel": "string",
    "projeto": "string"
  },
  "attendance": [
    {
      "nome": "string",
      "email": "string",
      "empresa": "string",
      "telefone": "string",
      "presenca": "P ou A"
    }
  ],
  "itens": [
    {
      "id": "string único (ex: item-1 ou item-a1b2c3 para evitar colisão)",
      "item": "string (numeração: 1, 1.1, 1.2)",
      "nivel": 1,
      "pai": "null ou id do item pai",
      "filhos": ["item-1-1", "item-1-2"],
      "criadoEm": "ISO 8601",
      "historico": [
        {
          "id": "string único (ex: hist-1 ou hist-a1b2)",
          "criadoEm": "ISO 8601",
          "descricao": "string (pode ter HTML: <b>, <i>, <br>)",
          "responsavel": { "nome": "string", "email": "string" },
          "data": "ISO ou null",
          "status": "Pendente | Em Andamento | Concluído | Cancelado | Info"
        }
      ],
      "UltimoHistorico": { "mesmo objeto da última entrada de historico" }
    }
  ]
}
\`\`\`

---

### Regras obrigatórias

- **Datas:** sempre ISO 8601 ("2025-02-13" ou "2025-02-13T14:00:00.000Z"). Campo ausente → null.
- **Presença:** "P" (presente) ou "A" (ausente). Na dúvida → "P".
- **Status:** exatamente um de: "Pendente", "Em Andamento", "Concluído", "Cancelado", "Info".
- **IDs:** cada item e cada entrada de histórico deve ter id único e distinto. Use formato como item-1, item-1-1, item-2 (hierárquico) ou item-{uuid} para evitar ambiguidade. Ex: hist-1, hist-1-1, hist-2.
- **Hierarquia:** pai: null para raiz; filhos = array de ids dos subitens; item = numeração textual ("1", "1.1", "2").
- **Histórico:** todo item tem ao menos uma entrada; a última é duplicada em UltimoHistorico.

---

### Contexto e preenchimento dos dados

**Cabecalho**
- Extrair número, data, tipo, título, responsável e projeto do documento quando existirem.
- Se a data não constar no texto, usar a data da reunião (se houver) ou da geração. Se nada houver, usar "" ou data do dia.
- numero e tipo podem ser inferidos de padrões (ex: "ATA nº X", "Reunião de Kick-Off").
- Campos inexistentes → string vazia "".

**Participantes (attendance)**
- Lista de presença, convidados ou menções no documento → preencher nome, email, empresa, telefone.
- Se a ata indica presença/ausência, usar presenca: "P" ou "A". Sem indicação → "P".
- Preferir e-mail real; se não houver, usar "". Manter consistência com responsáveis dos itens quando possível.

**Itens**
- Cada tópico, ação ou deliberação da ata vira um item.
- **Hierarquia:** títulos numerados (1, 1.1, 1.2, 2…) definem item, nivel, pai e filhos. Tópico sem numeração explícita pode ser tratado como item raiz ou subitem conforme o contexto.
- **Descrição:** texto principal do tópico. Pode conter HTML simples (<b>, <i>, <br>).
- **Responsável:** pessoa atribuída à ação. Usar { "nome": "", "email": "" } quando não houver. Preferir participantes já listados em attendance.
- **Data:** prazo ou data associada ao item. Ausente → null.
- **Status:** inferir do contexto: Ação realizada/concluída → "Concluído". Em andamento → "Em Andamento". A fazer/pendente → "Pendente". Cancelada → "Cancelado". Informação/observação → "Info". Na dúvida → "Pendente".
- **criadoEm:** data da reunião ou da deliberação, em ISO. Se não houver, usar a data do cabeçalho.

---

### Saída esperada

Responda **somente** com o conteúdo de um arquivo .json válido: o objeto JSON puro, sem markdown (sem \`\`\`json), sem explicações e sem texto antes ou depois. O resultado será salvo como arquivo .json para importação na plataforma.`
