import { useState, useEffect } from 'react';
import { Alliance, AllianceMember, AllianceRank } from '../../types/alliance';
import AllianceBanner from './AllianceBanner';
import AllianceBannerCustomizer from './AllianceBannerCustomizer';
import AllianceManagementModal from './AllianceManagementModal';
import { ALLIANCE_RANK_NAMES } from '../../types/alliance';

interface AllianceScreenProps {
  characterId: string;
  characterName: string;
  characterPower: number;
}

export default function AllianceScreen({ characterId, characterName, characterPower }: AllianceScreenProps) {
  const [alliance, setAlliance] = useState<Alliance | null>(null);
  const [isEditingBanner, setIsEditingBanner] = useState(false);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoadingAlliance, setIsLoadingAlliance] = useState(false);

  // Function to load alliance data
  const loadAllianceData = async () => {
    if (!characterId || isLoadingAlliance) return;

    try {
      console.log('Loading alliance data for character:', characterId);
      setIsLoadingAlliance(true);
      setError(null);

      // Get character data first
      const characterResponse = await fetch(`/api/characters/${characterId}`);
      if (!characterResponse.ok) {
        throw new Error('Failed to load character data');
      }
      const characterData = await characterResponse.json();
      console.log('Character data loaded:', characterData);

      if (!characterData.allianceId) {
        console.log('Character has no alliance');
        setAlliance(null);
        setLoading(false);
        return;
      }

      // Then load alliance data
      const allianceResponse = await fetch(`/api/alliances/${characterData.allianceId}`);
      if (!allianceResponse.ok) {
        throw new Error('Failed to load alliance data');
      }

      const allianceData = await allianceResponse.json();
      console.log('Alliance data loaded:', allianceData);

      setAlliance(allianceData);
      setLoading(false);
    } catch (err) {
      console.error('Error loading alliance data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load alliance data');
      setAlliance(null);
      setLoading(false);
    } finally {
      setIsLoadingAlliance(false);
    }
  };

  // Load alliance data when component mounts or characterId changes
  useEffect(() => {
    loadAllianceData();

    // Listen for alliance updates
    const handleAllianceUpdate = () => {
      if (!isLoadingAlliance && characterId) {
        console.log('Alliance update event received, reloading alliance data');
        loadAllianceData();
      }
    };

    window.addEventListener('allianceUpdated', handleAllianceUpdate);

    return () => {
      window.removeEventListener('allianceUpdated', handleAllianceUpdate);
    };
  }, [characterId]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-white">Loading alliance information...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-2">⚠️</div>
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  // Show no alliance state
  if (!alliance) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center">
          <div className="text-gray-400 text-xl mb-2">🛡️</div>
          <div className="text-white">You are not in an alliance</div>
        </div>
      </div>
    );
  }

  const currentMember = alliance.members.find(m => m.characterId === characterId);
  const isLeader = currentMember?.rank === 'R5';
  const isOfficer = currentMember?.rank === 'R4' || isLeader;

  // Update handlers to use loadAllianceData
  const handleBannerUpdate = async (banner: any) => {
    if (!alliance) return;
    try {
      const response = await fetch(`/api/alliances/${alliance.id}/banner`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ banner }),
      });

      if (!response.ok) {
        throw new Error('Failed to update alliance banner');
      }

      await loadAllianceData();
      setIsEditingBanner(false);
    } catch (err) {
      setError('Failed to update alliance banner');
      console.error(err);
    }
  };

  const handleSettingsUpdate = async (settings: any) => {
    if (!alliance) return;
    try {
      const response = await fetch(`/api/alliances/${alliance.id}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update alliance settings');
      }

      await loadAllianceData();
      setIsEditingSettings(false);
    } catch (err) {
      setError('Failed to update alliance settings');
      console.error(err);
    }
  };

  const handleDisbandAlliance = async () => {
    if (!alliance) return;
    try {
      const response = await fetch(`/api/alliances/${alliance.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to disband alliance');
      }

      setAlliance(null);
    } catch (err) {
      setError('Failed to disband alliance');
      console.error(err);
    }
  };

  const handleUpdateMemberRank = async (memberId: string, newRank: AllianceRank) => {
    if (!alliance) return;
    try {
      const response = await fetch(`/api/alliances/${alliance.id}/members/${memberId}/rank`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rank: newRank }),
      });

      if (!response.ok) {
        throw new Error('Failed to update member rank');
      }

      await loadAllianceData();
    } catch (err) {
      setError('Failed to update member rank');
      console.error(err);
    }
  };

  return (
    <div className="h-full bg-gray-900 text-white p-4 overflow-auto">
      {/* Alliance Header */}
      <div className="flex items-start space-x-4 mb-6">
        {/* Banner Preview */}
        <div className="relative">
          <div className="w-48 h-64">
            {alliance && alliance.banner && (
              <AllianceBanner
                color={alliance.banner.color}
                badge={alliance.banner.badge}
                badgeIcon={alliance.banner.badgeIcon}
                trimColor={alliance.banner.trimColor}
                innerColor={alliance.banner.innerColor}
                shape={alliance.banner.shape}
                size="large"
              />
            )}
          </div>
          {isLeader && (
            <button
              onClick={() => setIsEditingBanner(!isEditingBanner)}
              className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white py-1 text-sm hover:bg-opacity-70"
            >
              {isEditingBanner ? 'Cancel' : 'Edit Banner'}
            </button>
          )}
        </div>

        {/* Alliance Info */}
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-2xl font-bold">[{alliance.tag}]</span>
            <span className="text-2xl text-gray-300">{alliance.name}</span>
          </div>
          <div className="space-y-1 text-gray-300">
            <div>Alliance Leader: {alliance.leaderName}</div>
            <div>Power: {alliance.totalPower.toLocaleString()}</div>
            <div>Members: {alliance.members.length}/{alliance.maxMembers}</div>
            <div>Language: {alliance.preferredLanguage}</div>
          </div>
          <div className="flex space-x-2 mt-2">
            {isOfficer && (
              <button
                onClick={() => setIsEditingSettings(!isEditingSettings)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
              >
                {isEditingSettings ? 'Cancel' : 'Edit Settings'}
              </button>
            )}
            {isLeader && (
              <>
                <button
                  onClick={() => setShowManagementModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  Alliance Settings
                </button>
                <button
                  onClick={handleDisbandAlliance}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  Disband Alliance
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Banner Editor */}
      {isEditingBanner && (
        <div className="mb-6">
          <AllianceBannerCustomizer onBannerChange={handleBannerUpdate} />
        </div>
      )}

      {/* Settings Editor */}
      {isEditingSettings && (
        <div className="mb-6 bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Alliance Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Recruiting Setting</label>
              <select
                value={alliance.recruitingSetting}
                onChange={(e) => handleSettingsUpdate({ recruitingSetting: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
              >
                <option value="instant">Instant Join</option>
                <option value="application">Application Required</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Preferred Language</label>
              <select
                value={alliance.preferredLanguage}
                onChange={(e) => handleSettingsUpdate({ preferredLanguage: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
              >
                <option value="all">All Languages</option>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
                <option value="ru">Russian</option>
                <option value="zh">Chinese</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Alliance Members</h3>
        <div className="space-y-2">
          {alliance.members.map((member) => (
            <div
              key={member.characterId}
              className="flex items-center justify-between bg-gray-700 p-3 rounded-md"
            >
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-400">{ALLIANCE_RANK_NAMES[member.rank]}</span>
                <span className="font-medium">{member.characterName}</span>
                <span className="text-gray-400">{member.power.toLocaleString()} power</span>
              </div>
              {isOfficer && member.characterId !== characterId && (
                <select
                  value={member.rank}
                  onChange={(e) => handleUpdateMemberRank(member.characterId, e.target.value as AllianceRank)}
                  className="bg-gray-600 border border-gray-500 rounded-md px-2 py-1 text-sm"
                >
                  {Object.entries(ALLIANCE_RANK_NAMES).map(([rank, name]) => (
                    <option key={rank} value={rank}>{name}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Alliance Management Modal */}
      <AllianceManagementModal
        isOpen={showManagementModal}
        onClose={() => setShowManagementModal(false)}
        initialTab={0}
      />
    </div>
  );
}
