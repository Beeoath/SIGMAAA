import React from 'react';

interface ModuleCoverArtProps {
  type: 'function-wave' | 'circle-tangent' | 'matrix-grid' | 'sigma-series' | 'logic-topology';
  accentColor?: string;
  isLocked?: boolean;
}

export const ModuleCoverArt: React.FC<ModuleCoverArtProps> = ({
  type,
  accentColor = '#10B981',
  isLocked = false,
}) => {
  const filterStyle = isLocked ? 'grayscale contrast-75 brightness-75' : '';

  return (
    <div className={`relative w-full aspect-square overflow-hidden rounded-md bg-[#161616] ${filterStyle}`}>
      {/* Background math subtle coordinate grid */}
      <div 
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Unique SVG Abstract Artwork according to mathematical domain */}
      {type === 'function-wave' && (
        <svg className="w-full h-full p-4" viewBox="0 0 200 200" fill="none">
          <defs>
            <linearGradient id="waveGrad" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
              <stop stopColor={accentColor} stopOpacity="0.8" />
              <stop offset="1" stopColor="#059669" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="70" stroke={accentColor} strokeOpacity="0.2" strokeWidth="1.5" strokeDasharray="4 4" />
          <path
            d="M 20,130 C 50,40 80,180 120,70 C 150,-10 170,160 185,100"
            stroke={accentColor}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Tangent line */}
          <line x1="70" y1="170" x2="160" y2="40" stroke="#E5E5E5" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="3 3" />
          <circle cx="120" cy="70" r="6" fill="#0D0D0D" stroke={accentColor} strokeWidth="2.5" />
          <text x="135" y="65" fill="#E5E5E5" fontSize="14" fontFamily="monospace" opacity="0.8">f(x)</text>
          <text x="35" y="165" fill={accentColor} fontSize="18" fontFamily="monospace" fontWeight="bold">f⁻¹(x)</text>
        </svg>
      )}

      {type === 'circle-tangent' && (
        <svg className="w-full h-full p-4" viewBox="0 0 200 200" fill="none">
          <circle cx="95" cy="105" r="55" stroke={accentColor} strokeWidth="3" fill="none" />
          <circle cx="95" cy="105" r="3" fill={accentColor} />
          {/* Tangent line at angle */}
          <line x1="25" y1="40" x2="175" y2="150" stroke="#FFFFFF" strokeOpacity="0.8" strokeWidth="2.5" />
          {/* Radius to tangent point */}
          <line x1="95" y1="105" x2="135" y2="70" stroke={accentColor} strokeWidth="1.5" strokeDasharray="4 2" />
          <circle cx="135" cy="70" r="5" fill="#0D0D0D" stroke={accentColor} strokeWidth="2" />
          {/* Right angle marker */}
          <path d="M 130,74 L 134,80 L 139,75" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
          <text x="75" y="125" fill="#A3A3A3" fontSize="13" fontFamily="monospace">P(a, b)</text>
          <text x="145" y="65" fill={accentColor} fontSize="14" fontFamily="monospace" fontWeight="bold">r · m</text>
        </svg>
      )}

      {type === 'matrix-grid' && (
        <svg className="w-full h-full p-4" viewBox="0 0 200 200" fill="none">
          {/* Matrix brackets */}
          <path d="M 45,40 L 30,40 L 30,160 L 45,160" stroke={accentColor} strokeWidth="3" strokeLinecap="round" />
          <path d="M 155,40 L 170,40 L 170,160 L 155,160" stroke={accentColor} strokeWidth="3" strokeLinecap="round" />
          {/* 2x2 grid elements */}
          <rect x="52" y="60" width="36" height="30" rx="4" fill="#222" stroke={accentColor} strokeOpacity="0.4" />
          <text x="64" y="80" fill="#E5E5E5" fontSize="15" fontFamily="monospace" fontWeight="bold">a</text>
          
          <rect x="112" y="60" width="36" height="30" rx="4" fill="#222" stroke={accentColor} strokeOpacity="0.4" />
          <text x="124" y="80" fill="#E5E5E5" fontSize="15" fontFamily="monospace" fontWeight="bold">b</text>

          <rect x="52" y="110" width="36" height="30" rx="4" fill="#222" stroke={accentColor} strokeOpacity="0.4" />
          <text x="64" y="130" fill="#E5E5E5" fontSize="15" fontFamily="monospace" fontWeight="bold">c</text>

          <rect x="112" y="110" width="36" height="30" rx="4" fill="#222" stroke={accentColor} strokeOpacity="0.4" />
          <text x="124" y="130" fill="#E5E5E5" fontSize="15" fontFamily="monospace" fontWeight="bold">d</text>

          {/* Transformation vector arrow */}
          <path d="M 85,150 Q 100,175 125,165" stroke="#FFFFFF" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
          <text x="60" y="185" fill={accentColor} fontSize="12" fontFamily="monospace">det(A) = ad - bc</text>
        </svg>
      )}

      {type === 'sigma-series' && (
        <svg className="w-full h-full p-4" viewBox="0 0 200 200" fill="none">
          {/* Prominent mathematical Sigma symbol */}
          <path
            d="M 145,50 L 55,50 L 105,100 L 55,150 L 145,150"
            stroke={accentColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Range bounds: n and k=1 */}
          <text x="95" y="40" fill="#E5E5E5" fontSize="18" fontFamily="monospace" fontWeight="bold">n</text>
          <text x="75" y="175" fill="#E5E5E5" fontSize="14" fontFamily="monospace">k = 1</text>
          {/* Progression terms preview */}
          <text x="125" y="110" fill="#A3A3A3" fontSize="20" fontFamily="monospace">aₖ</text>
          <circle cx="155" cy="100" r="3" fill={accentColor} opacity="0.8" />
          <circle cx="165" cy="100" r="3" fill={accentColor} opacity="0.6" />
          <circle cx="175" cy="100" r="3" fill={accentColor} opacity="0.4" />
        </svg>
      )}

      {type === 'logic-topology' && (
        <svg className="w-full h-full p-4" viewBox="0 0 200 200" fill="none">
          {/* Interconnected logic network */}
          <polygon points="100,35 165,75 165,145 100,180 35,145 35,75" stroke={accentColor} strokeWidth="2" strokeOpacity="0.4" />
          
          <line x1="100" y1="35" x2="100" y2="110" stroke="#FFFFFF" strokeOpacity="0.3" strokeWidth="1.5" />
          <line x1="165" y1="75" x2="100" y2="110" stroke="#FFFFFF" strokeOpacity="0.3" strokeWidth="1.5" />
          <line x1="165" y1="145" x2="100" y2="110" stroke="#FFFFFF" strokeOpacity="0.3" strokeWidth="1.5" />
          <line x1="100" y1="180" x2="100" y2="110" stroke="#FFFFFF" strokeOpacity="0.3" strokeWidth="1.5" />
          <line x1="35" y1="145" x2="100" y2="110" stroke="#FFFFFF" strokeOpacity="0.3" strokeWidth="1.5" />
          <line x1="35" y1="75" x2="100" y2="110" stroke="#FFFFFF" strokeOpacity="0.3" strokeWidth="1.5" />

          {/* Logic implication symbols */}
          <circle cx="100" cy="110" r="14" fill="#0D0D0D" stroke={accentColor} strokeWidth="2.5" />
          <text x="94" y="115" fill="#E5E5E5" fontSize="14" fontFamily="monospace" fontWeight="bold">⇒</text>

          <circle cx="100" cy="35" r="7" fill={accentColor} />
          <text x="97" y="39" fill="#0D0D0D" fontSize="10" fontWeight="bold">p</text>

          <circle cx="165" cy="145" r="7" fill={accentColor} />
          <text x="162" y="149" fill="#0D0D0D" fontSize="10" fontWeight="bold">q</text>

          <text x="35" y="180" fill="#A3A3A3" fontSize="11" fontFamily="monospace">~q ⇒ ~p</text>
        </svg>
      )}

      {/* Subtle diagonal sheen */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/5 pointer-events-none" />
    </div>
  );
};
