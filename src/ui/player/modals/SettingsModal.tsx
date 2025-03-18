'use client';

interface SettingsModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  player: any;
  onUpdateSettings: (settings: any) => void;
}

export default function SettingsModal({ isOpen, onCloseAction, player, onUpdateSettings }: SettingsModalProps) {
  // If not open, don't render
  if (!isOpen) return null;

  // Settings handlers
  const handleGraphicsChange = (value: string) => {
    if (window.game && window.game.updatePlayerSettings) {
      window.game.updatePlayerSettings({ graphicsQuality: value });

      // Update local state
      if (player && player.settings) {
        const updatedSettings = {
          ...player.settings,
          graphicsQuality: value
        };
        onUpdateSettings(updatedSettings);
      }
    }
  };

  const handleFrameRateChange = (value: number) => {
    if (window.game && window.game.updatePlayerSettings) {
      window.game.updatePlayerSettings({ frameRate: value });

      // Update local state
      if (player && player.settings) {
        const updatedSettings = {
          ...player.settings,
          frameRate: value
        };
        onUpdateSettings(updatedSettings);
      }
    }
  };

  const handleVolumeChange = (type: 'music' | 'soundEffects', value: number) => {
    if (window.game && window.game.updatePlayerSettings) {
      window.game.updatePlayerSettings({ [type]: value });

      // Update local state
      if (player && player.settings) {
        const updatedSettings = {
          ...player.settings,
          [type]: value
        };
        onUpdateSettings(updatedSettings);
      }
    }
  };

  const handleToggleSetting = (setting: string, value: boolean) => {
    if (window.game && window.game.updatePlayerSettings) {
      window.game.updatePlayerSettings({ [setting]: value });

      // Update local state
      if (player && player.settings) {
        const updatedSettings = {
          ...player.settings,
          [setting]: value
        };
        onUpdateSettings(updatedSettings);
      }
    }
  };

  const handleTemperatureUnitChange = (unit: 'C' | 'F') => {
    if (window.game && window.game.updatePlayerSettings) {
      window.game.updatePlayerSettings({ temperatureUnit: unit });

      // Update local state
      if (player && player.settings) {
        const updatedSettings = {
          ...player.settings,
          temperatureUnit: unit
        };
        onUpdateSettings(updatedSettings);
      }
    }
  };

  const handleNotificationChange = (notification: string, value: boolean) => {
    if (window.game && window.game.updatePlayerSettings) {
      window.game.updatePlayerSettings({
        notifications: { [notification]: value }
      });

      // Update local state
      if (player && player.settings) {
        const updatedSettings = {
          ...player.settings,
          notifications: {
            ...(player.settings.notifications || {}),
            [notification]: value
          }
        };
        onUpdateSettings(updatedSettings);
      }
    }
  };

  const handleScreenAdaptationChange = (value: number) => {
    if (window.game && window.game.updatePlayerSettings) {
      window.game.updatePlayerSettings({ screenAdaptation: value });

      // Update local state
      if (player && player.settings) {
        const updatedSettings = {
          ...player.settings,
          screenAdaptation: value
        };
        onUpdateSettings(updatedSettings);
      }
    }
  };

  const handleLanguageChange = (language: string) => {
    if (window.game && window.game.updatePlayerSettings) {
      window.game.updatePlayerSettings({ language });

      // Update local state
      if (player && player.settings) {
        const updatedSettings = {
          ...player.settings,
          language
        };
        onUpdateSettings(updatedSettings);
      }
    }
  };

  const handleDeleteCharacter = () => {
    if (confirm('Are you sure you want to delete this character? This action cannot be undone.')) {
      if (window.game && window.game.playerService && window.game.playerService.deletePlayer) {
        window.game.playerService.deletePlayer().then(() => {
          window.location.reload();
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-[100] flex items-center justify-center">
      <div className="bg-gray-900 w-full h-full overflow-auto flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 px-6 py-4 flex justify-between items-center border-b border-gray-700 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-white">Game Settings</h2>
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
          <div className="max-w-3xl mx-auto space-y-12">
            {/* Game Settings */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-6 pb-2 border-b border-gray-700">Audio Settings</h3>

              {/* Volume Controls */}
              <div className="space-y-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Music Volume: {player.settings?.music || 50}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={player.settings?.music || 50}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    onChange={(e) => handleVolumeChange('music', parseInt(e.target.value))}
                    aria-label="Music Volume"
                    title="Adjust music volume"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Sound Effects Volume: {player.settings?.soundEffects || 50}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={player.settings?.soundEffects || 50}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    onChange={(e) => handleVolumeChange('soundEffects', parseInt(e.target.value))}
                    aria-label="Sound Effects Volume"
                    title="Adjust sound effects volume"
                  />
                </div>
              </div>

              <h3 className="text-lg font-semibold text-white mb-6 pb-2 border-b border-gray-700">Graphics Settings</h3>

              {/* Graphics Settings */}
              <div className="space-y-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Frame Rate
                  </label>
                  <div className="flex space-x-4">
                    <button
                      className={`px-4 py-2 rounded-md text-sm ${player.settings?.frameRate === 30
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      onClick={() => handleFrameRateChange(30)}
                    >
                      30 FPS
                    </button>
                    <button
                      className={`px-4 py-2 rounded-md text-sm ${player.settings?.frameRate === 60
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      onClick={() => handleFrameRateChange(60)}
                    >
                      60 FPS
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Graphics Quality
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['Standard', 'Medium', 'High', 'Ultra'].map((quality) => (
                      <button
                        key={quality}
                        className={`px-4 py-2 rounded-md text-sm ${player.settings?.graphicsQuality === quality
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        onClick={() => handleGraphicsChange(quality)}
                      >
                        {quality}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-white mb-6 pb-2 border-b border-gray-700">Game Preferences</h3>

              {/* Other Settings */}
              <div className="space-y-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Screen Adaptation: {player.settings?.screenAdaptation || 0}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={player.settings?.screenAdaptation || 0}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    onChange={(e) => handleScreenAdaptationChange(parseInt(e.target.value))}
                    aria-label="Screen Adaptation"
                    title="Adjust screen adaptation"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <label className="text-sm font-medium text-gray-300">
                    Hide VIP status in chat
                  </label>
                  <div
                    className={`w-12 h-6 rounded-full p-1 cursor-pointer ${player.settings?.hideVIP ? 'bg-blue-600' : 'bg-gray-700'
                      }`}
                    onClick={() => handleToggleSetting('hideVIP', !player.settings?.hideVIP)}
                  >
                    <div
                      className={`h-4 w-4 rounded-full bg-white transform transition-transform ${player.settings?.hideVIP ? 'translate-x-6' : ''
                        }`}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <label className="text-sm font-medium text-gray-300">
                    Vibration
                  </label>
                  <div
                    className={`w-12 h-6 rounded-full p-1 cursor-pointer ${player.settings?.vibration ? 'bg-blue-600' : 'bg-gray-700'
                      }`}
                    onClick={() => handleToggleSetting('vibration', !player.settings?.vibration)}
                  >
                    <div
                      className={`h-4 w-4 rounded-full bg-white transform transition-transform ${player.settings?.vibration ? 'translate-x-6' : ''
                        }`}
                    ></div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Temperature Unit
                  </label>
                  <div className="flex space-x-4">
                    <button
                      className={`px-4 py-2 rounded-md text-sm ${player.settings?.temperatureUnit === 'C'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      onClick={() => handleTemperatureUnitChange('C')}
                    >
                      Celsius (°C)
                    </button>
                    <button
                      className={`px-4 py-2 rounded-md text-sm ${player.settings?.temperatureUnit === 'F'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      onClick={() => handleTemperatureUnitChange('F')}
                    >
                      Fahrenheit (°F)
                    </button>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-white mb-6 pb-2 border-b border-gray-700">Notifications</h3>

              {/* Notifications */}
              <div className="space-y-2 mb-8">
                {[
                  { id: 'scout', label: 'Scout Alerts' },
                  { id: 'wars', label: 'Wars & Attacks' },
                  { id: 'growth', label: 'Growth Updates' },
                  { id: 'resourceProduction', label: 'Resource Production' },
                  { id: 'storehouse', label: 'Storehouse Rewards' },
                  { id: 'friends', label: 'Friends & Messages' },
                  { id: 'allianceEvent', label: 'Alliance Events' },
                  { id: 'castleBattle', label: 'Castle Battle' },
                  { id: 'troopsReturning', label: 'Troops Returning' }
                ].map(notification => (
                  <div
                    key={notification.id}
                    className="flex items-center justify-between py-3 px-4 bg-gray-800 rounded-lg"
                  >
                    <label className="text-sm text-gray-300">
                      {notification.label}
                    </label>
                    <div
                      className={`w-12 h-6 rounded-full p-1 cursor-pointer ${player.settings?.notifications?.[notification.id]
                        ? 'bg-blue-600'
                        : 'bg-gray-700'
                        }`}
                      onClick={() => handleNotificationChange(
                        notification.id,
                        !player.settings?.notifications?.[notification.id]
                      )}
                    >
                      <div
                        className={`h-4 w-4 rounded-full bg-white transform transition-transform ${player.settings?.notifications?.[notification.id]
                          ? 'translate-x-6'
                          : ''
                          }`}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="text-lg font-semibold text-white mb-6 pb-2 border-b border-gray-700">Account & Language</h3>

              {/* Account & Language */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Language
                  </label>
                  <select
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-3 text-gray-200"
                    value={player.settings?.language || 'en'}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    aria-label="Language Selection"
                    title="Select your preferred language"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="it">Italiano</option>
                    <option value="pt">Português</option>
                    <option value="ru">Русский</option>
                    <option value="ja">日本語</option>
                    <option value="ko">한국어</option>
                    <option value="zh">中文</option>
                  </select>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-700">
                  <h4 className="text-red-500 font-medium mb-4">Danger Zone</h4>
                  <button
                    className="w-full px-4 py-3 bg-red-700 hover:bg-red-600 text-white rounded-md"
                    onClick={handleDeleteCharacter}
                  >
                    Delete Character
                  </button>
                  <p className="text-gray-400 text-xs mt-2">
                    Warning: This action cannot be undone. All progress, purchases, and data will be permanently lost.
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
