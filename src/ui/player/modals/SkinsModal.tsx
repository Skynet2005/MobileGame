'use client';

import { useState } from 'react';

interface SkinsModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  player: any;
  onUpdateSkins: (skins: any) => void;
}

export default function SkinsModal({ isOpen, onCloseAction, player, onUpdateSkins }: SkinsModalProps) {
  // If not open, don't render
  if (!isOpen) return null;

  const handleSkinChange = (type: string, skin: string) => {
    if (window.game && window.game.updatePlayerSkins) {
      window.game.updatePlayerSkins({ [type]: skin });

      // Update local state
      if (player && player.skins) {
        const updatedSkins = {
          ...player.skins,
          [type]: skin
        };
        onUpdateSkins(updatedSkins);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-[100] flex items-center justify-center">
      <div className="bg-gray-900 w-full h-full overflow-auto flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 px-6 py-4 flex justify-between items-center border-b border-gray-700 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-white">Skins & Customization</h2>
          <button
            onClick={onCloseAction}
            className="text-gray-400 hover:text-white"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-grow overflow-auto">
          <div className="max-w-3xl mx-auto space-y-10">
            {/* City Skin */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">City Skin</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {player.skins?.unlocked?.city?.map((skin: string) => (
                  <div
                    key={skin}
                    className={`
                      border rounded-md p-3 cursor-pointer
                      ${player.skins.city === skin
                        ? 'border-blue-500 bg-blue-900 bg-opacity-50'
                        : 'border-gray-700 hover:border-gray-500'}
                    `}
                    onClick={() => handleSkinChange('city', skin)}
                  >
                    <div className="bg-gray-700 h-32 rounded-md mb-2 flex items-center justify-center">
                      {skin === 'default' ? (
                        <span className="text-5xl">🏰</span>
                      ) : skin === 'winter' ? (
                        <span className="text-5xl">❄️</span>
                      ) : (
                        <span className="text-5xl">🏙️</span>
                      )}
                    </div>
                    <div className="text-center text-sm text-white capitalize">{skin}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Avatar Frame */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">Avatar Frame</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {player.skins?.unlocked?.avatarFrame?.map((skin: string) => (
                  <div
                    key={skin}
                    className={`
                      border rounded-md p-3 cursor-pointer
                      ${player.skins.avatarFrame === skin
                        ? 'border-blue-500 bg-blue-900 bg-opacity-50'
                        : 'border-gray-700 hover:border-gray-500'}
                    `}
                    onClick={() => handleSkinChange('avatarFrame', skin)}
                  >
                    <div className="bg-gray-700 h-32 rounded-md mb-2 flex items-center justify-center">
                      {skin === 'default' ? (
                        <span className="text-5xl">⭕</span>
                      ) : skin === 'gold' ? (
                        <span className="text-5xl">🔶</span>
                      ) : (
                        <span className="text-5xl">🔷</span>
                      )}
                    </div>
                    <div className="text-center text-sm text-white capitalize">{skin}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coming Soon */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">Other Skins</h3>
              <div className="bg-gray-800 p-6 rounded-md">
                <div className="flex flex-col items-center text-center">
                  <svg className="w-16 h-16 text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <h4 className="text-lg font-medium text-white mb-2">More Skins Coming Soon</h4>
                  <p className="text-gray-400 max-w-md">
                    Additional skins for troops, buildings, and special effects will be available in future updates.
                    Stay tuned for exciting new customization options!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
