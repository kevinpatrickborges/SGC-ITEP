# DataTable Component

## Instalação do React-Table v8

Para usar o componente DataTable, você precisa instalar o React-Table v8:

```bash
npm install @tanstack/react-table
```

## Uso Básico

```tsx
import { DataTable, StatusBadge } from './components/DataTable';
import { ColumnDef } from '@tanstack/react-table';

// Definir tipo de dados
interface MyData {
  id: string;
  name: string;
  status: string;
  date: string;
}

// Definir colunas
const columns: ColumnDef<MyData>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'name',
    header: 'Nome',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
  },
  {
    accessorKey: 'date',
    header: 'Data',
    cell: ({ row }) => {
      const date = new Date(row.getValue('date'));
      return date.toLocaleDateString('pt-BR');
    },
  },
];

// Usar o componente
<DataTable data={myData} columns={columns} />
```

## Props

| Prop | Tipo | Descrição |
|------|------|-----------|
| `data` | `T[]` | Array de dados para exibir |
| `columns` | `ColumnDef<T>[]` | Definição das colunas |
| `className` | `string` | Classes CSS adicionais |

## Funcionalidades

### ✅ **Busca Global**
- Campo de busca que filtra em todos os campos
- Botão de limpeza rápida
- Busca em tempo real

### ✅ **Filtros por Coluna**
- Filtros individuais para cada coluna
- Filtros de texto para strings
- Filtros numéricos com min/max
- Toggle para mostrar/ocultar filtros

### ✅ **Ordenação**
- Clique no header para ordenar
- Indicadores visuais (setas)
- Ordenação ascendente/descendente
- Suporte a múltiplas colunas

### ✅ **Paginação**
- Opções: 10, 25, 50 itens por página
- Navegação entre páginas
- Contador de registros
- Botões anterior/próximo

### ✅ **Interface**
- Highlight em hover nas linhas
- Design responsivo
- Paleta de cores institucional
- Estados de loading e vazio

## StatusBadge Component

O componente `StatusBadge` aplica cores automáticas baseadas no texto:

```tsx
<StatusBadge status="Finalizado" />     // Verde
<StatusBadge status="Não localizado" /> // Laranja  
<StatusBadge status="Em andamento" />   // Cinza (padrão)
```

### Mapeamento de Cores

| Status | Cor | Classe CSS |
|--------|-----|------------|
| "Finalizado", "Concluído" | Verde | `success-*` |
| "Não localizado", "Pendente" | Laranja | `warning-*` |
| Outros | Cinza | `gray-*` |

## Exemplos de Colunas

### Coluna com Ícone
```tsx
{
  accessorKey: 'protocolo',
  header: 'Protocolo',
  cell: ({ row }) => (
    <div className="flex items-center gap-2">
      <FileText className="w-4 h-4 text-primary-600" />
      <span className="font-medium">{row.getValue('protocolo')}</span>
    </div>
  ),
}
```

### Coluna de Data
```tsx
{
  accessorKey: 'dataRequisicao',
  header: 'Data',
  cell: ({ row }) => (
    <div className="flex items-center gap-2">
      <Calendar className="w-4 h-4 text-gray-400" />
      <span>{new Date(row.getValue('dataRequisicao')).toLocaleDateString('pt-BR')}</span>
    </div>
  ),
}
```

### Coluna de Valor Monetário
```tsx
{
  accessorKey: 'valor',
  header: 'Valor (R$)',
  cell: ({ row }) => {
    const valor = row.getValue('valor') as number;
    return valor > 0 ? (
      <span className="font-medium">
        {valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </span>
    ) : (
      <span className="text-gray-400">-</span>
    );
  },
}
```

## Personalização

### Classes CSS Customizadas
```tsx
<DataTable 
  data={data} 
  columns={columns}
  className="my-custom-table shadow-lg"
/>
```

### Filtros Customizados
O componente suporta filtros automáticos baseados no tipo de dados:
- **String**: Campo de texto
- **Number**: Campos min/max
- **Date**: Pode ser customizado na definição da coluna

## Integração com SGC-ITEP

O componente foi projetado especificamente para o SGC-ITEP com:
- Paleta de cores institucional
- Badges de status contextuais
- Ícones do Lucide React
- Formatação pt-BR para datas e valores
- Design responsivo para diferentes telas

## Dependências

- `@tanstack/react-table` v8+
- `lucide-react` (ícones)
- `tailwindcss` (estilos)
- `react` v18+
- `typescript` (opcional, mas recomendado)