# Sistema de Atas de Reunião

Sistema web client-side para geração e gerenciamento de atas de reunião com armazenamento local no navegador.

**Aplicação publicada:** [https://wellbrez.github.io/GeradorDeAtas/](https://wellbrez.github.io/GeradorDeAtas/)

## Características

- **Armazenamento local**: dados persistidos no localStorage do navegador
- **Hierarquia de itens**: suporte a itens e sub-itens com numeração automática (1, 1.1, 1.1.1)
- **Rastreabilidade total**: histórico completo de todas as ações
- **Paleta Vale**: interface com cores e padrões do design Vale
- **Exportação HTML/PDF**: geração de HTML formatado com paginação, filtros e impressão
- **Links compartilháveis**: importação de ata via URL (#base64); link "Abrir no app" no HTML/PDF exportados

## Stack

- **React 18+** com TypeScript
- **Vite** como build tool
- **localStorage** para persistência
- **CSS Modules** para estilização

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Deploy (GitHub Pages)

```bash
npm run deploy
```

Publica o build da pasta `dist` na branch `gh-pages` do repositório.

## Funcionalidades

### Gerenciamento de atas

- Criar nova ata
- Editar ata existente
- Excluir ata
- Copiar ata (cria nova baseada em existente; original fica arquivada)
- Listar atas ordenadas por data

### Etapa 1: Cabeçalho e participantes

- Campos: número, data, tipo, título, projeto, responsável
- Importar participantes via planilha (xlsx)
- Participantes: nome, empresa, e-mail, telefone, presença (P/A)
- Marcar todos ausentes

### Etapa 2: Itens

- Itens hierárquicos com numeração automática
- Descrição (rich text), responsável, data, status
- Filtros: pesquisa por número/texto; ocultar Concluídos/Cancelados/Info não editados no dia
- Edição inline logo abaixo do item

### Exportação

- **Exportar HTML**: download do arquivo HTML com filtros interativos
- **Exportar PDF**: abre janela de impressão (Ctrl+P)
- **Exportar JSON**: download dos dados da ata
- **Copiar link**: gera URL compartilhável (#base64); ao acessar, a ata é importada e aberta em edição

### Links compartilháveis

- URL: `https://wellbrez.github.io/GeradorDeAtas/#<base64-json>`
- HTML/PDF exportados incluem link "🔗 Abrir esta ata no aplicativo (modo edição)" no topo
- Quem acessa o link importa a ata automaticamente

## Estrutura do projeto

```
src/
├── components/ui/       # Button, Input, Textarea, Select, Modal
├── features/atas/
│   ├── components/     # MeetingMinutesList, MeetingMinutesForm, Step1, Step2, etc.
│   ├── hooks/          # useAtaForm, useMeetingMinutes, useMeetingMinutesList
│   └── services/       # meetingMinutesService, exportAta, ataFilterScript
├── services/storage/   # storageService (localStorage)
├── utils/              # urlAtaImport, htmlSanitize, itemNumbering, id
├── types/              # tipos globais
└── styles/             # estilos globais
```

## Regras de desenvolvimento

Ver `.cursorrules` para regras detalhadas, convenções e lições aprendidas.

## Licença

MIT
