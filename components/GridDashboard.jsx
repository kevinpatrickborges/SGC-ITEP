import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { AnalyticsCard } from './AnalyticsCard';
import MiniAreaChart from './MiniAreaChart';
import { DataTable, StatusBadge } from './DataTable';
import { 
  Menu, 
  X, 
  Bell, 
  User, 
  Search,
  FileText, 
  Users, 
  Archive, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar,
  MapPin
} from 'lucide-react';

const GridDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Dados para os cards analytics
  const analyticsData = [
    {
      id: 'desarquivamentos',
      title: 'Desarquivamentos',
      value: '1,234',
      icon: FileText,
      variant: 'primary',
      subtitle: 'Prontuários processados',
      trend: 'up',
      trendValue: '+12%',
      chartData: [
        { date: '2024-01-01', count: 45 },
        { date: '2024-01-02', count: 52 },
        { date: '2024-01-03', count: 48 },
        { date: '2024-01-04', count: 61 },
        { date: '2024-01-05', count: 55 },
        { date: '2024-01-06', count: 58 },
        { date: '2024-01-07', count: 62 }
      ]
    },
    {
      id: 'vestigios',
      title: 'Vestígios',
      value: '856',
      icon: Archive,
      variant: 'success',
      subtitle: 'Itens em custódia',
      trend: 'up',
      trendValue: '+8%',
      chartData: [
        { date: '2024-01-01', count: 28 },
        { date: '2024-01-02', count: 32 },
        { date: '2024-01-03', count: 29 },
        { date: '2024-01-04', count: 35 },
        { date: '2024-01-05', count: 31 },
        { date: '2024-01-06', count: 38 },
        { date: '2024-01-07', count: 42 }
      ]
    },
    {
      id: 'usuarios',
      title: 'Usuários Ativos',
      value: '42',
      icon: Users,
      variant: 'primary',
      subtitle: 'Conectados hoje',
      trend: 'up',
      trendValue: '+3%'
    },
    {
      id: 'pendencias',
      title: 'Pendências',
      value: '23',
      icon: AlertTriangle,
      variant: 'warning',
      subtitle: 'Requerem atenção',
      trend: 'down',
      trendValue: '-5%'
    },
    {
      id: 'concluidos',
      title: 'Concluídos',
      value: '1,891',
      icon: CheckCircle,
      variant: 'success',
      subtitle: 'Processos finalizados',
      trend: 'up',
      trendValue: '+22%'
    },
    {
      id: 'relatorios',
      title: 'Relatórios',
      value: '127',
      icon: TrendingUp,
      variant: 'success',
      subtitle: 'Gerados este mês',
      trend: 'up',
      trendValue: '+15%'
    }
  ];

  // Dados para o gráfico principal
  const mainChartData = [
    { date: '2024-01-01', count: 120 },
    { date: '2024-01-02', count: 135 },
    { date: '2024-01-03', count: 128 },
    { date: '2024-01-04', count: 142 },
    { date: '2024-01-05', count: 156 },
    { date: '2024-01-06', count: 148 },
    { date: '2024-01-07', count: 162 },
    { date: '2024-01-08', count: 171 },
    { date: '2024-01-09', count: 158 },
    { date: '2024-01-10', count: 165 },
    { date: '2024-01-11', count: 178 },
    { date: '2024-01-12', count: 185 },
    { date: '2024-01-13', count: 172 },
    { date: '2024-01-14', count: 189 }
  ];

  // Dados para a tabela
  const tableData = [
    {
      id: '1',
      protocolo: 'DES-2024-001',
      solicitante: 'Dr. João Silva',
      documento: 'Prontuário 12345',
      dataRequisicao: '2024-01-15',
      status: 'Finalizado',
      localizacao: 'Arquivo Central - Setor A'
    },
    {
      id: '2',
      protocolo: 'DES-2024-002',
      solicitante: 'Dra. Maria Santos',
      documento: 'Laudo Técnico 67890',
      dataRequisicao: '2024-01-16',
      status: 'Não localizado',
      localizacao: 'Arquivo Central - Setor B'
    },
    {
      id: '3',
      protocolo: 'DES-2024-003',
      solicitante: 'Perito Carlos Lima',
      documento: 'Relatório Pericial 11111',
      dataRequisicao: '2024-01-17',
      status: 'Em andamento',
      localizacao: 'Arquivo Central - Setor C'
    },
    {
      id: '4',
      protocolo: 'DES-2024-004',
      solicitante: 'Dra. Ana Costa',
      documento: 'Exame Toxicológico 22222',
      dataRequisicao: '2024-01-18',
      status: 'Finalizado',
      localizacao: 'Arquivo Técnico - Sala 1'
    },
    {
      id: '5',
      protocolo: 'DES-2024-005',
      solicitante: 'Dr. Pedro Oliveira',
      documento: 'Análise Balística 33333',
      dataRequisicao: '2024-01-19',
      status: 'Pendente',
      localizacao: 'Arquivo Técnico - Sala 2'
    }
  ];

  // Colunas da tabela
  const tableColumns = [
    {
      accessorKey: 'protocolo',
      header: 'Protocolo',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary-600" />
          <span className="font-medium">{row.getValue('protocolo')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'solicitante',
      header: 'Solicitante',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <span>{row.getValue('solicitante')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'documento',
      header: 'Documento',
    },
    {
      accessorKey: 'dataRequisicao',
      header: 'Data',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{new Date(row.getValue('dataRequisicao')).toLocaleDateString('pt-BR')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
    }
  ];

  // Header Component
  const Header = () => (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5 text-gray-600" />
            ) : (
              <Menu className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {/* Logo/Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">SGC-ITEP</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Sistema de Gestão Documental</p>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="hidden md:flex relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
            />
          </div>

          {/* Notifications */}
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-warning-500 rounded-full"></span>
          </button>

          {/* User menu */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900">Admin</p>
              <p className="text-xs text-gray-500">admin@itep.rn.gov.br</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Hidden on < lg */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="relative">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header - Sticky */}
        <Header />

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          {/* CSS Grid Layout with gap-6 */}
          <div className="grid gap-6">
            
            {/* Analytics Cards - auto-fit minmax(220px, 1fr) */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Visão Geral
              </h2>
              <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                {analyticsData.map((card) => (
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

            {/* Chart and Table Section - Stack on md, side-by-side on xl */}
            <section className="grid gap-6 md:grid-cols-1 xl:grid-cols-2">
              
              {/* Chart Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Atividade dos Últimos 14 Dias
                    </h3>
                    <p className="text-sm text-gray-500">
                      Total de processos por dia
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-success-600">
                    <TrendingUp className="w-4 h-4" />
                    <span>+18% vs período anterior</span>
                  </div>
                </div>
                
                <div className="text-primary-600">
                  <MiniAreaChart 
                    data={mainChartData} 
                    width="100%" 
                    height={200}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Table Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Desarquivamentos Recentes
                    </h3>
                    <p className="text-sm text-gray-500">
                      Últimas solicitações processadas
                    </p>
                  </div>
                  <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    Ver todos
                  </button>
                </div>
                
                <DataTable 
                  data={tableData} 
                  columns={tableColumns}
                  className="border-0 shadow-none"
                />
              </div>
            </section>

            {/* Additional Stats Section */}
            <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Status dos Processos</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Finalizados</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full">
                        <div className="w-12 h-2 bg-success-500 rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">75%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Em andamento</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full">
                        <div className="w-4 h-2 bg-primary-500 rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">20%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pendentes</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full">
                        <div className="w-1 h-2 bg-warning-500 rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">5%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Atividades Recentes</h4>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          Desarquivamento #{item}234 processado
                        </p>
                        <p className="text-xs text-gray-500">
                          há {item} hora{item > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Localizações Ativas</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Arquivo Central</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">1,234</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Arquivo Técnico</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">856</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Cofre Especial</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">42</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default GridDashboard;