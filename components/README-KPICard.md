# KPI Card Component

## Visão Geral

O componente `KPICard` é um cartão interativo para exibição de indicadores-chave de performance (KPIs) em dashboards. Inclui animações, tooltips, modais com gráficos e total acessibilidade.

## Características

### 📐 **Layout**
- **Dimensões:** 320×160px fixas
- **Sombra:** Suave com elevação no hover
- **Borda:** 1px #E5E7EB
- **Border radius:** lg (8px)

### 🎨 **Design**
- **Ícone circular:** À esquerda, usando Lucide React
- **Contador animado:** Count-up em text-5xl semibold
- **Label:** Uppercase 12px com tracking
- **Tooltip:** Descrição longa no hover

### 🎯 **Interações**
- **Hover:** Eleva sombra e translada -1px
- **Click:** Abre modal com série temporal
- **Teclado:** Suporte completo (Enter/Space)

### 🎨 **Variantes**
| Variante | Cor | Uso |
|----------|-----|-----|
| `primary` | Azul-600 | KPIs principais |
| `success` | Verde-600 | Métricas positivas |
| `warning` | Laranja-500 | Alertas moderados |
| `danger` | Vermelho-600 | Alertas críticos |

## Props

```typescript
interface KPICardProps {
  title: string;           // Título do KPI
  value: number;           // Valor numérico
  icon: LucideIcon;        // Ícone do Lucide React
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  data?: Array<{          // Dados para série temporal
    date: string;         // Data no formato YYYY-MM-DD
    value: number;        // Valor numérico
  }>;
  description?: string;    // Descrição para tooltip
  className?: string;      // Classes CSS adicionais
}
```

## Uso Básico

```jsx
import KPICard from './components/KPICard';
import { FileText } from 'lucide-react';

// Dados de série temporal
const timeSeriesData = [
  { date: '2024-01-01', value: 45 },
  { date: '2024-01-02', value: 52 },
  { date: '2024-01-03', value: 48 },
  { date: '2024-01-04', value: 61 },
  { date: '2024-01-05', value: 55 },
];

// Componente básico
<KPICard
  title="Desarquivamentos"
  value={1234}
  icon={FileText}
  variant="primary"
  description="Total de prontuários desarquivados no período atual"
  data={timeSeriesData}
/>
```

## Exemplos de Uso

### KPI Simples (sem gráfico)
```jsx
<KPICard
  title="Usuários Online"
  value={42}
  icon={Users}
  variant="success"
  description="Usuários ativos nas últimas 24 horas"
/>
```

### KPI com Série Temporal
```jsx
<KPICard
  title="Vestígios"
  value={856}
  icon={Archive}
  variant="primary"
  description="Itens em custódia ativa"
  data={[
    { date: '2024-01-01', value: 820 },
    { date: '2024-01-02', value: 835 },
    { date: '2024-01-03', value: 856 },
  ]}
/>
```

### Grid de KPIs
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
  <KPICard title="Processos" value={1234} icon={FileText} variant="primary" />
  <KPICard title="Concluídos" value={987} icon={CheckCircle} variant="success" />
  <KPICard title="Pendentes" value={23} icon={AlertTriangle} variant="warning" />
  <KPICard title="Críticos" value={5} icon={AlertTriangle} variant="danger" />
</div>
```

## Funcionalidades

### ✅ **Contador Animado**
- Animação count-up de 2 segundos
- Formatação pt-BR com separadores de milhares
- Inicia do zero até o valor final

### ✅ **Modal Interativo**
- Gráfico de linha com Recharts
- Tooltip customizado com formatação pt-BR
- Estatísticas resumidas (máx, mín, média)
- Responsivo e acessível

### ✅ **Tooltip Informativo**
- Aparece no hover
- Posicionamento inteligente
- Descrição detalhada do KPI

### ✅ **Acessibilidade**
- `aria-label` descritivo
- Navegação por teclado (Tab, Enter, Space)
- Contraste AA em todas as variantes
- Focus ring visível
- Role e aria-modal corretos

## Customização

### Cores Personalizadas
```jsx
// Usando className para override
<KPICard
  title="Custom KPI"
  value={500}
  icon={TrendingUp}
  variant="primary"
  className="border-purple-200 hover:border-purple-300"
/>
```

### Formatação de Valores
```jsx
// Para percentuais
<KPICard
  title="Taxa de Sucesso"
  value={94}
  icon={CheckCircle}
  variant="success"
  // O valor será exibido como "94" (sem %)
/>

// Para valores monetários, formate antes de passar
const valorFormatado = Math.round(1234.56); // 1235
<KPICard value={valorFormatado} ... />
```

## Dependências

```json
{
  "recharts": "^2.8.0",
  "lucide-react": "^0.400.0",
  "tailwindcss": "^3.3.0"
}
```

## Instalação

```bash
npm install recharts lucide-react
```

## Estrutura do Modal

O modal inclui:
- **Header:** Título com botão de fechar
- **Gráfico:** LineChart responsivo com Recharts
- **Estatísticas:** Cards com máximo, mínimo e média
- **Interações:** Tooltip no gráfico, zoom, etc.

## Responsividade

- **Mobile:** Cards empilhados verticalmente
- **Tablet:** Grid 2 colunas
- **Desktop:** Grid 3-4 colunas
- **Modal:** Adaptável a diferentes tamanhos de tela

## Boas Práticas

### ✅ **Recomendado**
```jsx
// Dados consistentes
const data = generateConsistentData();

// Descrições informativas
description="Métrica importante que indica..."

// Ícones contextuais
icon={FileText} // Para documentos
icon={Users}    // Para usuários
icon={Archive}  // Para itens arquivados
```

### ❌ **Evitar**
```jsx
// Valores muito grandes sem formatação
value={1234567890}

// Descrições muito longas
description="Uma descrição extremamente longa que..."

// Dados inconsistentes
data={[{ date: '2024-01-01' }]} // Faltando 'value'
```

## Integração com SGC-ITEP

O componente foi projetado especificamente para o SGC-ITEP:
- Paleta de cores institucional
- Formatação pt-BR
- Ícones contextuais do sistema
- Acessibilidade governamental