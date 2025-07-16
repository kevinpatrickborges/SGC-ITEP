import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import MiniAreaChart from './MiniAreaChart';

const AnalyticsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  variant = 'primary',
  subtitle,
  trend,
  trendValue,
  chartData,
  className = ''
}) => {
  // Configurações de variantes
  const variants = {
    primary: {
      iconBg: 'bg-primary-100',
      iconColor: 'text-primary-600',
      numberColor: 'text-gray-900',
      cardBorder: 'border-primary-200',
      cardHover: 'hover:border-primary-300'
    },
    success: {
      iconBg: 'bg-success-100',
      iconColor: 'text-success-600',
      numberColor: 'text-gray-900',
      cardBorder: 'border-success-200',
      cardHover: 'hover:border-success-300'
    },
    warning: {
      iconBg: 'bg-warning-100',
      iconColor: 'text-warning-600',
      numberColor: 'text-gray-900',
      cardBorder: 'border-warning-200',
      cardHover: 'hover:border-warning-300'
    }
  };

  const currentVariant = variants[variant] || variants.primary;

  // Componente de trend
  const renderTrend = () => {
    if (!trend || !trendValue) return null;

    const trendConfig = {
      up: { icon: TrendingUp, color: 'text-success-600', bg: 'bg-success-50' },
      down: { icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
      neutral: { icon: Minus, color: 'text-gray-500', bg: 'bg-gray-50' }
    };

    const TrendIcon = trendConfig[trend]?.icon || Minus;
    const trendColor = trendConfig[trend]?.color || 'text-gray-500';
    const trendBg = trendConfig[trend]?.bg || 'bg-gray-50';

    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${trendBg} ${trendColor}`}>
        <TrendIcon className="w-3 h-3 mr-1" />
        {trendValue}
      </div>
    );
  };

  return (
    <div className={`
      bg-white rounded-xl border-2 ${currentVariant.cardBorder} ${currentVariant.cardHover}
      p-6 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]
      ${className}
    `}>
      {/* Header com ícone */}
      <div className="flex items-start justify-between mb-4">
        <div className={`
          w-12 h-12 rounded-full ${currentVariant.iconBg} 
          flex items-center justify-center
        `}>
          {Icon && (
            <Icon className={`w-6 h-6 ${currentVariant.iconColor}`} />
          )}
        </div>
        
        {/* Trend indicator */}
        {renderTrend()}
      </div>

      {/* Número principal */}
      <div className="mb-2">
        <span className={`
          text-4xl font-bold ${currentVariant.numberColor}
          leading-none tracking-tight
        `}>
          {value}
        </span>
      </div>

      {/* Label principal */}
      <div className="mb-1">
        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          {title}
        </h3>
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-sm text-gray-500 leading-relaxed mb-3">
          {subtitle}
        </p>
      )}

      {/* Mini Chart */}
      {chartData && chartData.length > 0 && (
        <div className={`mt-4 ${currentVariant.iconColor}`}>
          <MiniAreaChart 
            data={chartData} 
            width={240} 
            height={60}
          />
        </div>
      )}
    </div>
  );
};

export default AnalyticsCard;