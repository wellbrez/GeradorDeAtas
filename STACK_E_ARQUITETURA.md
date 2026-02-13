# Stack Tecnológica e Arquitetura

## Stack Escolhida

### Frontend
- **React 18+** - Biblioteca UI moderna e performática
- **TypeScript** - Type safety e melhor DX
- **Vite** - Build tool rápida e moderna
- **React Router** - Navegação (se necessário)

### Armazenamento
- **localStorage** - Persistência local no navegador
- **IndexedDB** (opcional futuro) - Para grandes volumes de dados

### Estilização
- **CSS Modules** - Estilos scoped e modular
- **CSS Variables** - Para temas e cores consistentes

### Ferramentas de Desenvolvimento
- **ESLint** - Linting
- **Prettier** - Formatação de código
- **Vitest** - Testes unitários (opcional)

## Arquitetura

### Padrão: Feature-Based + Component-Based

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes básicos (Button, Input, etc)
│   └── layout/          # Componentes de layout
├── features/           # Features organizadas por domínio
│   ├── atas/           # Feature de Atas
│   │   ├── components/ # Componentes específicos de atas
│   │   ├── hooks/      # Hooks específicos
│   │   ├── services/   # Serviços específicos
│   │   └── types.ts    # Types específicos
│   ├── participantes/ # Feature de Participantes
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

### Princípios de Design

1. **Separação de Responsabilidades**
   - Componentes: apenas apresentação
   - Hooks: lógica de estado e efeitos
   - Services: lógica de negócio e persistência

2. **Composição sobre Herança**
   - Componentes pequenos e focados
   - Composição para criar componentes complexos

3. **Type Safety**
   - Types explícitos para todas as entidades
   - Interfaces bem definidas

4. **Modularidade**
   - Features independentes
   - Fácil adicionar/remover funcionalidades

## Estrutura de Dados

### Ata (MeetingMinutes)
```typescript
interface MeetingMinutes {
  id: string;
  cabecalho: Cabecalho;
  attendance: Participant[];
  itens: Item[];
  createdAt: string;
  updatedAt: string;
}

interface Cabecalho {
  numero: string;
  data: string; // ISO date string
  tipo: string;
  titulo: string;
  responsavel: string;
  projeto: string;
}

interface Participant {
  nome: string;
  email: string;
  empresa: string;
  telefone: string;
  presenca: 'P' | 'A'; // Presente | Ausente
}

interface Item {
  id: string;
  item: string; // "1", "1.1", "1.1.1"
  nivel: number;
  pai: string | null;
  filhos: string[]; // IDs dos filhos
  criadoEm: string;
  historico: HistoricoItem[];
  UltimoHistorico: HistoricoItem;
}

interface HistoricoItem {
  id: string;
  criadoEm: string;
  descricao: string;
  responsavel: {
    email: string;
    nome: string;
  };
  data: string | null;
  status: 'Pendente' | 'Em Andamento' | 'Concluído' | 'Cancelado' | 'Info';
}
```

## Funcionalidades Principais

1. **CRUD de Atas**
   - Criar, editar, excluir, copiar atas
   - Listagem com filtros

2. **Gerenciamento de Participantes**
   - Adicionar/remover participantes
   - Marcar presença

3. **Gerenciamento de Itens Hierárquicos**
   - Criar itens e sub-itens
   - Numeração automática (1, 1.1, 1.1.1)
   - Reorganização hierárquica

4. **Rastreabilidade**
   - Histórico completo de cada item
   - Timestamp de todas as ações
   - Responsável por cada alteração

5. **Geração de Índices**
   - Índice automático baseado na hierarquia
   - Numeração sequencial

6. **Exportação HTML**
   - Geração de HTML formatado
   - Paginação automática
   - Estilos profissionais
   - Filtros interativos no HTML gerado

## Fluxo de Dados

```
User Action
    ↓
Component (UI)
    ↓
Hook (State Management)
    ↓
Service (Business Logic)
    ↓
Storage Service (Persistence)
    ↓
localStorage
```

## Naming Conventions

- **Components**: PascalCase (`MeetingMinutesList.tsx`)
- **Hooks**: camelCase com prefixo `use` (`useMeetingMinutes.ts`)
- **Services**: camelCase (`storageService.ts`)
- **Types**: PascalCase (`MeetingMinutes.ts`)
- **Utils**: camelCase (`formatDate.ts`)
- **Files**: kebab-case para não-components (`storage-service.ts`)
