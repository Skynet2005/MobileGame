import { AllianceBannerProps } from '@/types/alliance';

const defaultBannerShape = {
  base: 'M0,0 L100,0 L100,100 L0,100 Z',
  inner: 'M5,5 L95,5 L95,95 L5,95 Z',
  border: 'M0,0 L100,0 L100,100 L0,100 Z M5,5 L95,5 L95,95 L5,95 Z'
};

const bannerShapes = {
  classic: {
    base: 'M0,0 L100,0 L100,100 L0,100 Z',
    inner: 'M5,5 L95,5 L95,95 L5,95 Z',
    border: 'M0,0 L100,0 L100,100 L0,100 Z M5,5 L95,5 L95,95 L5,95 Z'
  },
  smooth: {
    base: 'M0,0 C20,0 80,0 100,0 L100,100 C80,100 20,100 0,100 Z',
    inner: 'M5,5 C20,5 80,5 95,5 L95,95 C80,95 20,95 5,95 Z',
    border: 'M0,0 C20,0 80,0 100,0 L100,100 C80,100 20,100 0,100 Z M5,5 C20,5 80,5 95,5 L95,95 C80,95 20,95 5,95 Z'
  },
  'inverse-pointed': {
    base: 'M0,0 L100,0 L100,100 L50,80 L0,100 Z',
    inner: 'M5,5 L95,5 L95,95 L50,75 L5,95 Z',
    border: 'M0,0 L100,0 L100,100 L50,80 L0,100 Z M5,5 L95,5 L95,95 L50,75 L5,95 Z'
  },
  rounded: {
    base: 'M0,0 C20,0 80,0 100,0 L100,100 C80,100 20,100 0,100 C0,80 0,20 0,0',
    inner: 'M5,5 C20,5 80,5 95,5 L95,95 C80,95 20,95 5,95 C5,80 5,20 5,5',
    border: 'M0,0 C20,0 80,0 100,0 L100,100 C80,100 20,100 0,100 C0,80 0,20 0,0 M5,5 C20,5 80,5 95,5 L95,95 C80,95 20,95 5,95 C5,80 5,20 5,5'
  },
  'inverse-rounded': {
    base: 'M0,0 L100,0 L100,100 C80,100 20,100 0,100 C0,80 0,20 0,0',
    inner: 'M5,5 L95,5 L95,95 C80,95 20,95 5,95 C5,80 5,20 5,5',
    border: 'M0,0 L100,0 L100,100 C80,100 20,100 0,100 C0,80 0,20 0,0 M5,5 L95,5 L95,95 C80,95 20,95 5,95 C5,80 5,20 5,5'
  },
  flared: {
    base: 'M0,0 L100,0 L100,100 L80,80 L20,80 L0,100 Z',
    inner: 'M5,5 L95,5 L95,95 L75,75 L25,75 L5,95 Z',
    border: 'M0,0 L100,0 L100,100 L80,80 L20,80 L0,100 Z M5,5 L95,5 L95,95 L75,75 L25,75 L5,95 Z'
  }
};

export default function AllianceBanner({
  color = '#3B82F6',
  badge = 'shield',
  badgeIcon = '🛡️',
  trimColor = '#4A4A4A',
  innerColor = '#1E40AF',
  shape = 'classic',
  size = 'medium'
}: AllianceBannerProps) {
  const selectedShape = bannerShapes[shape] || defaultBannerShape;
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-32 h-32',
    large: 'w-48 h-64'
  };

  return (
    <div className={`${sizeClasses[size]} relative`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Base shape */}
        <path
          d={selectedShape.base}
          fill={color}
          stroke={trimColor}
          strokeWidth="2"
        />
        {/* Inner shape */}
        <path
          d={selectedShape.inner}
          fill={innerColor}
        />
        {/* Border */}
        <path
          d={selectedShape.border}
          fill="none"
          stroke={trimColor}
          strokeWidth="2"
        />
      </svg>
      {/* Badge icon */}
      <div className="absolute inset-0 flex items-center justify-center text-2xl">
        {badgeIcon}
      </div>
    </div>
  );
}
