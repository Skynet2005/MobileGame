'use client';

import { useState, useEffect } from 'react';
import AllianceScreen from './alliance/AllianceScreen';
import AllianceJoinModal from './alliance/AllianceJoinModal';
import AllianceManagementModal from './alliance/AllianceManagementModal';

// Ensure TypeScript knows about the window.game property
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    game: any;
  }
}

type NavTab = {
  id: string;
  label: string;
  icon: string;
};

const navTabs: NavTab[] = [
  { id: 'exploration', label: 'Exploration', icon: '⚔️' },
  { id: 'heroes', label: 'Heroes', icon: '👑' },
  { id: 'backpack', label: 'Backpack', icon: '🎒' },
  { id: 'shop', label: 'Shop', icon: '🛒' },
  { id: 'alliance', label: 'Alliance', icon: '🛡️' },
  { id: 'world', label: 'World', icon: '🌍' },
];

interface BottomNavBarProps {
  onTabChange?: (tabId: string) => void;
  currentCharacter?: {
    id: string;
    name: string;
    allianceId?: string | null;
    allianceTag?: string | null;
    profile?: {
      power: number;
    };
  };
}

export default function BottomNavBar({ onTabChange, currentCharacter }: BottomNavBarProps) {
  const [activeTab, setActiveTab] = useState('exploration');
  const [showAllianceScreen, setShowAllianceScreen] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showAllianceManagementModal, setShowAllianceManagementModal] = useState(false);

  // Check if character has an alliance - ensure both ID and tag are non-null strings
  const hasAlliance = Boolean(currentCharacter?.allianceId && currentCharacter?.allianceTag);

  // Debug log for alliance state
  useEffect(() => {
    console.log('BottomBar - Current state:', {
      hasAlliance,
      allianceId: currentCharacter?.allianceId,
      allianceTag: currentCharacter?.allianceTag,
      showAllianceScreen,
      showJoinModal,
      activeTab,
      currentCharacter
    });
  }, [hasAlliance, currentCharacter, showAllianceScreen, showJoinModal, activeTab]);

  // Effect to handle alliance-related UI state
  useEffect(() => {
    if (!currentCharacter) {
      console.log('No character data available');
      setShowAllianceScreen(false);
      setShowJoinModal(false);
      setShowAllianceManagementModal(false);
      return;
    }

    if (activeTab === 'alliance') {
      console.log('Alliance tab selected, hasAlliance:', hasAlliance);
      if (hasAlliance) {
        setShowAllianceScreen(true);
        setShowJoinModal(false);
        setShowAllianceManagementModal(false);
      } else {
        setShowJoinModal(true);
        setShowAllianceScreen(false);
        setShowAllianceManagementModal(false);
      }
    } else {
      setShowAllianceScreen(false);
      setShowJoinModal(false);
      setShowAllianceManagementModal(false);
    }
  }, [activeTab, hasAlliance, currentCharacter]);

  const handleTabClick = (tabId: string) => {
    console.log('Tab clicked:', tabId);
    setActiveTab(tabId);

    if (onTabChange) {
      onTabChange(tabId);
    }

    if (tabId === 'alliance') {
      console.log('Alliance tab clicked, hasAlliance:', hasAlliance);
      if (hasAlliance) {
        setShowAllianceScreen(true);
        setShowJoinModal(false);
        setShowAllianceManagementModal(false);
      } else {
        setShowJoinModal(true);
        setShowAllianceScreen(false);
        setShowAllianceManagementModal(false);
      }
      return;
    }

    // Handle other game mode switches
    if (window.game) {
      try {
        switch (tabId) {
          case 'world':
            window.game.activateWorldView?.();
            break;
          case 'exploration':
            window.game.activateExplorationMode?.();
            break;
        }
      } catch (error) {
        console.error(`Error switching to ${tabId} mode:`, error);
      }
    }
  };

  const handleCreateAlliance = () => {
    setShowJoinModal(false);
    setShowAllianceManagementModal(true);
  };

  const handleJoinAlliance = () => {
    setShowJoinModal(false);
    setShowAllianceManagementModal(true);
  };

  const handleAllianceCreated = (alliance: any) => {
    console.log('Alliance created:', alliance);
    if (currentCharacter) {
      // Update the character's alliance info
      currentCharacter.allianceId = alliance.id;
      currentCharacter.allianceTag = alliance.tag;

      // Show the alliance screen
      setShowAllianceScreen(true);
      setShowAllianceManagementModal(false);
      setShowJoinModal(false);

      // Dispatch an event to notify other components
      window.dispatchEvent(new CustomEvent('allianceUpdated'));
    }
  };

  // Don't render alliance-related components if no character data
  if (!currentCharacter) {
    return (
      <div className="fixed bottom-0 left-0 w-full bg-gray-800 border-t border-gray-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.1)] z-[101] px-2 md:px-4">
        <div className="max-w-screen-xl mx-auto">
          <div className="grid grid-cols-6 divide-x divide-gray-700 py-2">
            {navTabs.map((tab) => (
              <div
                key={tab.id}
                className={`flex flex-col items-center justify-center py-2 px-1 md:px-3 cursor-pointer transition-colors duration-200 ${activeTab === tab.id
                    ? 'text-blue-400 border-t-2 border-blue-400'
                    : 'text-gray-400 hover:text-gray-200'
                  }`}
                onClick={() => handleTabClick(tab.id)}
              >
                <div className="text-lg md:text-xl text-center">{tab.icon}</div>
                <span className="text-xs mt-1 text-center">{tab.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 w-full bg-gray-800 border-t border-gray-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.1)] z-[101] px-2 md:px-4">
        <div className="max-w-screen-xl mx-auto">
          <div className="grid grid-cols-6 divide-x divide-gray-700 py-2">
            {navTabs.map((tab) => (
              <div
                key={tab.id}
                className={`flex flex-col items-center justify-center py-2 px-1 md:px-3 cursor-pointer transition-colors duration-200 ${activeTab === tab.id
                    ? 'text-blue-400 border-t-2 border-blue-400'
                    : 'text-gray-400 hover:text-gray-200'
                  }`}
                onClick={() => handleTabClick(tab.id)}
              >
                <div className="text-lg md:text-xl text-center">{tab.icon}</div>
                <span className="text-xs mt-1 text-center">{tab.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showAllianceScreen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center">
          <div className="bg-gray-900 w-full h-full overflow-auto flex flex-col pb-[85px]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-700 flex-shrink-0">
              <h2 className="text-xl font-bold text-white">Alliance</h2>
              <button
                onClick={() => setShowAllianceScreen(false)}
                className="text-gray-400 hover:text-white"
                aria-label="Close alliance screen"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <AllianceScreen
              characterId={currentCharacter.id}
              characterName={currentCharacter.name}
              characterPower={currentCharacter.profile?.power || 0}
            />
          </div>
        </div>
      )}

      <AllianceJoinModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onCreateAlliance={handleCreateAlliance}
        onJoinAlliance={handleJoinAlliance}
      />

      <AllianceManagementModal
        isOpen={showAllianceManagementModal}
        onClose={() => setShowAllianceManagementModal(false)}
        initialTab={0}
        onAllianceCreated={handleAllianceCreated}
      />
    </>
  );
}
