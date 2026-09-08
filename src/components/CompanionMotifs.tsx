import React from 'react';

interface MotifProps {
  type: 'compass' | 'graph' | 'topology';
  className?: string;
  size?: number;
  subtleFloat?: boolean;
}

export const CompanionMotif: React.FC<MotifProps> = ({
  type,
  className = '',
  size = 40,
  subtleFloat = false,
}) => {
  const floatClass = subtleFloat ? 'motion-safe:animate-pulse' : '';

  if (type === 'compass') {
    // Navigasi Geometri: Compass / Journey Marker
    return (
      <div 
        className={`inline-flex items-center justify-center text-[#10B981] ${floatClass} ${className}`} 
        title="Motif Navigasi Geometri"
        aria-label="Motif Navigasi Geometri"
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 48 48"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Outer geometric ring */}
          <circle cx="24" cy="24" r="20" stroke="currentColor" strokeOpacity="0.4" strokeDasharray="3 3" />
          <circle cx="24" cy="24" r="14" stroke="currentColor" strokeOpacity="0.8" />
          {/* Journey diamond marker */}
          <polygon points="24,6 28,24 24,42 20,24" fill="currentColor" fillOpacity="0.15" stroke="currentColor" />
          <polygon points="24,6 28,24 24,24" fill="currentColor" />
          {/* Center coordinate point */}
          <circle cx="24" cy="24" r="2.5" fill="#0D0D0D" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>
    );
  }

  if (type === 'graph') {
    // Lengkung Fungsi: Continuous Wave & Axis Curve
    return (
      <div 
        className={`inline-flex items-center justify-center text-[#10B981] ${floatClass} ${className}`}
        title="Motif Dinamika Fungsi"
        aria-label="Motif Dinamika Fungsi"
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 48 48"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Coordinate axis frame */}
          <line x1="8" y1="40" x2="42" y2="40" stroke="currentColor" strokeOpacity="0.3" />
          <line x1="8" y1="40" x2="8" y2="8" stroke="currentColor" strokeOpacity="0.3" />
          {/* Function wave curve */}
          <path
            d="M8 32 C 16 12, 22 42, 32 18 C 36 10, 40 14, 42 12"
            stroke="currentColor"
            strokeWidth="2.5"
          />
          {/* Inflection / tangent points */}
          <circle cx="19" cy="23" r="2.5" fill="currentColor" />
          <circle cx="32" cy="18" r="2.5" fill="#0D0D0D" stroke="currentColor" strokeWidth="2" />
          <line x1="26" y1="22" x2="38" y2="14" stroke="currentColor" strokeDasharray="2 2" strokeOpacity="0.7" />
        </svg>
      </div>
    );
  }

  // Topology Node / Geometric Shape-Being
  return (
    <div 
      className={`inline-flex items-center justify-center text-[#10B981] ${floatClass} ${className}`}
      title="Motif Struktur Topologi"
      aria-label="Motif Struktur Topologi"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Hexagonal / tetrahedral node mesh */}
        <polygon points="24,8 38,16 38,32 24,40 10,32 10,16" stroke="currentColor" strokeOpacity="0.5" />
        {/* Internal triangulation */}
        <line x1="24" y1="8" x2="24" y2="24" stroke="currentColor" />
        <line x1="38" y1="16" x2="24" y2="24" stroke="currentColor" />
        <line x1="38" y1="32" x2="24" y2="24" stroke="currentColor" />
        <line x1="24" y1="40" x2="24" y2="24" stroke="currentColor" />
        <line x1="10" y1="32" x2="24" y2="24" stroke="currentColor" />
        <line x1="10" y1="16" x2="24" y2="24" stroke="currentColor" />
        {/* Node apex vertices */}
        <circle cx="24" cy="8" r="2" fill="currentColor" />
        <circle cx="38" cy="16" r="2" fill="currentColor" />
        <circle cx="38" cy="32" r="2" fill="currentColor" />
        <circle cx="24" cy="40" r="2" fill="currentColor" />
        <circle cx="10" cy="32" r="2" fill="currentColor" />
        <circle cx="10" cy="16" r="2" fill="currentColor" />
        <circle cx="24" cy="24" r="3" fill="#10B981" />
      </svg>
    </div>
  );
};
