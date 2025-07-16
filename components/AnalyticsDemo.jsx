import React from 'react';
import AnalyticsCard from './AnalyticsCard';
import AnalyticsGrid from './AnalyticsGrid';
import { 
  FileText, 
  Users, 
  Archive, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Database,
  Shield,
  Activity,
  Zap
} from 'lucide-react';

const AnalyticsDemo = () => {
  // Exemplo de cards individuais
  const individualCards = [
    {
      id: 'performance',
      title: 'Performance',
      value: '99.8%',
      icon: Zap,
      variant: 'success',
      subtitle: 'Uptime do sistema',
      trend: 'up',
      trendValue: '+0.2%'
    },
    {
      id: 'security',
      title: 'Segurança',
      value: '100%',
      icon: Shield,
      variant: 'primary',
      subtitle: 'Conformidade LGPD',
      trend: 'neutral',
      trendValue: '0 incidentes'
    },
    {
      id: 'storage',
      title: 'Armazenamento',
      value: '2.4TB',
      icon: Database,
      variant: 'warning',
      subtitle: 'Capacidade utilizada',
      trend: 'up',
      trendValue: '+15GB'
    }
  ];

  // Exemplo de grid completo
  const dashboardMetrics = [
    {
      id: 'total-docs',
      title: 'Total Documentos',
      value: '15,847',
      icon: FileText,
      variant: 'primary',
      subtitle: 'Documentos no sistema',
      trend: 'up',
      trendValue: '+234'
    },
    {
      id: 'active-cases',
      title: 'Casos Ativos',
      value: '1,203',
      icon: Activity,
      variant: 'success',
      subtitle: 'Em andamento',
      trend: 'up',
      trendValue: '+45'
    },
    {
      id: 'alerts',
      title: 'Alertas',
      value: '7',
      icon: AlertTriangle,
      variant: 'warning',
      subtitle: 'Requerem atenção',
      trend: 'down',
      trendValue: '-3'
    },
    {
      id: 'efficiency',
      title: 'Eficiência',
      value: '94.2%',
      icon: TrendingUp,
      variant: 'success',
      subtitle: 'Taxa de resolução',
      trend: 'up',
      trendValue: '+2.1%'
    }
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Título */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Analytics Cards Demo
        </h1>
        <p className="text-gray-600">
          Demonstração dos componentes AnalyticsCard com diferentes variantes e configurações
        </p>
      </div>

      {/* Cards individuais */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Cards Individuais
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {individualCards.map((card) => (
            <AnalyticsCard
              key={card.id}
              title={card.title}
              value={card.value}
              icon={card.icon}
              variant={card.variant}
              subtitle={card.subtitle}
              trend={card.trend}
              trendValue={card.trendValue}
            />
          ))}
        </div>
      </section>

      {/* Grid responsivo */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Grid Responsivo (4 colunas → auto-fit)
        </h2>
        <AnalyticsGrid cards={dashboardMetrics} />
      </section>

      {/* Exemplos de variantes */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Variantes de Cores
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AnalyticsCard
            title="Variante Primary"
            value="1,234"
            icon={FileText}
            variant="primary"
            subtitle="Cor primária do sistema"
            trend="up"
            trendValue="+12%"
          />
          <AnalyticsCard
            title="Variante Success"
            value="98.5%"
            icon={CheckCircle}
            variant="success"
            subtitle="Indicadores positivos"
            trend="up"
            trendValue="+2.3%"
          />
          <AnalyticsCard
            title="Variante Warning"
            value="23"
            icon={AlertTriangle}
            variant="warning"
            subtitle="Itens que precisam atenção"
            trend="down"
            trendValue="-5"
          />
        </div>
      </section>

      {/* Cards sem trend */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Cards Simples (sem indicador de tendência)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <AnalyticsCard
            title="Usuários"
            value="42"
            icon={Users}
            variant="primary"
            subtitle="Conectados agora"
          />
          <AnalyticsCard
            title="Locais"
            value="18"
            icon={MapPin}
            variant="success"
            subtitle="Pontos de coleta"
          />
          <AnalyticsCard
            title="Tempo Médio"
            value="4.2h"
            icon={Clock}
            variant="primary"
            subtitle="Processamento"
          />
          <AnalyticsCard
            title="Vestígios"
            value="856"
            icon={Archive}
            variant="success"
            subtitle="Em custódia"
          />
        </div>
      </section>

      {/* Código de exemplo */}
      <section className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Exemplo de Uso
        </h2>
        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
{`// Uso individual
<AnalyticsCard
  title="Desarquivamentos"
  value="1,234"
  icon={FileText}
  variant="primary"
  subtitle="Prontuários processados"
  trend="up"
  trendValue="+12%"
/>

// Uso em grid
const cards = [
  {
    id: 'example',
    title: 'Exemplo',
    value: '100',
    icon: TrendingUp,
    variant: 'success',
    subtitle: 'Descrição do card',
    trend: 'up',
    trendValue: '+10%'
  }
];

<AnalyticsGrid cards={cards} />`}
        </pre>
      </section>
    </div>
  );
};

export default AnalyticsDemo;