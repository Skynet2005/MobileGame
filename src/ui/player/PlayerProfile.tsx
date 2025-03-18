'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { PlayerProfile as PlayerProfileType, PlayerSettings } from '@/types/player';

// Import modals with proper type definitions
import SkinsModal from './modals/SkinsModal';
import TroopsModal from './modals/TroopsModal';
import LeaderboardModal from './modals/LeaderboardModal';
import SettingsModal from './modals/SettingsModal';

// Types
interface PlayerProfileProps {
  isOpen?: boolean;
  onCloseAction: () => void;
}

// Extended version of PlayerProfileType with skins
interface PlayerData extends PlayerProfileType {
  settings?: Record<string, any>;
  skins?: {
    unlocked?: {
      city?: string[];
      avatarFrame?: string[];
    };
    city?: string;
    avatarFrame?: string;
  };
}

// Chief gear type
interface ChiefGear {
  name: string;
  level: number;
  quality: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  bonuses: { type: string; value: number }[];
  icon: string;
}

export default function PlayerProfile({ isOpen, onCloseAction }: PlayerProfileProps) {
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  // Modal states
  const [activeModal, setActiveModal] = useState<'skins' | 'troops' | 'leaderboard' | 'settings' | null>(null);

  // Fetch player data from the game
  useEffect(() => {
    // If isOpen is undefined or true, load player data
    if (isOpen !== false) {
      setIsLoading(true);

      // Delay to prevent UI jank
      const timeoutId = setTimeout(async () => {
        try {
          // Get account from localStorage
          const accountStr = localStorage.getItem('account');
          if (!accountStr) {
            console.error('No account found in localStorage');
            return;
          }
          const account = JSON.parse(accountStr);

          // First get the character ID
          const characterResponse = await fetch(`/api/characters/search?accountId=${account.id}`);
          if (!characterResponse.ok) {
            throw new Error('Failed to find character');
          }
          const characters = await characterResponse.json();
          if (!characters || characters.length === 0) {
            throw new Error('No character found');
          }
          const characterId = characters[0].id;

          // Fetch character data using character ID
          const response = await fetch(`/api/characters/${characterId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch character data');
          }

          const characterData = await response.json();

          // Format the data to match PlayerData interface
          const playerData: PlayerData = {
            id: characterData.id,
            name: characterData.name,
            power: characterData.profile?.power || 0,
            kills: characterData.profile?.kills || 0,
            furnaceLevel: characterData.profile?.furnaceLevel || 1,
            state: 1, // Always State 1
            alliance: {
              id: characterData.allianceId || null,
              tag: characterData.allianceTag || '',
            },
            world_location: {
              x: characterData.profile?.worldLocationX || 0,
              y: characterData.profile?.worldLocationY || 0,
            },
            troops: characterData.profile?.troops ? JSON.parse(characterData.profile.troops) : {
              infantry: { total: 0, level: 1, injured: 0 },
              lancer: { total: 0, level: 1, injured: 0 },
              marksman: { total: 0, level: 1, injured: 0 },
              marchQueue: 0
            },
            settings: {
              music: 50,
              soundEffects: 50,
              frameRate: 60,
              graphicsQuality: 'Medium',
              temperatureUnit: 'C',
              notifications: {}
            },
            skins: {
              unlocked: {
                city: ['default'],
                avatarFrame: ['default']
              },
              city: 'default',
              avatarFrame: 'default'
            }
          };

          setPlayer(playerData);
          setEditedName(playerData.name);
          console.log("Player data loaded:", playerData);
        } catch (error) {
          console.error('Error fetching player data:', error);
        } finally {
          setIsLoading(false);
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  // If isOpen is provided and false, don't render the component
  if (isOpen === false) {
    return null;
  }

  // Format player ID as 9 digits
  const formatPlayerId = (id: string): string => {
    // Extract numeric ID from character name if it starts with "lord"
    if (player?.name.startsWith('lord')) {
      return player.name.slice(4); // Remove "lord" prefix
    }
    // Fallback to 9 digit padding
    return id.padStart(9, '0');
  };

  // Handle name edit save
  const handleSaveName = async () => {
    if (!editedName.trim()) return;

    try {
      const response = await fetch('/api/characters/name', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          characterId: player?.id,
          newName: editedName.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update character name');
      }

      // Update local state
      if (player) {
        setPlayer({
          ...player,
          name: editedName.trim()
        });
      }

      setIsEditingName(false);
    } catch (error) {
      console.error('Error updating character name:', error);
      // You might want to show an error message to the user here
    }
  };

  // Placeholder chief gear data
  const chiefGear: Record<string, ChiefGear | null> = {
    helmet: null,
    coat: null,
    ring: null,
    watch: null,
    trousers: null,
    staff: null
  };

  // Get color based on gear quality
  const getQualityColor = (quality: string): string => {
    switch (quality) {
      case 'common': return 'text-gray-200';
      case 'uncommon': return 'text-green-400';
      case 'rare': return 'text-blue-400';
      case 'epic': return 'text-purple-400';
      case 'legendary': return 'text-yellow-400';
      default: return 'text-gray-200';
    }
  };

  // Handle settings update
  const handleUpdateSettings = async (updatedSettings: PlayerData['settings']) => {
    if (!player) return;

    try {
      const response = await fetch('/api/characters/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          characterId: player.id,
          settings: updatedSettings
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      setPlayer({ ...player, settings: updatedSettings });
    } catch (error) {
      console.error('Error updating settings:', error);
      // You might want to show an error message to the user here
    }
  };

  // Handle skins update
  const handleUpdateSkins = async (updatedSkins: PlayerData['skins']) => {
    if (!player) return;

    try {
      const response = await fetch('/api/characters/skins', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          characterId: player.id,
          skins: updatedSkins
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update skins');
      }

      setPlayer({ ...player, skins: updatedSkins });
    } catch (error) {
      console.error('Error updating skins:', error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center">
        <div className="bg-gray-900 w-full h-full overflow-auto flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-700 flex-shrink-0">
            <h2 className="text-xl font-bold text-white">Player Profile</h2>
            <button
              onClick={onCloseAction}
              className="text-gray-400 hover:text-white"
              aria-label="Close profile"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {isLoading ? (
            <div className="flex-grow flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : player ? (
            <div className="flex-grow flex flex-col overflow-auto">
              {/* 3D Chief Character and Gear Section */}
              <div className="relative bg-gray-800 p-4">
                <div className="flex flex-row items-center justify-between">
                  {/* Left Side Gear */}
                  <div className="flex flex-col space-y-3 w-1/4">
                    {/* Helmet */}
                    <div className="bg-gray-700 rounded-lg p-2 flex flex-col items-center relative">
                      <div className="text-xl mb-1">🪖</div>
                      <div className="text-xs text-center text-gray-300">Helmet</div>
                      {chiefGear.helmet && (
                        <div className={`absolute top-0 right-0 w-2 h-2 rounded-full ${getQualityColor(chiefGear.helmet.quality)}`}></div>
                      )}
                    </div>

                    {/* Coat */}
                    <div className="bg-gray-700 rounded-lg p-2 flex flex-col items-center relative">
                      <div className="text-xl mb-1">🧥</div>
                      <div className="text-xs text-center text-gray-300">Coat</div>
                      {chiefGear.coat && (
                        <div className={`absolute top-0 right-0 w-2 h-2 rounded-full ${getQualityColor(chiefGear.coat.quality)}`}></div>
                      )}
                    </div>

                    {/* Ring */}
                    <div className="bg-gray-700 rounded-lg p-2 flex flex-col items-center relative">
                      <div className="text-xl mb-1">💍</div>
                      <div className="text-xs text-center text-gray-300">Ring</div>
                      {chiefGear.ring && (
                        <div className={`absolute top-0 right-0 w-2 h-2 rounded-full ${getQualityColor(chiefGear.ring.quality)}`}></div>
                      )}
                    </div>
                  </div>

                  {/* Chief Character (Center) */}
                  <div className="flex-grow flex items-center justify-center mx-2 w-2/4">
                    <div className="relative w-40 h-52 bg-gray-700 rounded-lg flex items-center justify-center">
                      <div className="text-gray-400 text-center">
                        <svg className="w-12 h-12 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <p className="text-sm">3D Chief Character</p>
                        <p className="text-xs mt-1">Coming Soon</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Side Gear */}
                  <div className="flex flex-col space-y-3 w-1/4">
                    {/* Watch */}
                    <div className="bg-gray-700 rounded-lg p-2 flex flex-col items-center relative">
                      <div className="text-xl mb-1">⌚</div>
                      <div className="text-xs text-center text-gray-300">Watch</div>
                      {chiefGear.watch && (
                        <div className={`absolute top-0 right-0 w-2 h-2 rounded-full ${getQualityColor(chiefGear.watch.quality)}`}></div>
                      )}
                    </div>

                    {/* Trousers */}
                    <div className="bg-gray-700 rounded-lg p-2 flex flex-col items-center relative">
                      <div className="text-xl mb-1">👖</div>
                      <div className="text-xs text-center text-gray-300">Trousers</div>
                      {chiefGear.trousers && (
                        <div className={`absolute top-0 right-0 w-2 h-2 rounded-full ${getQualityColor(chiefGear.trousers.quality)}`}></div>
                      )}
                    </div>

                    {/* Staff */}
                    <div className="bg-gray-700 rounded-lg p-2 flex flex-col items-center relative">
                      <div className="text-xl mb-1">🪄</div>
                      <div className="text-xs text-center text-gray-300">Staff</div>
                      {chiefGear.staff && (
                        <div className={`absolute top-0 right-0 w-2 h-2 rounded-full ${getQualityColor(chiefGear.staff.quality)}`}></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Player Info */}
              <div className="p-4 bg-gray-800 border-t border-gray-700">
                <div className="flex items-start">
                  <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-blue-500 mr-4 flex-shrink-0">
                    <Image
                      src="/assets/avatar.png"
                      alt="Player Avatar"
                      width={80}
                      height={80}
                      priority
                    />
                  </div>

                  <div className="flex-grow">
                    {isEditingName ? (
                      <div className="flex mb-1">
                        <input
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 mr-2"
                          maxLength={20}
                        />
                        <button
                          onClick={handleSaveName}
                          className="bg-blue-600 text-white px-2 py-1 rounded text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingName(false);
                            setEditedName(player.name);
                          }}
                          className="bg-gray-600 text-white px-2 py-1 rounded ml-1 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center mb-1">
                        <h3 className="text-lg font-bold text-white mr-2">{player.name}</h3>
                        <button
                          onClick={() => setIsEditingName(true)}
                          className="text-gray-400 hover:text-white"
                          aria-label="Edit name"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-y-1 text-sm">
                      <div className="text-gray-400">ID:</div>
                      <div className="text-right text-white">{formatPlayerId(player.id.toString())}</div>

                      <div className="text-gray-400">Power:</div>
                      <div className="text-right text-white">{player.power.toLocaleString()}</div>

                      <div className="text-gray-400">Alliance:</div>
                      <div className="text-right text-white">{player.alliance.tag || 'None'}</div>

                      <div className="text-gray-400">State:</div>
                      <div className="text-right text-white">State {player.state}</div>

                      <div className="text-gray-400">Furnace Level:</div>
                      <div className="text-right text-white">{player.furnaceLevel}</div>

                      <div className="text-gray-400">Kills:</div>
                      <div className="text-right text-white">{player.kills.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Buttons */}
              <div className="grid grid-cols-4 gap-2 p-3">
                <button
                  className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-2 rounded-lg flex flex-col items-center justify-center"
                  onClick={() => setActiveModal('skins')}
                >
                  <span className="text-xl mb-1">🎨</span>
                  <span className="font-medium text-sm">Skins</span>
                </button>

                <button
                  className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-2 rounded-lg flex flex-col items-center justify-center"
                  onClick={() => setActiveModal('troops')}
                >
                  <span className="text-xl mb-1">⚔️</span>
                  <span className="font-medium text-sm">Troops</span>
                </button>

                <button
                  className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-2 rounded-lg flex flex-col items-center justify-center"
                  onClick={() => setActiveModal('leaderboard')}
                >
                  <span className="text-xl mb-1">🏆</span>
                  <span className="font-medium text-sm">Leaderboard</span>
                </button>

                <button
                  className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-2 rounded-lg flex flex-col items-center justify-center"
                  onClick={() => setActiveModal('settings')}
                >
                  <span className="text-xl mb-1">⚙️</span>
                  <span className="font-medium text-sm">Settings</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center p-8">
              <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-400 text-center">Could not load player data.<br />Please try again later.</p>
            </div>
          )}
        </div>
      </div>

      {/* Section Modals */}
      {activeModal === 'skins' && player && (
        <SkinsModal
          isOpen={true}
          onCloseAction={() => setActiveModal(null)}
          player={player}
          onUpdateSkins={handleUpdateSkins}
        />
      )}

      {activeModal === 'troops' && player && (
        <TroopsModal
          isOpen={true}
          onCloseAction={() => setActiveModal(null)}
          player={player}
        />
      )}

      {activeModal === 'leaderboard' && (
        <LeaderboardModal
          isOpen={true}
          onCloseAction={() => setActiveModal(null)}
          player={player}
        />
      )}

      {activeModal === 'settings' && player && (
        <SettingsModal
          isOpen={true}
          onCloseAction={() => setActiveModal(null)}
          player={player}
          onUpdateSettings={handleUpdateSettings}
        />
      )}
    </>
  );
}
