"use client"

import { useEffect, useState } from 'react';
import GameWindow from '@/ui/game/GameWindow'

export default function GamePage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simple loading state for initial render
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // If still loading, show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      <GameWindow />
    </div>
  );
}
