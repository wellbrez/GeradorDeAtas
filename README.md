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

O site é publicado **automaticamente** ao dar push na branch **`main`**, via [GitHub Actions](.github/workflows/pages.yml). Não é usada a branch `gh-pages` (evita branches extras só para o site).

**Configuração única no GitHub:** em **Settings → Pages → Build and deployment**, defina **Source** como **GitHub Actions** (não “Deploy from a branch”).

**Ambiente `github-pages` e branch `main`:** em **Settings → Environments → `github-pages`**, em **Deployment branches**, inclua **`main`** (ou use “All branches”). Se só `master` estiver permitido, o job **deploy** falha com *Branch "main" is not allowed to deploy to github-pages* e o site fica sem os arquivos novos (página em branco ou 404 nos assets). Depois de ajustar, rode de novo o workflow em **Actions → Deploy GitHub Pages → Re-run jobs**.

Para validar o build localmente antes do push:

```bash
npm run deploy
```

Equivale a `npm run build` e gera a pasta `dist`.

Se ainda existir uma branch antiga `gh-pages` no remoto, você pode removê-la após ativar o deploy por Actions: `git push origin --delete gh-pages`.

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
- Filtros: pesquisa por número/texto; modo foco (só Pendente, Em andamento ou itens alterados na data da reunião, mantendo hierarquia)
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
│   ├── hooks/          # useAtaForm, useMeetingMinutesList
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
