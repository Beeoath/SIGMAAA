import React, { useId } from 'react';

interface SigmaEchoLogoProps {
  /** Size preset */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Optional top banner (like Marvel Studios in the Echo poster) */
  badgeText?: string;
  /** Badge theme color */
  badgeColor?: 'emerald' | 'red' | 'neutral';
  /** Additional wrapper class */
  className?: string;
  /** Whether to show hover glow effect */
  interactive?: boolean;
}

/**
 * SigmaEchoLogo
 * Recreates the iconic visual style of Marvel Studios' "ECHO" logo:
 * - Ultra-heavy, condensed block display typography (Anton / Bebas Neue / Impact)
 * - Weathered, cracked-concrete / distressed stone plaster texture
 * - Jagged fissure cracks splitting the letterforms with high-contrast depth
 * - Mottled grunge grime, distressed wear, and authentic cinematic finish
 */
export const SigmaEchoLogo: React.FC<SigmaEchoLogoProps> = ({
  size = 'md',
  badgeText,
  badgeColor = 'emerald',
  className = '',
  interactive = false,
}) => {
  const idPrefix = useId().replace(/:/g, '');
  const maskId = `echo-mask-${idPrefix}`;
  const noiseFilterId = `echo-noise-${idPrefix}`;
  const erosionFilterId = `echo-erosion-${idPrefix}`;

  // Dimensions based on size preset
  const sizeConfig = {
    xs: { height: 26, badgeScale: 'text-[7px] px-1 py-0.2 mb-0.5' },
    sm: { height: 34, badgeScale: 'text-[8px] px-1.5 py-0.5 mb-1' },
    md: { height: 48, badgeScale: 'text-[9px] px-2 py-0.5 mb-1.5' },
    lg: { height: 70, badgeScale: 'text-[10px] px-2.5 py-0.5 mb-2' },
    xl: { height: 104, badgeScale: 'text-xs px-3 py-1 mb-2.5' },
  }[size];

  const badgeBg = {
    emerald: 'bg-[#10B981] text-[#0D0D0D]',
    red: 'bg-[#E50914] text-white',
    neutral: 'bg-white text-black',
  }[badgeColor];

  return (
    <div 
      className={`inline-flex flex-col items-center select-none ${interactive ? 'group cursor-pointer transition-transform duration-200 hover:scale-[1.02]' : ''} ${className}`}
    >
      {/* Optional Top Mini-Badge (like "MARVEL STUDIOS" in the Echo logo) */}
      {badgeText && (
        <span 
          className={`font-mono font-black tracking-widest uppercase rounded-[2px] shadow-sm font-sans ${sizeConfig.badgeScale} ${badgeBg}`}
        >
          {badgeText}
        </span>
      )}

      {/* SVG Canvas for "SIGMA" in the authentic ECHO style */}
      <svg
        viewBox="0 0 540 140"
        style={{ height: `${sizeConfig.height}px`, width: 'auto' }}
        className="overflow-visible drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)]"
        aria-label="SIGMA Logo"
        role="img"
      >
        <defs>
          {/* Subtle concrete grain noise filter */}
          <filter id={noiseFilterId} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.06 0.12"
              numOctaves="4"
              result="noise"
            />
            <feColorMatrix
              type="matrix"
              values="0.33 0.33 0.33 0 0
                      0.33 0.33 0.33 0 0
                      0.33 0.33 0.33 0 0
                      0 0 0 1.2 -0.15"
              result="contrasted"
            />
            <feComposite operator="in" in2="SourceGraphic" />
          </filter>

          {/* Slight distressed edge erosion filter */}
          <filter id={erosionFilterId} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.04 0.08"
              numOctaves="3"
              result="rough"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="rough"
              scale="2.2"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          {/* The Text Mask containing "SIGMA" */}
          <mask id={maskId}>
            <rect width="540" height="140" fill="black" />
            <text
              x="270"
              y="112"
              textAnchor="middle"
              fill="white"
              style={{
                fontFamily: "'Anton', 'Bebas Neue', Impact, 'Arial Black', sans-serif",
                fontSize: '136px',
                fontWeight: 900,
                letterSpacing: '0.04em',
              }}
              filter={`url(#${erosionFilterId})`}
            >
              SIGMA
            </text>
          </mask>

          {/* Base Weathered Plaster Gradient */}
          <linearGradient id={`${idPrefix}-baseGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="25%" stopColor="#ECEAE5" />
            <stop offset="50%" stopColor="#E0DDD6" />
            <stop offset="75%" stopColor="#D5D0C6" />
            <stop offset="100%" stopColor="#BDB7A9" />
          </linearGradient>

          {/* Secondary mottled grunge overlay gradient */}
          <linearGradient id={`${idPrefix}-grungeGrad`} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#9C9588" stopOpacity="0.45" />
            <stop offset="40%" stopColor="#7E7668" stopOpacity="0.1" />
            <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#5A5449" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* MASKED CONTENT: Weathered Concrete Surface + Cracks strictly inside letterforms */}
        <g mask={`url(#${maskId})`}>
          {/* Base chalk/stone white surface */}
          <rect width="540" height="140" fill={`url(#${idPrefix}-baseGrad)`} />

          {/* Mottled grunge stone shading */}
          <rect width="540" height="140" fill={`url(#${idPrefix}-grungeGrad)`} />

          {/* Procedural stone noise texture layer */}
          <rect
            width="540"
            height="140"
            fill="#807A70"
            opacity="0.28"
            style={{ mixBlendMode: 'multiply' }}
            filter={`url(#${noiseFilterId})`}
          />

          {/* Plaster Wear & Scratches Blotches */}
          {/* S blotches */}
          <ellipse cx="65" cy="45" rx="35" ry="18" fill="#4A453C" opacity="0.15" />
          <ellipse cx="78" cy="95" rx="28" ry="14" fill="#3D3830" opacity="0.18" />
          {/* I blotches */}
          <ellipse cx="145" cy="65" rx="14" ry="40" fill="#4F4A40" opacity="0.16" />
          {/* G blotches */}
          <ellipse cx="230" cy="50" rx="32" ry="18" fill="#4A453C" opacity="0.16" />
          <ellipse cx="245" cy="90" rx="26" ry="22" fill="#3D3830" opacity="0.19" />
          {/* M blotches */}
          <ellipse cx="325" cy="65" rx="24" ry="32" fill="#443F36" opacity="0.17" />
          <ellipse cx="370" cy="75" rx="20" ry="28" fill="#38332B" opacity="0.18" />
          {/* A blotches */}
          <ellipse cx="445" cy="45" rx="26" ry="20" fill="#4A453C" opacity="0.16" />
          <ellipse cx="455" cy="95" rx="30" ry="18" fill="#3A352C" opacity="0.18" />

          {/* ========================================================================= */}
          {/* REALISTIC JAGGED CRACK FISSURES (Recreating the iconic Marvel ECHO style) */}
          {/* ========================================================================= */}

          {/* --- CRACKS ON 'S' --- */}
          {/* S: White highlight along fissure */}
          <path
            d="M 42 22 L 54 36 L 68 40 L 76 56 L 65 72 L 80 88 L 94 112"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="0.8"
            fill="none"
          />
          {/* S: Deep black crack */}
          <path
            d="M 41 21 L 53 35 L 67 39 L 75 55 L 64 71 L 79 87 L 93 111"
            stroke="#12100E"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* S: Branching fork */}
          <path
            d="M 67 39 L 85 34 L 98 42 M 64 71 L 46 80 L 42 94"
            stroke="#1A1815"
            strokeWidth="1.1"
            fill="none"
          />

          {/* --- CRACKS ON 'I' --- */}
          {/* I: White highlight */}
          <path
            d="M 148 18 L 144 42 L 152 68 L 146 95 L 149 116"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="0.8"
            fill="none"
          />
          {/* I: Main vertical fissure splitting through pillar */}
          <path
            d="M 147 17 L 143 41 L 151 67 L 145 94 L 148 115"
            stroke="#110F0D"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* I: Diagonal cross hairline fissures */}
          <path
            d="M 136 50 L 147 56 L 158 52 M 138 82 L 151 88"
            stroke="#201E1A"
            strokeWidth="0.9"
            fill="none"
          />

          {/* --- CRACKS ON 'G' --- */}
          {/* G: White highlight */}
          <path
            d="M 210 24 L 218 42 L 232 46 L 244 38 M 224 74 L 242 82 L 256 98 L 268 110"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="0.8"
            fill="none"
          />
          {/* G: Deep fractures */}
          <path
            d="M 209 23 L 217 41 L 231 45 L 243 37 M 223 73 L 241 81 L 255 97 L 267 109"
            stroke="#100E0C"
            strokeWidth="2.0"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* G: Secondary forks and edge chips */}
          <path
            d="M 217 41 L 202 54 L 200 68 M 241 81 L 246 68 L 258 66"
            stroke="#1C1A16"
            strokeWidth="1.2"
            fill="none"
          />

          {/* --- CRACKS ON 'M' --- */}
          {/* M: White highlights */}
          <path
            d="M 305 20 L 312 44 L 328 62 L 334 85 L 342 114 M 358 48 L 372 65 L 382 92"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="0.8"
            fill="none"
          />
          {/* M: Jagged fissures cutting through diagonal apex and pillars */}
          <path
            d="M 304 19 L 311 43 L 327 61 L 333 84 L 341 113 M 357 47 L 371 64 L 381 91"
            stroke="#100E0C"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* M: Branching crevices */}
          <path
            d="M 327 61 L 342 54 L 354 59 M 311 43 L 298 52"
            stroke="#1D1B17"
            strokeWidth="1.1"
            fill="none"
          />

          {/* --- CRACKS ON 'A' --- */}
          {/* A: White highlight */}
          <path
            d="M 454 22 L 446 48 L 438 72 L 432 98 L 426 116 M 458 56 L 474 74 L 484 104"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="0.8"
            fill="none"
          />
          {/* A: Splitting crack down both legs and across crossbar */}
          <path
            d="M 453 21 L 445 47 L 437 71 L 431 97 L 425 115 M 457 55 L 473 73 L 483 103"
            stroke="#0F0D0B"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* A: Horizontal crossbar crevice */}
          <path
            d="M 437 71 L 452 75 L 468 72"
            stroke="#151310"
            strokeWidth="1.4"
            fill="none"
          />

          {/* Gritty speckled dust flecks across surface */}
          <g fill="#1A1814" opacity="0.35">
            <circle cx="50" cy="30" r="1.1" />
            <circle cx="70" cy="100" r="1.4" />
            <circle cx="90" cy="50" r="0.9" />
            <circle cx="140" cy="35" r="1.3" />
            <circle cx="150" cy="80" r="1.0" />
            <circle cx="215" cy="65" r="1.5" />
            <circle cx="235" cy="30" r="1.0" />
            <circle cx="260" cy="85" r="1.2" />
            <circle cx="310" cy="70" r="1.4" />
            <circle cx="330" cy="35" r="0.9" />
            <circle cx="375" cy="85" r="1.3" />
            <circle cx="430" cy="55" r="1.2" />
            <circle cx="460" cy="30" r="1.5" />
            <circle cx="480" cy="90" r="1.0" />
          </g>

          {/* Subtle weathered edge vignette */}
          <rect
            width="540"
            height="140"
            fill="none"
            stroke="#3D3830"
            strokeWidth="2.5"
            opacity="0.3"
          />
        </g>
      </svg>
    </div>
  );
};
