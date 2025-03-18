'use client'

import { useEffect, useState, useRef } from 'react'
import ChatPreview from '@/chat/ChatPreview';
import ChatWindow from '@/chat/ChatWindow';
import GameCanvas from './components/GameCanvas';
import TopBar from '@/ui/TopBar';
import { Game } from './components/game';

export default function GameWindow() {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isViewControlsOpen, setIsViewControlsOpen] = useState(false);
  const [coordinates, setCoordinates] = useState<{ x: number, y: number } | null>(null);
  const gameInstance = useRef<Game | null>(null);
  const gameInitialized = useRef(false);

  useEffect(() => {
    // Initialize the game when component mounts
    if (!gameInitialized.current) {
      gameInstance.current = new Game();
      // Expose game instance to window object
      (window as any).game = gameInstance.current;
      gameInitialized.current = true;

      // Initialize the world map when the container is available
      const initMap = () => {
        const container = document.getElementById('three-world-map-container');
        if (container && gameInstance.current) {
          gameInstance.current.initWorldMap(container);
        }
      };

      // Try to initialize immediately, but also set a small delay as fallback
      initMap();
      setTimeout(initMap, 500);
    }

    // Listen for coordinate updates
    const handleCoordinateUpdate = (event: CustomEvent<{ x: number, y: number }>) => {
      setCoordinates(event.detail);
    };

    window.addEventListener('mapCoordinateUpdate', handleCoordinateUpdate as EventListener);

    // Clean up game instance and event listener when component unmounts
    return () => {
      window.removeEventListener('mapCoordinateUpdate', handleCoordinateUpdate as EventListener);
      if (gameInstance.current) {
        gameInstance.current.stop();
        gameInstance.current = null;
        (window as any).game = null;
        gameInitialized.current = false;
      }
    };
  }, []);

  const handleOpenChat = () => {
    setIsChatOpen(true)
  }

  const handleCloseChat = () => {
    setIsChatOpen(false)
  }

  return (
    <div className="w-full h-full relative">
      {/* Top Bar */}
      <TopBar onViewControlsChange={setIsViewControlsOpen} />

      {/* Game Canvas for Three.js rendering */}
      <GameCanvas isViewControlsOpen={isViewControlsOpen} />

      {/* Coordinates Display */}
      {coordinates && (
        <div className="absolute bottom-38 left-1/2 transform -translate-x-1/2 bg-neutral-950/95 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <span className="font-mono">X: {coordinates.x.toFixed(0)}, Y: {coordinates.y.toFixed(0)}</span>
        </div>
      )}

      {/* Chat components */}
      {!isChatOpen && <ChatPreview onOpen={handleOpenChat} />}
      {isChatOpen && <ChatWindow onClose={handleCloseChat} />}
    </div>
  )
}
