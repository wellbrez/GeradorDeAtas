# Sistema de Atas de Reunião

Sistema web client-side para geração e gerenciamento de atas de reunião com armazenamento local no navegador.

## Características

- ✅ **Armazenamento Local**: Dados persistidos no localStorage do navegador
- ✅ **Hierarquia de Itens**: Suporte a itens e sub-itens com numeração automática (1, 1.1, 1.1.1)
- ✅ **Rastreabilidade Total**: Histórico completo de todas as ações realizadas
- ✅ **Geração Automática de Índices**: Índices hierárquicos gerados automaticamente
- ✅ **Exportação HTML**: Geração de HTML formatado com paginação automática
- ✅ **Filtros Interativos**: Filtros no HTML gerado para facilitar visualização

## Stack Tecnológica

- **React 18+** com TypeScript
- **Vite** como build tool
- **localStorage** para persistência
- **CSS Modules** para estilização

## Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes básicos (Button, Input, etc)
│   └── layout/          # Componentes de layout
├── features/           # Features organizadas por domínio
│   ├── atas/           # Feature de Atas
│   ├── participantes/   # Feature de Participantes
│   └── itens/          # Feature de Itens
├── services/           # Serviços compartilhados
│   ├── storage/        # Gerenciamento de localStorage
│   ├── export/         # Exportação de HTML
│   └── index/          # Geração de índices
├── hooks/              # Custom hooks compartilhados
├── utils/              # Funções utilitárias
├── types/              # Types globais
└── styles/             # Estilos globais
```

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

## Preview

```bash
npm run preview
```

## Funcionalidades Principais

### 1. Gerenciamento de Atas
- Criar nova ata
- Editar ata existente
- Excluir ata
- Copiar ata (criar nova baseada em existente)
- Listar todas as atas

### 2. Participantes
- Adicionar participantes
- Remover participantes
- Marcar presença (Presente/Ausente)
- Informações: nome, email, empresa, telefone

### 3. Itens Hierárquicos
- Criar itens de reunião
- Criar sub-itens (hierarquia)
- Numeração automática
- Edição de descrição
- Atribuição de responsável
- Definição de data e status

### 4. Histórico e Rastreabilidade
- Histórico completo de cada item
- Timestamp de todas as ações
- Responsável por cada alteração
- Status: Pendente, Em Andamento, Concluído, Cancelado, Info

### 5. Exportação
- Geração de HTML formatado
- Paginação automática
- Estilos profissionais
- Filtros interativos no HTML gerado
- Download do arquivo HTML

## Estrutura de Dados

Ver documentação completa em `STACK_E_ARQUITETURA.md`

## Regras de Desenvolvimento

Ver `.cursorrules` para regras detalhadas de desenvolvimento.

## Licença

MIT
