import React, { useState, useMemo } from 'react';

const MiniAreaChartSVG = ({ 
  data = [], 
  width = 240, 
  height = 80,
  className = '',
  strokeWidth = 2,
  fillOpacity = 0.1
}) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Calcular pontos do gráfico
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const padding = 10;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);

    // Encontrar valores min/max
    const counts = data.map(d => d.count);
    const minCount = Math.min(...counts);
    const maxCount = Math.max(...counts);
    const range = maxCount - minCount || 1;

    // Gerar pontos
    const points = data.map((item, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((item.count - minCount) / range) * chartHeight;
      return { x, y, data: item, index };
    });

    // Criar path para área
    const pathData = points.reduce((acc, point, index) => {
      if (index === 0) {
        return `M ${point.x} ${height - padding} L ${point.x} ${point.y}`;
      }
      return `${acc} L ${point.x} ${point.y}`;
    }, '');
    
    const areaPath = `${pathData} L ${points[points.length - 1].x} ${height - padding} Z`;
    
    // Criar path para linha
    const linePath = points.reduce((acc, point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }
      return `${acc} L ${point.x} ${point.y}`;
    }, '');

    return { points, areaPath, linePath, minCount, maxCount };
  }, [data, width, height]);

  const handleMouseMove = (event) => {
    if (!chartData) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Encontrar ponto mais próximo
    const closestPoint = chartData.points.reduce((closest, point) => {
      const distance = Math.abs(point.x - mouseX);
      return distance < Math.abs(closest.x - mouseX) ? point : closest;
    });

    setHoveredPoint(closestPoint);
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  // Tooltip
  const renderTooltip = () => {
    if (!hoveredPoint) return null;

    const date = new Date(hoveredPoint.data.date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    return (
      <div 
        className="fixed bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm z-50 pointer-events-none"
        style={{
          left: mousePosition.x + 10,
          top: mousePosition.y - 10,
          transform: 'translateY(-100%)'
        }}
      >
        <p className="text-gray-600 font-medium">{date}</p>
        <p className="text-gray-900 font-semibold">
          Total: <span className="text-current">{hoveredPoint.data.count.toLocaleString('pt-BR')}</span>
        </p>
      </div>
    );
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

  if (!chartData) return null;

  return (
    <>
      <div className={`relative ${className}`} style={{ width, height }}>
        <svg
          width={width}
          height={height}
          className="overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="areaGradientSVG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="currentColor" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="currentColor" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          {/* Área preenchida */}
          <path
            d={chartData.areaPath}
            fill="url(#areaGradientSVG)"
            fillOpacity={fillOpacity}
          />
          
          {/* Linha */}
          <path
            d={chartData.linePath}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Linha vertical do hover */}
          {hoveredPoint && (
            <line
              x1={hoveredPoint.x}
              y1={10}
              x2={hoveredPoint.x}
              y2={height - 10}
              stroke="currentColor"
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.5}
            />
          )}
          
          {/* Ponto ativo */}
          {hoveredPoint && (
            <circle
              cx={hoveredPoint.x}
              cy={hoveredPoint.y}
              r={3}
              fill="white"
              stroke="currentColor"
              strokeWidth={2}
            />
          )}
          
          {/* Área invisível para capturar mouse */}
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill="transparent"
            style={{ cursor: 'crosshair' }}
          />
        </svg>
      </div>
      
      {/* Tooltip */}
      {renderTooltip()}
    </>
  );
};

export default MiniAreaChartSVG;