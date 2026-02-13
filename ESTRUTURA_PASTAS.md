# Estrutura de Pastas Detalhada

## Visão Geral

O projeto segue uma arquitetura **Feature-Based + Component-Based**, organizando código por funcionalidade e mantendo componentes reutilizáveis separados.

## Estrutura Completa

```
src/
├── components/              # Componentes reutilizáveis
│   ├── ui/                 # Componentes básicos de UI
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Modal.tsx
│   │   └── index.ts
│   └── layout/             # Componentes de layout
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── index.ts
│
├── features/               # Features organizadas por domínio
│   ├── atas/               # Feature de Atas
│   │   ├── components/     # Componentes específicos de atas
│   │   │   ├── MeetingMinutesList.tsx
│   │   │   ├── MeetingMinutesForm.tsx
│   │   │   ├── MeetingMinutesCard.tsx
│   │   │   └── index.ts
│   │   ├── hooks/          # Hooks específicos
│   │   │   ├── useMeetingMinutes.ts
│   │   │   ├── useMeetingMinutesList.ts
│   │   │   └── index.ts
│   │   ├── services/       # Serviços específicos
│   │   │   ├── meetingMinutesService.ts
│   │   │   └── index.ts
│   │   └── types.ts        # Types específicos (se necessário)
│   │
│   ├── participantes/      # Feature de Participantes
│   │   ├── components/
│   │   │   ├── ParticipantList.tsx
│   │   │   ├── ParticipantForm.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useParticipants.ts
│   │   │   └── index.ts
│   │   └── services/
│   │       └── participantService.ts
│   │
│   └── itens/              # Feature de Itens
│       ├── components/
│       │   ├── ItemList.tsx
│       │   ├── ItemForm.tsx
│       │   ├── ItemHierarchy.tsx
│       │   └── index.ts
│       ├── hooks/
│       │   ├── useItems.ts
│       │   ├── useItemHierarchy.ts
│       │   └── index.ts
│       └── services/
│           ├── itemService.ts
│           └── itemNumberingService.ts
│
├── services/               # Serviços compartilhados
│   ├── storage/            # Gerenciamento de localStorage
│   │   ├── storageService.ts
│   │   ├── meetingMinutesStorage.ts
│   │   └── index.ts
│   ├── export/             # Exportação de HTML
│   │   ├── htmlExportService.ts
│   │   ├── htmlTemplate.ts
│   │   └── index.ts
│   └── index/              # Geração de índices
│       ├── indexGenerator.ts
│       └── index.ts
│
├── hooks/                  # Custom hooks compartilhados
│   ├── useLocalStorage.ts
│   ├── useDebounce.ts
│   └── index.ts
│
├── utils/                  # Funções utilitárias
│   ├── dateUtils.ts
│   ├── validationUtils.ts
│   ├── formatUtils.ts
│   └── index.ts
│
├── types/                  # Types globais
│   ├── index.ts
│   └── storage.ts
│
├── styles/                 # Estilos globais
│   ├── globals.css
│   ├── variables.css
│   └── reset.css
│
├── App.tsx                 # Componente raiz
└── main.tsx                # Entry point
```

## Descrição das Pastas

### `/components`
Componentes reutilizáveis que podem ser usados em qualquer parte da aplicação.

- **`ui/`**: Componentes básicos de interface (botões, inputs, modais, etc.)
- **`layout/`**: Componentes de layout (header, sidebar, containers)

### `/features`
Features organizadas por domínio de negócio. Cada feature contém tudo relacionado a ela.

- **`atas/`**: Tudo relacionado ao gerenciamento de atas
- **`participantes/`**: Tudo relacionado ao gerenciamento de participantes
- **`itens/`**: Tudo relacionado ao gerenciamento de itens

Cada feature pode conter:
- **`components/`**: Componentes específicos da feature
- **`hooks/`**: Hooks específicos da feature
- **`services/`**: Serviços específicos da feature
- **`types.ts`**: Types específicos (se necessário)

### `/services`
Serviços compartilhados que podem ser usados por múltiplas features.

- **`storage/`**: Gerenciamento de localStorage
- **`export/`**: Lógica de exportação de HTML
- **`index/`**: Geração de índices

### `/hooks`
Custom hooks compartilhados que podem ser usados em qualquer lugar.

### `/utils`
Funções utilitárias puras (sem dependências de React ou outras bibliotecas).

### `/types`
Definições de tipos TypeScript globais.

### `/styles`
Estilos globais, variáveis CSS e reset.

## Convenções de Nomenclatura

### Arquivos
- **Componentes**: PascalCase (`MeetingMinutesList.tsx`)
- **Hooks**: camelCase com prefixo `use` (`useMeetingMinutes.ts`)
- **Services**: camelCase (`storageService.ts`)
- **Utils**: camelCase (`dateUtils.ts`)
- **Types**: PascalCase (`MeetingMinutes.ts`)

### Pastas
- **Features**: plural, lowercase (`atas/`, `participantes/`)
- **Componentes**: plural, lowercase (`components/`, `hooks/`)
- **Services**: singular ou plural conforme contexto (`storage/`, `export/`)

## Exemplo de Uso

```typescript
// Importando de uma feature
import { MeetingMinutesList } from '@features/atas/components'
import { useMeetingMinutes } from '@features/atas/hooks'

// Importando componente reutilizável
import { Button } from '@components/ui'

// Importando serviço compartilhado
import { storageService } from '@services/storage'

// Importando hook compartilhado
import { useLocalStorage } from '@hooks'

// Importando utilidade
import { formatDate } from '@utils'

// Importando type
import type { MeetingMinutes } from '@types'
```

## Benefícios desta Estrutura

1. **Modularidade**: Cada feature é independente e autocontida
2. **Reutilização**: Componentes e serviços compartilhados são facilmente acessíveis
3. **Manutenibilidade**: Fácil encontrar e modificar código relacionado
4. **Escalabilidade**: Fácil adicionar novas features sem afetar existentes
5. **Testabilidade**: Código organizado facilita testes isolados
