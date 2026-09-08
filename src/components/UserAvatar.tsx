import React, { useState } from 'react';
import { AvatarConfig, UserProfile } from '../types';

interface UserAvatarProps {
  user?: UserProfile;
  avatarConfig?: AvatarConfig;
  photoUrl?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBadge?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  avatarConfig,
  photoUrl,
  name,
  size = 'md',
  className = '',
  showBadge = false,
}) => {
  const [imageError, setImageError] = useState(false);

  // Derive config & photoUrl with user fallback
  const config: AvatarConfig = avatarConfig || user?.avatarConfig || {
    glyph: 'Σ',
    frameShape: 'hexagon',
    accentColor: '#10B981',
    focusTag: 'Aljabar TKA',
  };

  const effectivePhotoUrl = !imageError ? (photoUrl || user?.photoUrl || config.photoUrl) : undefined;
  const effectiveName = name || user?.name || 'Siswa SIGMA';

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-xl',
    xl: 'w-20 h-20 text-3xl',
  }[size];

  const shapeClasses = {
    circle: 'rounded-full',
    hexagon: 'rounded-2xl',
    rhombus: 'rounded-xl',
    square: 'rounded-lg',
  }[config.frameShape || 'circle'];

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <div
        className={`relative overflow-hidden flex items-center justify-center font-mono font-bold transition-all ${sizeClasses} ${shapeClasses}`}
        style={{
          backgroundColor: effectivePhotoUrl ? '#121212' : `${config.accentColor}20`,
          color: config.accentColor,
          border: `1.5px solid ${config.accentColor}`,
          boxShadow: `0 0 12px ${config.accentColor}25`,
        }}
      >
        {effectivePhotoUrl ? (
          <img
            src={effectivePhotoUrl}
            alt={effectiveName}
            className="w-full h-full object-cover select-none"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="select-none leading-none">
            {config.glyph || 'Σ'}
          </span>
        )}
      </div>

      {showBadge && (
        <span
          className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-[#0D0D0D]"
          style={{ backgroundColor: config.accentColor }}
          title={config.focusTag}
        />
      )}
    </div>
  );
};
