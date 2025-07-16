import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { X } from 'lucide-react';

// Hook para animação de contador
const useCountUp = (end, duration = 2000, start = 0) => {
  const [count, setCount] = useState(start);
  
  useEffect(() => {
    if (start === end) return;
    
    const increment = (end - start) / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [end, duration, start]);
  
  return count;
};

// Componente Modal
const KPIModal = ({ isOpen, onClose, title, data, variant }) => {
  if (!isOpen) return null;

  const variantConfig = {
    primary: { color: '#2563eb', bg: 'bg-blue-50', text: 'text-blue-900' },
    warning: { color: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-900' },
    danger: { color: '#dc2626', bg: 'bg-red-50', text: 'text-red-900' },
    success: { color: '#16a34a', bg: 'bg-green-50', text: 'text-green-900' }
  };

  const config = variantConfig[variant] || variantConfig.primary;

  // Tooltip customizado para o gráfico
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2">
          <p className="text-gray-600 font-medium text-sm">
            {new Date(label).toLocaleDateString('pt-BR')}
          </p>
          <p className="text-gray-900 font-semibold">
            Valor: <span style={{ color: config.color }}>{payload[0].value.toLocaleString('pt-BR')}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className={`${config.bg} px-6 py-4 border-b border-gray-200`}>
          <div className="flex items-center justify-between">
            <h2 id="modal-title" className={`text-xl font-semibold ${config.text}`}>
              {title} - Série Temporal
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white hover:bg-opacity-50 transition-colors"
              aria-label="Fechar modal"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) => value.toLocaleString('pt-BR')}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={config.color}
                  strokeWidth={3}
                  dot={{ fill: config.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: config.color, strokeWidth: 2, fill: 'white' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">
                {data.length > 0 ? Math.max(...data.map(d => d.value)).toLocaleString('pt-BR') : '0'}
              </p>
              <p className="text-sm text-gray-600">Valor Máximo</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">
                {data.length > 0 ? Math.min(...data.map(d => d.value)).toLocaleString('pt-BR') : '0'}
              </p>
              <p className="text-sm text-gray-600">Valor Mínimo</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">
                {data.length > 0 ? Math.round(data.reduce((acc, d) => acc + d.value, 0) / data.length).toLocaleString('pt-BR') : '0'}
              </p>
              <p className="text-sm text-gray-600">Média</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente principal KPI Card
const KPICard = ({ 
  title, 
  value, 
  icon: Icon, 
  variant = 'primary', 
  data = [],
  description,
  className = ''
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const animatedValue = useCountUp(value, 2000);

  // Configurações das variantes
  const variantConfig = {
    primary: {
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      hoverBorder: 'hover:border-blue-300',
      focusRing: 'focus:ring-blue-500'
    },
    warning: {
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-500',
      borderColor: 'border-amber-200',
      hoverBorder: 'hover:border-amber-300',
      focusRing: 'focus:ring-amber-500'
    },
    danger: {
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      borderColor: 'border-red-200',
      hoverBorder: 'hover:border-red-300',
      focusRing: 'focus:ring-red-500'
    },
    success: {
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200',
      hoverBorder: 'hover:border-green-300',
      focusRing: 'focus:ring-green-500'
    }
  };

  const config = variantConfig[variant] || variantConfig.primary;

  const handleCardClick = () => {
    setIsModalOpen(true);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardClick();
    }
  };

  return (
    <>
      {/* KPI Card */}
      <div className={`relative ${className}`}>
        <button
          onClick={handleCardClick}
          onKeyDown={handleKeyDown}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`
            w-80 h-40 bg-white border border-gray-200 rounded-lg shadow-sm
            hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-1
            ${config.borderColor} ${config.hoverBorder}
            focus:outline-none focus:ring-2 focus:ring-offset-2 ${config.focusRing}
            transition-all duration-200 ease-in-out
            p-6 flex items-center gap-4 text-left w-full
          `}
          aria-label={`KPI ${title}: ${value.toLocaleString('pt-BR')}. Clique para ver detalhes em gráfico.`}
          role="button"
          tabIndex={0}
        >
          {/* Ícone circular */}
          <div className={`
            w-16 h-16 rounded-full ${config.iconBg} 
            flex items-center justify-center flex-shrink-0
          `}>
            {Icon && <Icon className={`w-8 h-8 ${config.iconColor}`} />}
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            {/* Contador animado */}
            <div className="text-5xl font-semibold text-gray-900 leading-none mb-2">
              {animatedValue.toLocaleString('pt-BR')}
            </div>
            
            {/* Label */}
            <div className="text-xs font-medium text-gray-600 uppercase tracking-wider">
              {title}
            </div>
          </div>

          {/* Indicador de clique */}
          <div className="flex-shrink-0 opacity-60">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        {/* Tooltip */}
        {showTooltip && description && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10">
            <div className="bg-gray-900 text-white text-sm rounded-lg py-2 px-3 max-w-xs">
              <p>{description}</p>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                <div className="border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <KPIModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={title}
        data={data}
        variant={variant}
      />
    </>
  );
};

export default KPICard;