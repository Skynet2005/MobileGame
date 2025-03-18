import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import AllianceBannerCustomizer from './AllianceBannerCustomizer';
import AllianceBanner from './AllianceBanner';

interface Alliance {
  id: string;
  tag: string;
  name: string;
  language: string;
  memberCount: number;
  maxMembers: number;
  power: number;
  recruitingSetting: 'instant' | 'application';
  banner: {
    color: string;
    badge: string;
    badgeIcon: string;
    trimColor: string;
    innerColor: string;
    shape: 'classic' | 'smooth' | 'inverse-pointed' | 'rounded' | 'inverse-rounded' | 'flared';
  };
}

interface AllianceManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: number;
  onAllianceCreated?: (alliance: any) => void;
}

export default function AllianceManagementModal({
  isOpen,
  onClose,
  initialTab = 0,
  onAllianceCreated,
}: AllianceManagementModalProps) {
  const [selectedTab, setSelectedTab] = useState(initialTab);
  const [allianceName, setAllianceName] = useState('');
  const [allianceDecree, setAllianceDecree] = useState('');
  const [recruitingSetting, setRecruitingSetting] = useState<'instant' | 'application'>('instant');
  const [preferredLanguage, setPreferredLanguage] = useState('all');
  const [banner, setBanner] = useState({ color: '#3B82F6', badge: 'shield' });
  const [allianceTag, setAllianceTag] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [filteredAlliances, setFilteredAlliances] = useState<Alliance[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update selectedTab when initialTab changes
  useEffect(() => {
    setSelectedTab(initialTab);
  }, [initialTab]);

  // Filter alliances based on search term
  useEffect(() => {
    const filtered = alliances.filter(alliance =>
      alliance.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alliance.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAlliances(filtered);
  }, [searchTerm, alliances]);

  // Fetch alliances when the Join Alliance tab is selected
  useEffect(() => {
    if (selectedTab === 1) {
      // TODO: Replace with actual API call
      const mockAlliances: Alliance[] = [
        {
          id: '1',
          tag: 'ABC',
          name: 'Alpha Beta Charlie',
          language: 'English',
          memberCount: 45,
          maxMembers: 100,
          power: 15000,
          recruitingSetting: 'instant',
          banner: {
            color: '#3B82F6',
            badge: 'shield',
            badgeIcon: '🛡️',
            trimColor: '#4A4A4A',
            innerColor: '#1E40AF',
            shape: 'classic'
          }
        },
        // Add more mock alliances as needed
      ];
      setAlliances(mockAlliances);
      setFilteredAlliances(mockAlliances);
    }
  }, [selectedTab]);

  const languages = [
    { value: 'all', label: 'All Languages' },
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'ru', label: 'Russian' },
    { value: 'zh', label: 'Chinese' },
    { value: 'ja', label: 'Japanese' },
    { value: 'ko', label: 'Korean' },
  ];

  const handleCreateAlliance = async () => {
    if (!allianceName || !allianceTag) {
      setError('Alliance name and tag are required');
      return;
    }

    if (allianceTag.length < 3 || allianceTag.length > 4) {
      setError('Alliance tag must be 3-4 characters');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      // Get the current character ID from localStorage
      const accountStr = localStorage.getItem('account');
      if (!accountStr) {
        throw new Error('No account found');
      }
      const account = JSON.parse(accountStr);

      // Get character ID
      const characterResponse = await fetch(`/api/characters/search?accountId=${account.id}`);
      if (!characterResponse.ok) {
        throw new Error('Failed to find character');
      }
      const characters = await characterResponse.json();
      if (!characters || characters.length === 0) {
        throw new Error('No character found');
      }
      const characterId = characters[0].id;

      // Create the alliance using the dedicated create endpoint
      const response = await fetch('/api/alliances/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: allianceName,
          tag: allianceTag.toUpperCase(),
          characterId,
          decree: allianceDecree,
          recruitingSetting,
          preferredLanguage,
          banner
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create alliance');
      }

      const data = await response.json();
      console.log('Alliance created successfully:', data);

      // Close the modal first
      onClose();

      // Notify parent component about the alliance creation
      if (onAllianceCreated) {
        onAllianceCreated(data);
      }

      // Dispatch an event to notify other components
      window.dispatchEvent(new CustomEvent('allianceCreated', { detail: data }));

      // Reload the page to ensure all components are updated with the new alliance
      window.location.reload();
    } catch (err) {
      console.error('Error creating alliance:', err);
      setError(err instanceof Error ? err.message : 'Failed to create alliance');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinAlliance = async (allianceId: string) => {
    // TODO: Implement alliance joining logic
    console.log('Joining alliance:', allianceId);
  };

  const handleApplyToAlliance = async (allianceId: string) => {
    // TODO: Implement alliance application logic
    console.log('Applying to alliance:', allianceId);
  };

  // If isOpen is provided and false, don't render the component
  if (isOpen === false) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center">
      <div className="bg-gray-900 w-full h-full overflow-auto flex flex-col pb-[85px]">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-white">Alliance Management</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            aria-label="Close alliance management"
          >
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700 w-full">
          <button
            className={`flex-1 px-4 py-3 text-sm font-medium text-center ${selectedTab === 0 ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-300'}`}
            onClick={() => setSelectedTab(0)}
          >
            Create Alliance
          </button>
          <div className="border-r border-gray-700 h-6 self-center"></div>
          <button
            className={`flex-1 px-4 py-3 text-sm font-medium text-center ${selectedTab === 1 ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-300'}`}
            onClick={() => setSelectedTab(1)}
          >
            Join Alliance
          </button>
          <div className="border-r border-gray-700 h-6 self-center"></div>
          <button
            className={`flex-1 px-4 py-3 text-sm font-medium text-center ${selectedTab === 2 ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-300'}`}
            onClick={() => setSelectedTab(2)}
          >
            Invites/Requests
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-grow overflow-auto p-4">
          {selectedTab === 0 && (
            <div className="space-y-4">
              {/* Alliance Banner Customizer */}
              <AllianceBannerCustomizer onBannerChange={setBanner} />

              {/* Alliance Tag and Name Preview */}
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className="text-2xl font-bold text-white">
                  [{allianceTag || 'TAG'}]
                </div>
                <div className="text-2xl text-gray-300">
                  {allianceName || '[NAME]'}
                </div>
              </div>

              {/* Alliance Tag */}
              <div>
                <label htmlFor="allianceTag" className="block text-sm font-medium text-gray-300">
                  Alliance Tag
                </label>
                <input
                  type="text"
                  id="allianceTag"
                  maxLength={3}
                  value={allianceTag}
                  onChange={(e) => setAllianceTag(e.target.value.slice(0, 3))}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter 3-character alliance tag"
                />
              </div>

              {/* Alliance Name */}
              <div>
                <label htmlFor="allianceName" className="block text-sm font-medium text-gray-300">
                  Alliance Name
                </label>
                <input
                  type="text"
                  id="allianceName"
                  maxLength={16}
                  value={allianceName}
                  onChange={(e) => setAllianceName(e.target.value)}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter alliance name (max 16 characters)"
                />
              </div>

              {/* Alliance Decree */}
              <div>
                <label htmlFor="allianceDecree" className="block text-sm font-medium text-gray-300">
                  Alliance Decree
                </label>
                <textarea
                  id="allianceDecree"
                  value={allianceDecree}
                  onChange={(e) => setAllianceDecree(e.target.value)}
                  rows={4}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter alliance decree"
                />
              </div>

              {/* Recruiting Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Recruiting Settings
                </label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="instant"
                      checked={recruitingSetting === 'instant'}
                      onChange={(e) => setRecruitingSetting(e.target.value as 'instant' | 'application')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 bg-gray-700"
                    />
                    <span className="ml-2 text-sm text-gray-300">Instant Join</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="application"
                      checked={recruitingSetting === 'application'}
                      onChange={(e) => setRecruitingSetting(e.target.value as 'instant' | 'application')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 bg-gray-700"
                    />
                    <span className="ml-2 text-sm text-gray-300">Application Required</span>
                  </label>
                </div>
              </div>

              {/* Preferred Language */}
              <div>
                <label htmlFor="preferredLanguage" className="block text-sm font-medium text-gray-300">
                  Preferred Language
                </label>
                <select
                  id="preferredLanguage"
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  {languages.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-center text-gray-400 text-sm">
                Reach Furnace Lv. 10 to build for free
              </div>

              {/* Error message */}
              {error && (
                <div className="text-red-500 text-sm mt-2 text-center">
                  {error}
                </div>
              )}

              <div className="flex justify-center w-full">
                <button
                  type="button"
                  onClick={handleCreateAlliance}
                  disabled={isCreating}
                  className={`inline-flex justify-center rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 ${isCreating ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  style={{ maxWidth: '200px' }}
                >
                  {isCreating ? 'Creating...' : 'Create Alliance 💎 400'}
                </button>
              </div>
            </div>
          )}

          {selectedTab === 1 && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by Alliance Tag or Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <svg
                  className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              {/* Alliance List */}
              <div className="space-y-2">
                {filteredAlliances.map((alliance) => (
                  <div
                    key={alliance.id}
                    className="flex items-center justify-between bg-gray-800 rounded-lg p-3 hover:bg-gray-750 transition-colors"
                  >
                    {/* Alliance Banner Preview */}
                    <div className="w-16 h-16 flex-shrink-0">
                      <AllianceBanner
                        color={alliance.banner.color}
                        badge={alliance.banner.badge}
                        badgeIcon={alliance.banner.badgeIcon}
                        trimColor={alliance.banner.trimColor}
                        innerColor={alliance.banner.innerColor}
                        shape={alliance.banner.shape}
                        size="small"
                      />
                    </div>

                    {/* Alliance Info */}
                    <div className="flex-grow ml-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-white">[{alliance.tag}]</span>
                        <span className="text-lg text-gray-300">{alliance.name}</span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
                        <span>{alliance.language}</span>
                        <span>{alliance.memberCount}/{alliance.maxMembers} members</span>
                        <span className="flex items-center">
                          <span className="mr-1">👊</span>
                          {alliance.power.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Join/Apply Button */}
                    <div className="ml-4">
                      {alliance.recruitingSetting === 'instant' ? (
                        <button
                          onClick={() => handleJoinAlliance(alliance.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
                        >
                          Join
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApplyToAlliance(alliance.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                        >
                          Apply
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {filteredAlliances.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    {searchTerm ? 'No alliances found matching your search' : 'No alliances available'}
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedTab === 2 && (
            <div className="text-center text-gray-300 py-8">
              Invites/Requests content coming soon...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
