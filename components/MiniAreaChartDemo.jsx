import React from 'react';
import MiniAreaChart from './MiniAreaChart';
import AnalyticsCard from './AnalyticsCard';
import { FileText, Users, Archive, TrendingUp } from 'lucide-react';

const MiniAreaChartDemo = () => {
  // Dados de exemplo para os gráficos
  const generateSampleData = (days = 30, baseValue = 100, variance = 50) => {
    const data = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const randomVariation = (Math.random() - 0.5) * variance;
      const trendFactor = (days - i) / days; // Tendência crescente
      const count = Math.max(0, Math.round(baseValue + randomVariation + (trendFactor * 30)));
      
      data.push({
        date: date.toISOString().split('T')[0],
        count: count
      });
    }
    
    return data;
  };

  // Dados para diferentes métricas
  const desarquivamentosData = generateSampleData(30, 45, 20);
  const vestigiosData = generateSampleData(30, 28, 15);
  const usuariosData = generateSampleData(30, 15, 8);
  const relatoriosData = generateSampleData(30, 8, 5);

  // Dados para cards com gráficos
  const cardsWithCharts = [
    {
      id: 'desarquivamentos-chart',
      title: 'Desarquivamentos',
      value: '1,234',
      icon: FileText,
      variant: 'primary',
      subtitle: 'Últimos 30 dias',
      trend: 'up',
      trendValue: '+12%',
      chartData: desarquivamentosData
    },
    {
      id: 'vestigios-chart',
      title: 'Vestígios',
      value: '856',
      icon: Archive,
      variant: 'success',
      subtitle: 'Novos registros',
      trend: 'up',
      trendValue: '+8%',
      chartData: vestigiosData
    },
    {
      id: 'usuarios-chart',
      title: 'Usuários Ativos',
      value: '42',
      icon: Users,
      variant: 'primary',
      subtitle: 'Acessos diários',
      trend: 'up',
      trendValue: '+3%',
      chartData: usuariosData
    },
    {
      id: 'relatorios-chart',
      title: 'Relatórios',
      value: '127',
      icon: TrendingUp,
      variant: 'success',
      subtitle: 'Gerados mensalmente',
      trend: 'up',
      trendValue: '+15%',
      chartData: relatoriosData
    }
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Título */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          MiniAreaChart Demo
        </h1>
        <p className="text-gray-600">
          Demonstração do componente MiniAreaChart com Recharts integrado aos AnalyticsCards
        </p>
      </div>

      {/* Gráficos individuais */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Gráficos Individuais
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Desarquivamentos (30 dias)</h3>
            <div className="text-primary-600">
              <MiniAreaChart data={desarquivamentosData} />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Vestígios (30 dias)</h3>
            <div className="text-success-600">
              <MiniAreaChart data={vestigiosData} />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Usuários Ativos (30 dias)</h3>
            <div className="text-primary-600">
              <MiniAreaChart data={usuariosData} />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Relatórios (30 dias)</h3>
            <div className="text-success-600">
              <MiniAreaChart data={relatoriosData} />
            </div>
          </div>
        </div>
      </section>

      {/* Cards com gráficos integrados */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          AnalyticsCards com MiniAreaChart
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cardsWithCharts.map((card) => (
            <AnalyticsCard
              key={card.id}
              title={card.title}
              value={card.value}
              icon={card.icon}
              variant={card.variant}
              subtitle={card.subtitle}
              trend={card.trend}
              trendValue={card.trendValue}
              chartData={card.chartData}
            />
          ))}
        </div>
      </section>

      {/* Diferentes tamanhos */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Diferentes Tamanhos
        </h2>
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Pequeno (240×60)</h3>
            <div className="text-primary-600">
              <MiniAreaChart data={desarquivamentosData} width={240} height={60} />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Padrão (240×80)</h3>
            <div className="text-success-600">
              <MiniAreaChart data={vestigiosData} width={240} height={80} />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Grande (320×100)</h3>
            <div className="text-warning-600">
              <MiniAreaChart data={usuariosData} width={320} height={100} />
            </div>
          </div>
        </div>
      </section>

      {/* Estado vazio */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Estado Vazio
        </h2>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Sem dados</h3>
          <MiniAreaChart data={[]} />
        </div>
      </section>

      {/* Código de exemplo */}
      <section className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Exemplo de Uso
        </h2>
        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
{`// Dados de exemplo
const chartData = [
  { date: '2024-01-01', count: 45 },
  { date: '2024-01-02', count: 52 },
  { date: '2024-01-03', count: 48 },
  // ... mais dados
];

// Uso individual
<MiniAreaChart 
  data={chartData} 
  width={240} 
  height={80}
/>

// Integrado com AnalyticsCard
<AnalyticsCard
  title="Desarquivamentos"
  value="1,234"
  icon={FileText}
  variant="primary"
  subtitle="Últimos 30 dias"
  trend="up"
  trendValue="+12%"
  chartData={chartData}
/>`}
        </pre>
      </section>
    </div>
  );
};

export default MiniAreaChartDemo;