# Guia de Início Rápido

## Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn

## Instalação

1. Instale as dependências:
```bash
npm install
```

## Executar em Desenvolvimento

```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:5173`

## Estrutura do Projeto

### Arquitetura Feature-Based

O projeto está organizado em features independentes:

- **`features/atas/`**: Gerenciamento de atas de reunião
- **`features/participantes/`**: Gerenciamento de participantes
- **`features/itens/`**: Gerenciamento de itens hierárquicos

### Componentes Reutilizáveis

- **`components/ui/`**: Componentes básicos (Button, Input, etc)
- **`components/layout/`**: Componentes de layout

### Serviços Compartilhados

- **`services/storage/`**: Gerenciamento de localStorage
- **`services/export/`**: Exportação de HTML
- **`services/index/`**: Geração de índices

## Próximos Passos de Desenvolvimento

### 1. Implementar Serviço de Storage
- Criar `services/storage/storageService.ts`
- Implementar CRUD para localStorage
- Tratamento de erros (quota excedida, etc)

### 2. Implementar Feature de Atas
- Criar componentes de lista e formulário
- Implementar hooks para gerenciamento de estado
- Integrar com serviço de storage

### 3. Implementar Feature de Participantes
- Criar componentes de lista e formulário
- Implementar validações
- Integrar com feature de atas

### 4. Implementar Feature de Itens
- Criar componentes hierárquicos
- Implementar numeração automática
- Implementar histórico e rastreabilidade

### 5. Implementar Exportação HTML
- Criar template HTML
- Implementar paginação automática
- Adicionar filtros interativos

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Linting
npm run lint

# Formatação
npm run format
```

## Path Aliases

O projeto usa path aliases para facilitar imports:

```typescript
import { Button } from '@components/ui'
import { useMeetingMinutes } from '@features/atas/hooks'
import { storageService } from '@services/storage'
import type { MeetingMinutes } from '@types'
```

## Regras de Desenvolvimento

Consulte `.cursorrules` para regras detalhadas de desenvolvimento.

## Documentação Adicional

- **`STACK_E_ARQUITETURA.md`**: Detalhes da stack e arquitetura
- **`ESTRUTURA_PASTAS.md`**: Estrutura detalhada de pastas
- **`README.md`**: Visão geral do projeto
