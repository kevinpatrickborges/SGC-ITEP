import React from 'react';
import KPICard from './KPICard';
import { 
  FileText, 
  Users, 
  Archive, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react';

const KPIDemo = () => {
  // Função para gerar dados de série temporal
  const generateTimeSeriesData = (days = 30, baseValue = 100, variance = 50) => {
    const data = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const randomVariation = (Math.random() - 0.5) * variance;
      const trendFactor = (days - i) / days; // Tendência crescente
      const value = Math.max(0, Math.round(baseValue + randomVariation + (trendFactor * 30)));
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: value
      });
    }
    
    return data;
  };

  // Dados dos KPIs
  const kpiData = [
    {
      title: 'Desarquivamentos',
      value: 1234,
      icon: FileText,
      variant: 'primary',
      description: 'Total de prontuários desarquivados no período atual. Inclui solicitações processadas e finalizadas.',
      data: generateTimeSeriesData(30, 40, 15)
    },
    {
      title: 'Vestígios Ativos',
      value: 856,
      icon: Archive,
      variant: 'success',
      description: 'Número de vestígios atualmente em custódia no sistema. Monitora itens sob responsabilidade do ITEP.',
      data: generateTimeSeriesData(30, 28, 12)
    },
    {
      title: 'Usuários Online',
      value: 42,
      icon: Users,
      variant: 'primary',
      description: 'Usuários ativos no sistema nas últimas 24 horas. Inclui técnicos, peritos e administradores.',
      data: generateTimeSeriesData(30, 15, 8)
    },
    {
      title: 'Pendências',
      value: 23,
      icon: AlertTriangle,
      variant: 'warning',
      description: 'Solicitações que requerem atenção imediata. Inclui documentos não localizados e processos em atraso.',
      data: generateTimeSeriesData(30, 25, 10)
    },
    {
      title: 'Taxa de Sucesso',
      value: 94,
      icon: CheckCircle,
      variant: 'success',
      description: 'Percentual de solicitações processadas com sucesso. Meta institucional: acima de 90%.',
      data: generateTimeSeriesData(30, 90, 5)
    },
    {
      title: 'Tempo Médio',
      value: 4,
      icon: Clock,
      variant: 'primary',
      description: 'Tempo médio de processamento em horas. Medido desde a solicitação até a finalização.',
      data: generateTimeSeriesData(30, 4, 2)
    },
    {
      title: 'Alertas Críticos',
      value: 7,
      icon: AlertTriangle,
      variant: 'danger',
      description: 'Alertas de segurança e conformidade que requerem ação imediata da equipe técnica.',
      data: generateTimeSeriesData(30, 8, 4)
    },
    {
      title: 'Eficiência',
      value: 87,
      icon: TrendingUp,
      variant: 'success',
      description: 'Índice de eficiência operacional baseado em tempo de resposta e qualidade do atendimento.',
      data: generateTimeSeriesData(30, 85, 8)
    }
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Título */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          KPI Cards Demo
        </h1>
        <p className="text-gray-600">
          Demonstração dos componentes KPI Card com animações, tooltips e modais interativos
        </p>
      </div>

      {/* Grid de KPI Cards */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          Indicadores Principais de Performance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {kpiData.map((kpi, index) => (
            <KPICard
              key={index}
              title={kpi.title}
              value={kpi.value}
              icon={kpi.icon}
              variant={kpi.variant}
              description={kpi.description}
              data={kpi.data}
            />
          ))}
        </div>
      </section>

      {/* Seção de variantes */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          Variantes de Cores
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <KPICard
            title="Primary"
            value={1500}
            icon={FileText}
            variant="primary"
            description="Variante primária com cor azul institucional"
            data={generateTimeSeriesData(15, 50, 20)}
          />
          <KPICard
            title="Success"
            value={98}
            icon={CheckCircle}
            variant="success"
            description="Variante de sucesso com cor verde"
            data={generateTimeSeriesData(15, 95, 5)}
          />
          <KPICard
            title="Warning"
            value={15}
            icon={AlertTriangle}
            variant="warning"
            description="Variante de aviso com cor laranja"
            data={generateTimeSeriesData(15, 18, 8)}
          />
          <KPICard
            title="Danger"
            value={3}
            icon={AlertTriangle}
            variant="danger"
            description="Variante de perigo com cor vermelha"
            data={generateTimeSeriesData(15, 5, 3)}
          />
        </div>
      </section>

      {/* Seção de funcionalidades */}
      <section className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Funcionalidades Implementadas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700">✅ Layout e Design</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Dimensões: 320×160px</li>
              <li>• Sombra suave com hover</li>
              <li>• Borda 1px #E5E7EB</li>
              <li>• Border radius lg</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700">✅ Interações</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Contador animado (count-up)</li>
              <li>• Hover eleva sombra</li>
              <li>• Click abre modal</li>
              <li>• Tooltip com descrição</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700">✅ Acessibilidade</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• aria-label descritivo</li>
              <li>• Navegação por teclado</li>
              <li>• Contraste AA</li>
              <li>• Focus ring visível</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700">✅ Modal com Gráfico</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Recharts LineChart</li>
              <li>• Série temporal interativa</li>
              <li>• Estatísticas resumidas</li>
              <li>• Tooltip customizado</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700">✅ Variantes</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Primary (azul-600)</li>
              <li>• Success (verde-600)</li>
              <li>• Warning (laranja-500)</li>
              <li>• Danger (vermelho-600)</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700">✅ Props Suportadas</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• title, value, icon</li>
              <li>• variant, description</li>
              <li>• data[] para gráfico</li>
              <li>• className customizável</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Código de exemplo */}
      <section className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Exemplo de Uso
        </h2>
        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
{`// Dados de série temporal
const timeSeriesData = [
  { date: '2024-01-01', value: 45 },
  { date: '2024-01-02', value: 52 },
  { date: '2024-01-03', value: 48 },
  // ... mais dados
];

// Uso do componente
<KPICard
  title="Desarquivamentos"
  value={1234}
  icon={FileText}
  variant="primary"
  description="Total de prontuários desarquivados no período"
  data={timeSeriesData}
/>

// Variantes disponíveis
<KPICard variant="primary" />   // Azul
<KPICard variant="success" />   // Verde  
<KPICard variant="warning" />   // Laranja
<KPICard variant="danger" />    // Vermelho`}
        </pre>
      </section>
    </div>
  );
};

export default KPIDemo;