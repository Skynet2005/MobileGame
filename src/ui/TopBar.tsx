'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import PlayerProfile from './player/PlayerProfile';

// Custom hook to ensure game is initialized
function useGameInitialization() {
  const [isGameReady, setIsGameReady] = useState(false);
  const [is3DMode, setIs3DMode] = useState(false);

  useEffect(() => {
    // Function to check if game is initialized
    const checkGameInitialization = () => {
      if (window.game && window.game.worldMap) {
        console.log('Game is initialized and worldMap is available');
        setIsGameReady(true);
        setIs3DMode(!!window.game.worldMap.is3DMode);
        return true;
      }
    };

    // Set up a custom event listener for 3D mode changes
    const handleViewModeChange = (event: CustomEvent) => {
      console.log('View mode change event received:', event.detail);
      setIs3DMode(event.detail.is3DMode);
    };

    // Add event listener for view mode changes
    window.addEventListener('viewModeChanged', handleViewModeChange as EventListener);

    // Check immediately
    if (checkGameInitialization()) {
      console.log('Game initialized on first check');
    } else {
      console.log('Game not initialized yet, setting up interval');
      // Check every second until game is initialized
      const interval = setInterval(() => {
        if (checkGameInitialization()) {
          console.log('Game initialized during interval check');
          clearInterval(interval);
        }
      }, 1000);

      // Clean up interval
      return () => {
        clearInterval(interval);
        window.removeEventListener('viewModeChanged', handleViewModeChange as EventListener);
      };
    }

    return () => {
      window.removeEventListener('viewModeChanged', handleViewModeChange as EventListener);
    };
  }, []);

  return { isGameReady, is3DMode, setIs3DMode };
}

// Props interface for the TopBar component
interface TopBarProps {
  // If you have a parent controlling the profile modal, you can pass onProfileClick.
  // But we'll handle it locally in this example.
  onProfileClick?: () => void;
  onViewControlsChange?: (isOpen: boolean) => void;
}

