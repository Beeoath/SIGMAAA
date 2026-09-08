import React from 'react';

interface EqualizerIconProps {
  className?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const EqualizerIcon: React.FC<EqualizerIconProps> = ({
  className = '',
  color = '#10B981',
  size = 'md',
  label = 'Active Listening State'
}) => {
  // Height and bar widths depending on size
  const heightClass = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-3.5 w-3.5';
  const barWidth = size === 'sm' ? 'w-[1.5px]' : size === 'lg' ? 'w-[3px]' : 'w-[2px]';

  return (
    <div 
      className={`inline-flex items-end justify-center space-x-[2px] pb-[1px] ${heightClass} ${className}`}
      title={label}
      role="img"
      aria-label={label}
    >
      <span 
        className={`${barWidth} rounded-full animate-eq-bar-1`}
        style={{ backgroundColor: color, minHeight: '3px' }} 
      />
      <span 
        className={`${barWidth} rounded-full animate-eq-bar-2`}
        style={{ backgroundColor: color, minHeight: '4px' }} 
      />
      <span 
        className={`${barWidth} rounded-full animate-eq-bar-3`}
        style={{ backgroundColor: color, minHeight: '3px' }} 
      />
      <span 
        className={`${barWidth} rounded-full animate-eq-bar-4`}
        style={{ backgroundColor: color, minHeight: '4px' }} 
      />
    </div>
  );
};
