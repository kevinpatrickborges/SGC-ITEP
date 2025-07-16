# MiniAreaChart Component

## Instalação do Recharts

Para usar o componente MiniAreaChart, você precisa instalar o Recharts:

```bash
npm install recharts
```

## Uso Básico

```jsx
import MiniAreaChart from './components/MiniAreaChart';

const data = [
  { date: '2024-01-01', count: 45 },
  { date: '2024-01-02', count: 52 },
  { date: '2024-01-03', count: 48 },
  { date: '2024-01-04', count: 61 },
  { date: '2024-01-05', count: 55 },
];

<MiniAreaChart data={data} />
```

## Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `data` | `Array<{date: string, count: number}>` | `[]` | Array de dados com date e count |
| `width` | `number` | `240` | Largura do gráfico em pixels |
| `height` | `number` | `80` | Altura do gráfico em pixels |
| `className` | `string` | `''` | Classes CSS adicionais |
| `strokeWidth` | `number` | `2` | Espessura da linha |
| `fillOpacity` | `number` | `0.1` | Opacidade do preenchimento |

## Integração com AnalyticsCard

```jsx
<AnalyticsCard
  title="Desarquivamentos"
  value="1,234"
  icon={FileText}
  variant="primary"
  subtitle="Últimos 30 dias"
  trend="up"
  trendValue="+12%"
  chartData={data}
/>
```

## Características

- ✅ **Área suavizada** com curva monotone
- ✅ **Tooltip personalizado** com data formatada em pt-BR
- ✅ **Usa tema atual** via `currentColor`
- ✅ **Responsivo** com ResponsiveContainer
- ✅ **Estado vazio** quando não há dados
- ✅ **Hover effects** com cursor customizado
- ✅ **Gradiente suave** no preenchimento

## Formato dos Dados

O componente espera um array de objetos com a seguinte estrutura:

```javascript
[
  {
    date: '2024-01-01',  // String no formato YYYY-MM-DD
    count: 45            // Número inteiro
  },
  // ... mais objetos
]
```

## Personalização de Cores

O componente usa `currentColor`, então você pode definir a cor através da classe CSS do elemento pai:

```jsx
<div className="text-blue-600">
  <MiniAreaChart data={data} />
</div>

<div className="text-green-500">
  <MiniAreaChart data={data} />
</div>
```