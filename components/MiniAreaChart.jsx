import React from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

const MiniAreaChart = ({
  data = [],
  width = 240,
  height = 80,
  className = '',
  strokeWidth = 2,
  fillOpacity = 0.1
}) => {
  // Tooltip customizado
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const date = new Date(label).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
          <p className="text-gray-600 font-medium">{date}</p>
          <p className="text-gray-900 font-semibold">
            Total: <span className="text-primary-600">{value.toLocaleString('pt-BR')}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Se não há dados, renderizar estado vazio
  if (!data || data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-50 rounded-lg ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-400 text-xs">Sem dados</span>
      </div>
    );
  }

  return (
    <div className={`${className}`} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 5,
            right: 5,
            left: 5,
            bottom: 5,
          }}
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="currentColor" stopOpacity={0.3} />
              <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
            </linearGradient>
          </defs>

          <Area
            type="monotone"
            dataKey="count"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="url(#areaGradient)"
            fillOpacity={fillOpacity}
            dot={false}
            activeDot={{
              r: 3,
              stroke: 'currentColor',
              strokeWidth: 2,
              fill: 'white'
            }}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              stroke: 'currentColor',
              strokeWidth: 1,
              strokeDasharray: '3 3'
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MiniAreaChart;