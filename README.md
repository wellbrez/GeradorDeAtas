# Sistema de Atas de Reunião

Sistema web client-side para geração e gerenciamento de atas de reunião com armazenamento local no navegador.

**Aplicação publicada:** [https://wellbrez.github.io/GeradorDeAtas/](https://wellbrez.github.io/GeradorDeAtas/)

## Características

- **Armazenamento local**: dados persistidos no localStorage do navegador
- **Hierarquia de itens**: suporte a itens e sub-itens com numeração automática (1, 1.1, 1.1.1)
- **Rastreabilidade total**: histórico completo de todas as ações
- **Paleta Vale**: interface com cores e padrões do design Vale
- **Lista de presença do Microsoft Teams**: importação de participantes a partir da presença da reunião
- **Exportação HTML/PDF**: geração de HTML formatado com paginação, filtros e impressão
- **Links compartilháveis**: importação de ata via URL (#base64); link "Abrir no app" no HTML/PDF exportados

## Manual do usuário (passo a passo)

Esta seção é um **guia operacional** (sem foco técnico) para usar **cada funcionalidade** do gerador de atas.

### 0) Primeira vez usando (recomendado)

- **Acessar o app**:
  - Acesse a aplicação publicada (link acima) ou rode localmente (ver seções “Instalação/Desenvolvimento”).
- **Entender onde fica salvo**:
  - As atas ficam salvas **no navegador** (localStorage). Trocar de navegador/perfil, limpar dados do site ou usar modo anônimo pode fazer “sumir” as atas.
- **Dica prática**:
  - Se você precisa compartilhar para outra pessoa, use **Exportar HTML/PDF/JSON** ou **Copiar link** (detalhado abaixo).

### 1) Tela inicial (lista de atas)

Na lista você normalmente faz:

- **Criar** uma ata nova
- **Abrir/Editar** uma ata existente
- **Copiar** uma ata (e arquivar a original)
- **Excluir** uma ata
- **Exportar** (HTML/PDF/JSON) e **Copiar link**

#### 1.1) Criar uma nova ata

- Clique em **Nova ata**.
- O formulário abre em **tela cheia** e é preenchido em etapas.

#### 1.2) Editar uma ata existente

- Na ata desejada, clique em **Editar**.
- Faça as alterações e clique em **Salvar** ao final.

#### 1.3) Copiar uma ata (e arquivar a original)

Esse é o fluxo recomendado quando você quer “versões”/“revisões” sem perder rastreabilidade.

- Na ata desejada, clique em **Copiar**.
- O sistema cria uma **nova ata baseada na existente**.
- A ata original fica marcada como **Arquivada** (ela continua existindo, mas deixa de ser a “ativa”).
- As atas arquivadas aparecem com badge **“Arquivada”** e **não exibem botão Editar** (regra de UX/operacional do projeto).

#### 1.4) Excluir uma ata

- Na ata desejada, clique em **Excluir**.
- Confirme a ação quando solicitado.

> Observação: a exclusão remove a ata do armazenamento local do navegador.

---

### 2) Etapa 1 — Cabeçalho e participantes

Nesta etapa você preenche os dados gerais e define quem está na reunião.

#### 2.1) Preencher o cabeçalho

- Preencha os campos do cabeçalho (ex.: **número**, **data**, **tipo**, **título**, **projeto**, **responsável**).
- Clique em **Avançar** para ir para os itens.

#### 2.2) Adicionar participantes manualmente

- Na seção de participantes, adicione linhas com:
  - **nome**
  - **empresa**
  - **e-mail**
  - **telefone**
  - **presença** (P/A)

#### 2.3) Importar lista de presença do Microsoft Teams

- Na reunião do **Microsoft Teams**, abra a lista de participantes/presença e **exporte/obtenha a lista** (conforme as permissões da sua organização).
- No gerador de atas, use a ação de **Importar do Teams**.
- Cole/importe a lista e revise o resultado:
  - presença (P/A),
  - nomes duplicados (se existirem),
  - e-mails (quando disponíveis).

#### 2.4) Marcar todos como ausentes

- Use a ação **Marcar todos ausentes** quando precisar padronizar presença rapidamente.
- Depois, altere manualmente apenas quem compareceu.

---

### 3) Etapa 2 — Itens (pauta, decisões e ações)

Aqui você registra os **itens da ata**, com hierarquia, responsáveis, status, datas e histórico.

#### 3.1) Criar itens e subitens (hierarquia)

- Adicione um **item** (nível principal).
- Para detalhar, adicione **subitens** dentro do item.
- A numeração é automática, seguindo o padrão:
  - `1`
  - `1.1`
  - `1.1.1`

#### 3.2) Campos do item

Um item pode ter:

- **Descrição**: rich text (negrito/itálico/sublinhado/cores da paleta Vale)
- **Responsável**
- **Data**
- **Status** (ex.: Pendente, Em Andamento, Concluído, Cancelado, Info)

#### 3.3) Responsável do item (dica importante)

- O responsável do item é escolhido a partir dos **participantes da ata**.
- Existe a opção **“Adicionar novo integrante à ata”** dentro do seletor, que:
  - adiciona a pessoa na lista de participantes e
  - já a seleciona como responsável do item.

#### 3.4) Editar um item (edição inline)

- Use a ação de **Editar** do item.
- O formulário de edição aparece **logo abaixo do item**, sem esconder os demais (edição inline).
- Salve a alteração do item.

#### 3.5) Expandir/recolher subitens

- Use o botão de **expandir/recolher** à esquerda do item (estilo Excel: ▶/▼).
- Por padrão, itens com subitens tendem a aparecer **expandidos** ao carregar.

#### 3.6) Pesquisa e filtros (para “achar rápido”)

- Use a **pesquisa** para buscar por:
  - número do item (ex.: `2.3`) ou
  - texto da descrição.
- Use o **modo foco** quando quiser enxergar apenas o que importa no dia:
  - Itens **Pendente/Em Andamento** e/ou itens alterados na data da reunião (mantendo a hierarquia para dar contexto).

---

### 4) Histórico e rastreabilidade (como funciona na prática)

O sistema mantém histórico para rastrear alterações.

- **Criação**:
  - Um item novo começa com **um único registro de histórico** (inicial).
  - A primeira edição **substitui** esse registro inicial, em vez de criar outro (para evitar duplicidade “vazia”).
- **Edição de data do histórico**:
  - Cada linha de histórico pode ter ação de editar a data (ícone 📅).
- **Excluir linha do histórico**:
  - Há ação de excluir (✕), sempre com confirmação.
  - Regra operacional: só é permitido excluir histórico **no mesmo dia ou no dia seguinte** ao `criadoEm` do registro, e apenas se o item tiver **mais de um** histórico.

---

### 5) Regras de completude (para uma “ata bem preenchida”)

Para ajudar na qualidade do registro, o app usa destaques/indicadores:

- **Itens Pendente e Em Andamento**:
  - devem ter **descrição**, **responsável** e **data válida** (não vencida).
- **Itens Concluído, Cancelado e Info**:
  - **apenas a descrição é obrigatória**; data e responsável são opcionais (sem alerta quando vazios).

---

### 6) Exportação (HTML / PDF / JSON / Link)

Todas as opções abaixo partem da ideia: **você está com a ata pronta na tela** e quer gerar uma saída compartilhável.

#### 6.1) Exportar HTML (arquivo navegável com filtros)

- Clique em **Exportar HTML**.
- O app baixa um arquivo `.html` com:
  - formatação pronta para leitura
  - filtros interativos no próprio HTML
  - suporte a impressão
- Para usar:
  - abra o `.html` no navegador
  - use os filtros para localizar itens por responsável/status/data/descrição

#### 6.2) Exportar PDF (via impressão)

- Clique em **Exportar PDF**.
- O app abre o diálogo de impressão do navegador.
- Selecione **Salvar como PDF** e conclua.

> Observação: o projeto prioriza compatibilidade via impressão (`Ctrl+P`) com estilos de print e paginação.

#### 6.3) Exportar JSON (backup dos dados)

- Clique em **Exportar JSON**.
- Um arquivo `.json` é baixado com os dados completos da ata.
- Use esse arquivo como:
  - backup
  - insumo para automações externas
  - integração com Power Platform (ver seção Power Apps)

#### 6.4) Copiar link (URL compartilhável que importa a ata)

- Clique em **Copiar link**.
- O app gera uma URL no formato:
  - `https://.../GeradorDeAtas/#<base64-json>`
- Envie o link para outra pessoa.
- Ao abrir o link, a ata é **importada automaticamente** e aberta em modo edição.

#### 6.5) Link “Abrir esta ata no aplicativo” no HTML/PDF

- O HTML exportado (e o PDF gerado a partir dele) inclui no topo um link:
  - **“Abrir esta ata no aplicativo (modo edição)”**
- Esse link permite voltar do documento exportado para o app, trazendo os dados embutidos.

---

## Power Apps (exportação/importação) — `AtaSaver.msapp`

Esta seção documenta como usar o pacote **Canvas App** `AtaSaver.msapp` que está neste repositório.

### 1) O que é o `AtaSaver.msapp`

- `AtaSaver.msapp` é um **pacote de aplicativo Canvas** do Power Apps.
- Ele é útil para operar no ecossistema **Power Platform** (por exemplo, para armazenar/exportar/encaminhar conteúdo da ata em um contexto corporativo, conforme o app foi concebido no seu ambiente).

> Importante: arquivos `.msapp` são binários; este repositório mantém o arquivo como referência e para importação no Power Apps Studio.

### 2) Como importar o `AtaSaver.msapp` no Power Apps (step by step)

Pré-requisitos:

- Acesso a um ambiente do Power Apps (tenant/ambiente corporativo).
- Permissão para **importar/criar** Canvas Apps no ambiente.

Passos:

- Acesse o portal do Power Apps:
  - `https://make.powerapps.com`
- No canto superior direito, selecione o **ambiente** correto.
- No menu, vá em **Apps**.
- Clique em **Import canvas app** (ou opção equivalente de importação).
- Selecione o arquivo `AtaSaver.msapp` (na raiz deste repositório).
- Aguarde o upload e finalize o assistente de importação/criação.
- Abra o app importado e clique em **Play** para executar.

### 3) Como “exportar” a ata do gerador web para usar no Power Apps

O fluxo mais robusto (e auditável) é usar o **JSON** como formato de integração.

- No gerador web, abra a ata desejada.
- Clique em **Exportar JSON**.
- No Power Apps (AtaSaver ou outro app do seu ambiente), implemente/ative o fluxo de:
  - carregar o arquivo `.json` (ou colar o conteúdo) e
  - persistir em um destino corporativo (por exemplo: SharePoint/Dataverse/OneDrive/SQL, conforme o ambiente permitir).

Alternativas (dependendo do objetivo):

- **HTML**: use quando o foco é “documento para leitura” com filtros no navegador.
- **PDF**: use quando o foco é “documento final” para envio/assinatura/arquivo.
- **Link compartilhável**: use quando o foco é permitir que alguém abra a ata diretamente no gerador web e continue a edição.

### 4) Boas práticas para Power Platform

- Prefira salvar o **JSON** como fonte da verdade (dados estruturados).
- Gere **HTML/PDF** como “visualização/relatório” a partir do JSON, quando necessário.
- Se o ambiente exigir retenção/auditoria, registre também metadados (data, projeto, responsável, versão/cópia, etc.).

## Stack

- **React 18+** com TypeScript
- **Vite** como build tool
- **localStorage** para persistência
- **CSS Modules** para estilização

## Instalação

Este repositório é mantido no GitHub. Para rodar localmente:

```bash
git clone https://github.com/wellbrez/GeradorDeAtas.git
cd AtasReuniao
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

## Funcionalidades

### Gerenciamento de atas

- Criar nova ata
- Editar ata existente
- Excluir ata
- Copiar ata (cria nova baseada em existente; original fica arquivada)
- Listar atas ordenadas por data

### Etapa 1: Cabeçalho e participantes

- Campos: número, data, tipo, título, projeto, responsável
- Importar participantes via lista de presença do Microsoft Teams
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

## Licença

MIT
