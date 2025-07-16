import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, StatusBadge } from './DataTable';
import { FileText, User, Calendar, MapPin } from 'lucide-react';

// Tipos de dados
interface Desarquivamento {
  id: string;
  protocolo: string;
  solicitante: string;
  documento: string;
  dataRequisicao: string;
  dataDevolucao?: string;
  status: string;
  localizacao: string;
  observacoes?: string;
}

interface Vestigio {
  id: string;
  numero: string;
  descricao: string;
  origem: string;
  dataEntrada: string;
  status: string;
  localizacao: string;
  responsavel: string;
  valor?: number;
}

const DataTableDemo = () => {
  // Dados de exemplo para Desarquivamentos
  const desarquivamentosData: Desarquivamento[] = [
    {
      id: '1',
      protocolo: 'DES-2024-001',
      solicitante: 'Dr. João Silva',
      documento: 'Prontuário 12345',
      dataRequisicao: '2024-01-15',
      dataDevolucao: '2024-01-20',
      status: 'Finalizado',
      localizacao: 'Arquivo Central - Setor A',
      observacoes: 'Documento em bom estado'
    },
    {
      id: '2',
      protocolo: 'DES-2024-002',
      solicitante: 'Dra. Maria Santos',
      documento: 'Laudo Técnico 67890',
      dataRequisicao: '2024-01-16',
      status: 'Não localizado',
      localizacao: 'Arquivo Central - Setor B',
      observacoes: 'Documento não encontrado na localização indicada'
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
      dataDevolucao: '2024-01-22',
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
      localizacao: 'Arquivo Técnico - Sala 2',
      observacoes: 'Aguardando autorização superior'
    }
  ];

  // Dados de exemplo para Vestígios
  const vestigiosData: Vestigio[] = [
    {
      id: '1',
      numero: 'VES-2024-001',
      descricao: 'Arma de fogo calibre .38',
      origem: 'Apreensão - Caso 12345',
      dataEntrada: '2024-01-10',
      status: 'Em custódia',
      localizacao: 'Cofre A - Prateleira 1',
      responsavel: 'Perito João',
      valor: 1500
    },
    {
      id: '2',
      numero: 'VES-2024-002',
      descricao: 'Documentos falsificados',
      origem: 'Operação Papel Limpo',
      dataEntrada: '2024-01-12',
      status: 'Finalizado',
      localizacao: 'Arquivo Especial - Gaveta 3',
      responsavel: 'Perita Maria',
      valor: 0
    },
    {
      id: '3',
      numero: 'VES-2024-003',
      descricao: 'Substância entorpecente (cocaína)',
      origem: 'Apreensão - Caso 67890',
      dataEntrada: '2024-01-14',
      status: 'Não localizado',
      localizacao: 'Cofre B - Compartimento 2',
      responsavel: 'Perito Carlos',
      valor: 5000
    },
    {
      id: '4',
      numero: 'VES-2024-004',
      descricao: 'Celular Samsung Galaxy',
      origem: 'Perícia Digital - Caso 11111',
      dataEntrada: '2024-01-16',
      status: 'Em análise',
      localizacao: 'Lab. Digital - Mesa 1',
      responsavel: 'Perita Ana',
      valor: 800
    }
  ];

  // Colunas para Desarquivamentos
  const desarquivamentosColumns = useMemo<ColumnDef<Desarquivamento>[]>(
    () => [
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
        header: 'Data Requisição',
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
      },
      {
        accessorKey: 'localizacao',
        header: 'Localização',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-sm">{row.getValue('localizacao')}</span>
          </div>
        ),
      },
    ],
    []
  );

  // Colunas para Vestígios
  const vestigiosColumns = useMemo<ColumnDef<Vestigio>[]>(
    () => [
      {
        accessorKey: 'numero',
        header: 'Número',
        cell: ({ row }) => (
          <span className="font-medium text-primary-600">{row.getValue('numero')}</span>
        ),
      },
      {
        accessorKey: 'descricao',
        header: 'Descrição',
      },
      {
        accessorKey: 'origem',
        header: 'Origem',
        cell: ({ row }) => (
          <span className="text-sm text-gray-600">{row.getValue('origem')}</span>
        ),
      },
      {
        accessorKey: 'dataEntrada',
        header: 'Data Entrada',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{new Date(row.getValue('dataEntrada')).toLocaleDateString('pt-BR')}</span>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
      },
      {
        accessorKey: 'responsavel',
        header: 'Responsável',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <span>{row.getValue('responsavel')}</span>
          </div>
        ),
      },
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
      },
    ],
    []
  );

  return (
    <div className="space-y-8 p-6">
      {/* Título */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          DataTable Demo
        </h1>
        <p className="text-gray-600">
          Demonstração do componente DataTable com React-Table v8 e funcionalidades completas
        </p>
      </div>

      {/* Tabela de Desarquivamentos */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Desarquivamentos
        </h2>
        <DataTable
          data={desarquivamentosData}
          columns={desarquivamentosColumns}
        />
      </section>

      {/* Tabela de Vestígios */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Vestígios
        </h2>
        <DataTable
          data={vestigiosData}
          columns={vestigiosColumns}
        />
      </section>

      {/* Funcionalidades */}
      <section className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Funcionalidades Implementadas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700">✅ Busca e Filtros</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Busca global em todos os campos</li>
              <li>• Filtros individuais por coluna</li>
              <li>• Filtros numéricos com min/max</li>
              <li>• Limpeza rápida de filtros</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700">✅ Ordenação e Paginação</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Ordenação por qualquer coluna</li>
              <li>• Indicadores visuais de ordenação</li>
              <li>• Paginação com 10, 25, 50 itens</li>
              <li>• Navegação entre páginas</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700">✅ Interface</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Highlight em hover nas linhas</li>
              <li>• Badges coloridos para status</li>
              <li>• Design responsivo</li>
              <li>• Ícones contextuais</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700">✅ Status Badges</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <StatusBadge status="Finalizado" /> Verde</li>
              <li>• <StatusBadge status="Não localizado" /> Laranja</li>
              <li>• <StatusBadge status="Em andamento" /> Cinza</li>
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
{`// Definir colunas
const columns = useMemo<ColumnDef<DataType>[]>(() => [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
  },
  // ... mais colunas
], []);

// Usar o componente
<DataTable
  data={myData}
  columns={columns}
  className="my-custom-class"
/>`}
        </pre>
      </section>
    </div>
  );
};

export default DataTableDemo;