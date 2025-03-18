'use client';

import { useEffect, useRef } from 'react';
import Sidebar from '@/ui/SideBar';

interface GameCanvasProps {
  isViewControlsOpen: boolean;
}

export default function GameCanvas({ isViewControlsOpen }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('GameCanvas mounted - container ready for rendering');
  }, []);

  return (
    <div className="absolute inset-0 flex" style={{ top: '105px', bottom: '85px' }}>
      <div
        ref={containerRef}
        className="flex-1 relative"
        style={{
          overflow: 'hidden',
          backgroundColor: 'transparent'
        }}
        id="three-world-map-container"
      />
      <div
        className={`absolute right-0 top-0 h-full z-50 transition-opacity duration-200 ${isViewControlsOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
      >
        <Sidebar />
      </div>
    </div>
  );
}
