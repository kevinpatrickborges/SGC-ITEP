import React from 'react';
import AnalyticsCard from './AnalyticsCard';

const AnalyticsGrid = ({ cards, className = '' }) => {
  return (
    <div className={`
      grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 
      gap-6 auto-fit
      ${className}
    `}>
      {cards.map((card, index) => (
        <AnalyticsCard
          key={card.id || index}
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
  );
};

export default AnalyticsGrid;