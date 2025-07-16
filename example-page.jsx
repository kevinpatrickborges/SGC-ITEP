import React from 'react';
import Layout from './components/Layout';
import AnalyticsGrid from './components/AnalyticsGrid';
import AnalyticsCard from './components/AnalyticsCard';
import {
    FileText,
    Users,
    Archive,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Clock,
    MapPin
} from 'lucide-react';

const ExamplePage = () => {
    // Dados para os AnalyticsCards
    const analyticsData = [
        {
            id: 'desarquivamentos',
            title: 'Desarquivamentos',
            value: '1,234',
            icon: FileText,
            variant: 'primary',
            subtitle: 'Prontuários processados este mês',
            trend: 'up',
            trendValue: '+12%'
        },
        {
            id: 'vestigios',
            title: 'Vestígios',
            value: '856',
            icon: Archive,
            variant: 'success',
            subtitle: 'Itens em custódia ativa',
            trend: 'up',
            trendValue: '+8%'
        },
        {
            id: 'usuarios',
            title: 'Usuários Ativos',
            value: '42',
            icon: Users,
            variant: 'primary',
            subtitle: 'Conectados nas últimas 24h',
            trend: 'up',
            trendValue: '+3%'
        },
        {
            id: 'relatorios',
            title: 'Relatórios',
            value: '127',
            icon: TrendingUp,
            variant: 'success',
            subtitle: 'Gerados neste período',
            trend: 'up',
            trendValue: '+15%'
        },
        {
            id: 'pendentes',
            title: 'Pendências',
            value: '23',
            icon: AlertTriangle,
            variant: 'warning',
            subtitle: 'Requerem atenção imediata',
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
            id: 'tempo-medio',
            title: 'Tempo Médio',
            value: '4.2h',
            icon: Clock,
            variant: 'primary',
            subtitle: 'Processamento por item',
            trend: 'down',
            trendValue: '-18min'
        },
        {
            id: 'localizacoes',
            title: 'Localizações',
            value: '18',
            icon: MapPin,
            variant: 'primary',
            subtitle: 'Pontos de armazenamento',
            trend: 'neutral',
            trendValue: '0%'
        }
    ];

    return (
        <Layout>
            <div className="space-y-6">
                {/* Título da página */}
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
                    <p className="text-gray-600 mt-2">
                        Visão geral do sistema de gestão documental
                    </p>
                </div>

                {/* Analytics Cards Grid */}
                <AnalyticsGrid cards={analyticsData} />

                {/* Seção de conteúdo principal */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Card de atividades recentes */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Atividades Recentes
                        </h3>
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((item) => (
                                <div key={item} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">
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

                    {/* Card de status do sistema */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Status do Sistema
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Banco de Dados</span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Online
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">API</span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Funcionando
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Backup</span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Agendado
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ExamplePage;