export default function TopBar({ onProfileClick, onViewControlsChange }: TopBarProps) {
  const [currentDateTime, setCurrentDateTime] = useState('');
  const { isGameReady, is3DMode, setIs3DMode } = useGameInitialization();

  // For toggling the full PlayerProfile modal
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // For showing map view controls panel
  const [showViewControls, setShowViewControls] = useState(false);

  // Notify parent when showViewControls changes
  useEffect(() => {
    onViewControlsChange?.(showViewControls);
  }, [showViewControls, onViewControlsChange]);

  // Update the UTC time and date every second
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'UTC',
        timeZoneName: 'short'
      };
      setCurrentDateTime(now.toLocaleString('en-US', options));
    };

    // Update immediately and then every second
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleAvatarClick = () => {
    // If a parent provided a callback, call it. Otherwise, toggle our local modal.
    if (onProfileClick) {
      onProfileClick();
    } else {
      setIsProfileOpen(true);
    }
  };

  const handleViewModeToggle = () => {
    console.log('Toggle view mode clicked');
    if (!isGameReady) {
      console.log('Game not ready yet, cannot toggle view mode');
      return;
    }

    try {
      if (window.game && window.game.worldMap) {
        console.log('Calling toggleViewMode on worldMap');
        if (typeof window.game.worldMap.toggleViewMode === 'function') {
          // Create a scene reference - needed for the toggleViewMode function
          const scene = window.game.worldMap.scene;
          window.game.worldMap.toggleViewMode(scene);

          // Update local state - this should happen automatically via the event listener in useGameInitialization
          // but we'll set it directly here too for immediate UI feedback
          setIs3DMode(!!window.game.worldMap.is3DMode);
        } else {
          console.error('toggleViewMode is not a function on worldMap');
        }
      } else {
        console.error('Game object not available');
      }
    } catch (error) {
      console.error('Error in handleViewModeToggle:', error);
    }
  };

  const handleResetView = () => {
    console.log('Reset view clicked');
    if (!isGameReady) {
      console.log('Game not ready yet, cannot reset view');
      return;
    }

    try {
      if (window.game && window.game.worldMap) {
        console.log('Calling resetCamera on worldMap');
        if (typeof window.game.worldMap.resetCamera === 'function') {
          // Get the scene from the worldMap for the resetCamera function
          const scene = window.game.worldMap.scene;
          if (scene) {
            window.game.worldMap.resetCamera(scene);

            // Log the camera position after reset for debugging
            if (window.game.worldMap.camera) {
              console.log('Camera position after reset:', window.game.worldMap.camera.position);
            }
          } else {
            console.error('Scene not available for resetCamera');
          }
        } else {
          console.error('resetCamera is not a function on worldMap');
        }
      } else {
        console.error('Game or worldMap not available');
      }
    } catch (error) {
      console.error('Error in handleResetView:', error);
    }
  };

  const handleDirectionChange = (angle: number) => {
    console.log(`Direction change clicked: ${angle}`);
    if (!isGameReady) {
      console.log('Game not ready yet, cannot change direction');
      return;
    }

    try {
      if (window.game && window.game.worldMap) {
        console.log(`Calling setViewAngle(${angle}) on worldMap`);
        if (typeof window.game.worldMap.setViewAngle === 'function') {
          // Get the scene from the worldMap for the setViewAngle function
          const scene = window.game.worldMap.scene;
          if (scene) {
            // Make sure the target is at the center of the map - this prevents gray screen
            window.game.worldMap.controlsManager.controls.target.set(window.game.worldMap.width / 2, 0, window.game.worldMap.height / 2);

            // Set the view angle with the scene parameter
            window.game.worldMap.setViewAngle(angle);

            // Force a render to ensure the scene updates
            if (window.game.worldMap.renderer && window.game.worldMap.camera) {
              window.game.worldMap.renderer.render(scene, window.game.worldMap.camera);
            }

            // Log the camera position after setting angle for debugging
            if (window.game.worldMap.camera) {
              console.log('Camera position after setViewAngle:', window.game.worldMap.camera.position);
            }
          } else {
            console.error('Scene not available for setViewAngle');
          }
        } else {
          console.error('setViewAngle method not found on worldMap');
        }
      } else {
        console.error('Game or worldMap not available');
      }
    } catch (error) {
      console.error('Error in handleDirectionChange:', error);
    }
  };

  const handleGoToFurnace = () => {
    console.log('Go to furnace clicked');
    if (!isGameReady) {
      console.log('Game not ready yet, cannot go to furnace');
      return;
    }

    try {
      if (window.game && window.game.worldMap) {
        console.log('Calling centerOnPlayerFurnace on worldMap');
        if (typeof window.game.worldMap.centerOnPlayerFurnace === 'function') {
          window.game.worldMap.centerOnPlayerFurnace();
        } else {
          console.error('centerOnPlayerFurnace is not a function on worldMap');
        }
      } else {
        console.error('Game or worldMap not available');
      }
    } catch (error) {
      console.error('Error in handleGoToFurnace:', error);
    }
  };

  const handleGoToCastle = () => {
    console.log('Go to castle clicked');
    if (!isGameReady) {
      console.log('Game not ready yet, cannot go to castle');
      return;
    }

    try {
      if (window.game && window.game.worldMap) {
        console.log('Calling centerOnCastle on worldMap');
        if (typeof window.game.worldMap.centerOnCastle === 'function') {
          // Get the scene from the worldMap for the centerOnCastle function
          const scene = window.game.worldMap.scene;
          if (scene) {
            window.game.worldMap.centerOnCastle(scene);
          } else {
            console.error('Scene not available for centerOnCastle');
          }
        } else {
          console.error('centerOnCastle is not a function on worldMap');
        }
      } else {
        console.error('Game or worldMap not available');
      }
    } catch (error) {
      console.error('Error in handleGoToCastle:', error);
    }
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 w-screen bg-gray-800 border-b border-gray-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.2)] z-50">
        <div className="max-w-screen-xl mx-auto relative">
          {/* Avatar (left side) */}
          <div className="absolute left-2 top-3 z-10">
            <div
              className="w-24 h-24 rounded-lg overflow-hidden border border-white cursor-pointer"
              onClick={handleAvatarClick}
            >
              <Image
                src="/assets/avatar.png"
                alt="Player Avatar"
                width={100}
                height={100}
                priority
              />
            </div>
          </div>

          <div className="w-full">
            {/* Top row: UTC time, resources */}
            <div className="flex items-center justify-between py-3 px-2 md:px-4 ml-28">
              {/* UTC Time */}
              <div className="flex items-center text-gray-300">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                <span className="text-xs">{currentDateTime}</span>
              </div>

              {/* Center: Coal and Gems */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <span className="resource-icon coal-icon mr-2">🪨</span>
                  <span id="coal-count" className="text-white">
                    50
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="resource-icon gems-icon mr-2">💎</span>
                  <span id="gems-count" className="text-white">
                    25
                  </span>
                </div>
              </div>

              {/* Right: Toggle Map View Controls */}
              <div className="flex items-center space-x-3">
                <div
                  className={`cursor-pointer p-1 rounded hover:bg-gray-700 relative ${isGameReady ? '' : 'opacity-50'
                    }`}
                  onClick={
                    isGameReady
                      ? () => setShowViewControls(!showViewControls)
                      : () => console.log('Game not ready yet')
                  }
                  title={isGameReady ? 'Map View Controls' : 'Game still initializing...'}
                >
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>

                  {/* Map Controls Dropdown Panel */}
                  {showViewControls && isGameReady && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg overflow-hidden z-[200] border border-gray-700">
                      {/* Panel Header */}
                      <div className="px-4 py-2 bg-gray-700 text-white text-sm font-medium">
                        Map View Controls
                      </div>

                      {/* Control Buttons */}
                      <div className="p-2 grid grid-cols-3 gap-1">
                        {/* Go to Furnace Button */}
                        <button
                          className="col-span-3 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 px-2 rounded transition-colors duration-200"
                          onClick={handleGoToFurnace}
                          title="Center view on your furnace"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          My Furnace
                        </button>

                        {/* Rotate View Buttons */}
                        <button
                          className="flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium py-2 px-1 rounded transition-colors duration-200"
                          onClick={() => handleDirectionChange(270)}
                          title="Rotate view left (270°)"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                        </button>

                        <button
                          className="flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium py-2 px-1 rounded transition-colors duration-200"
                          onClick={handleGoToCastle}
                          title="Center on castle"
                        >
                          <span className="text-xl">🏰</span>
                        </button>

                        <button
                          className="flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium py-2 px-1 rounded transition-colors duration-200"
                          onClick={() => handleDirectionChange(90)}
                          title="Rotate view right (90°)"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>

                        {/* Reset View Button */}
                        <button
                          className="col-span-3 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium py-2 px-2 rounded transition-colors duration-200"
                          onClick={handleResetView}
                          title="Reset camera to default position"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Reset View
                        </button>

                        {/* View Switch Button */}
                        <button
                          className="col-span-3 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium py-2 px-2 rounded transition-colors duration-200"
                          onClick={handleViewModeToggle}
                          title="Toggle between 3D and top-down view"
                        >
                          {is3DMode ? (
                            <>
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                              </svg>
                              Switch to Top-Down View
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                              </svg>
                              Switch to 3D View
                            </>
                          )}
                        </button>
                      </div>

                      {/* Additional angle presets for more precise control */}
                      <div className="px-2 pb-2 grid grid-cols-4 gap-1">
                        <button
                          className="flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium py-1 px-1 rounded transition-colors duration-200"
                          onClick={() => handleDirectionChange(0)}
                          title="North view (0°)"
                        >
                          0°
                        </button>
                        <button
                          className="flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium py-1 px-1 rounded transition-colors duration-200"
                          onClick={() => handleDirectionChange(45)}
                          title="Northeast view (45°)"
                        >
                          45°
                        </button>
                        <button
                          className="flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium py-1 px-1 rounded transition-colors duration-200"
                          onClick={() => handleDirectionChange(135)}
                          title="Southeast view (135°)"
                        >
                          135°
                        </button>
                        <button
                          className="flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium py-1 px-1 rounded transition-colors duration-200"
                          onClick={() => handleDirectionChange(180)}
                          title="South view (180°)"
                        >
                          180°
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-gray-700"></div>

            {/* Bottom row: Power, VIP, Shopping Cart */}
            <div className="relative">
              <div className="flex items-center justify-between py-3 px-2 md:px-4 bg-gray-700/50 ml-28">
                {/* Power */}
                <div className="flex items-center text-gray-300">
                  <span className="text-xl font-bold">👊 10,000</span>
                </div>

                {/* Divider */}
                <div className="h-4 w-px bg-gray-700 mx-4"></div>

                {/* Temperature placeholder (invisible if you prefer using the fixed element below) */}
                <div className="invisible">
                  <span className="text-xs">Temperature placeholder</span>
                </div>

                {/* Divider */}
                <div className="h-4 w-px bg-gray-700 mx-4"></div>

                {/* VIP Level */}
                <div className="flex items-center text-gray-300">
                  <span className="text-lg font-bold text-yellow-500">VIP 1</span>
                </div>

                {/* Divider */}
                <div className="h-4 w-px bg-gray-700 mx-4"></div>

                {/* Shopping cart */}
                <svg
                  className="w-6 h-6 text-white cursor-pointer"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Temperature indicator (fixed, centered under top bar) */}
      <div className="fixed left-1/2 transform -translate-x-1/2 top-[3.5rem] text-gray-300 border-2 border-sky-400 bg-sky-200 rounded-xl px-4 py-4 z-50">
        <span className="mr-1">❄️</span>
        <span className="text-xl font-bold text-blue-900">-38.0°C</span>
      </div>

      {/* Player Profile Modal (Chief Profile) */}
      {isProfileOpen && (
        <PlayerProfile
          isOpen={isProfileOpen}
          onCloseAction={() => setIsProfileOpen(false)}
        />
      )}
    </>
  );
}
