'use client';

interface TroopsModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  player: any;
}

export default function TroopsModal({ isOpen, onCloseAction, player }: TroopsModalProps) {
  // If not open, don't render
  if (!isOpen) return null;

  // Calculate total troops
  const totalTroops = (
    (player.troops.infantry?.total || 0) +
    (player.troops.lancer?.total || 0) +
    (player.troops.marksman?.total || 0)
  );

  // Calculate total injured
  const totalInjured = (
    (player.troops.infantry?.injured || 0) +
    (player.troops.lancer?.injured || 0) +
    (player.troops.marksman?.injured || 0)
  );

  // Troops training mock functions
  const handleTrainTroops = (troopType: string) => {
    console.log(`Training ${troopType} troops`);
    alert(`Training ${troopType} troops is not implemented yet.`);
  };

  const handleHealTroops = () => {
    console.log('Healing troops');
    alert('Healing troops is not implemented yet.');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-[100] flex items-center justify-center">
      <div className="bg-gray-900 w-full h-full overflow-auto flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 px-6 py-4 flex justify-between items-center border-b border-gray-700 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-white">Troop Management</h2>
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
          <div className="max-w-3xl mx-auto">
            {/* Troop Summary */}
            <div className="bg-gray-800 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Troop Summary</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <span className="text-gray-400 text-sm block mb-1">Total Troops</span>
                  <span className="text-2xl font-bold text-white">{totalTroops.toLocaleString()}</span>
                </div>

                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <span className="text-gray-400 text-sm block mb-1">March Queue</span>
                  <span className="text-2xl font-bold text-white">{player.troops.marchQueue.toLocaleString()}</span>
                </div>

                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <span className="text-gray-400 text-sm block mb-1">Injured</span>
                  <span className="text-2xl font-bold text-white">{totalInjured.toLocaleString()}</span>
                  {totalInjured > 0 && (
                    <button
                      className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white"
                      onClick={handleHealTroops}
                    >
                      Heal All
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white">Training Capacity:</span>
                  <span className="text-white">12/20</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>

            {/* Troop Types */}
            <div className="space-y-6">
              {/* Infantry */}
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <span className="text-3xl mr-3">⚔️</span>
                    <h3 className="text-lg font-semibold text-white">Infantry</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <span className="text-gray-400 text-sm block mb-1">Total</span>
                      <span className="text-xl font-bold text-white">{player.troops.infantry.total.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm block mb-1">Level</span>
                      <span className="text-xl font-bold text-white">{player.troops.infantry.level}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm block mb-1">Injured</span>
                      <span className="text-xl font-bold text-white">{player.troops.infantry.injured.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Stats</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-xs">Attack</span>
                          <span className="text-white text-xs">{10 * player.troops.infantry.level}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-xs">Defense</span>
                          <span className="text-white text-xs">{15 * player.troops.infantry.level}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-xs">Health</span>
                          <span className="text-white text-xs">{100 * player.troops.infantry.level}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-xs">March Speed</span>
                          <span className="text-white text-xs">85</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Type Advantages</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-xs">vs. Infantry</span>
                          <span className="text-white text-xs">Normal</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-xs">vs. Lancer</span>
                          <span className="text-red-400 text-xs">Weak</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-xs">vs. Marksman</span>
                          <span className="text-green-400 text-xs">Strong</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-3 bg-gray-700 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-gray-400">Cost to train: 10 food, 5 iron per troop</span>
                  </div>
                  <button
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                    onClick={() => handleTrainTroops('infantry')}
                  >
                    Train
                  </button>
                </div>
              </div>

              {/* Lancer */}
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <span className="text-3xl mr-3">🛡️</span>
                    <h3 className="text-lg font-semibold text-white">Lancer</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <span className="text-gray-400 text-sm block mb-1">Total</span>
                      <span className="text-xl font-bold text-white">{player.troops.lancer.total.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm block mb-1">Level</span>
                      <span className="text-xl font-bold text-white">{player.troops.lancer.level}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm block mb-1">Injured</span>
                      <span className="text-xl font-bold text-white">{player.troops.lancer.injured.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Stats</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-xs">Attack</span>
                          <span className="text-white text-xs">{12 * player.troops.lancer.level}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-xs">Defense</span>
                          <span className="text-white text-xs">{12 * player.troops.lancer.level}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-xs">Health</span>
                          <span className="text-white text-xs">{120 * player.troops.lancer.level}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-xs">March Speed</span>
                          <span className="text-white text-xs">120</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Type Advantages</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-xs">vs. Infantry</span>
                          <span className="text-green-400 text-xs">Strong</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-xs">vs. Lancer</span>
                          <span className="text-white text-xs">Normal</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-xs">vs. Marksman</span>
                          <span className="text-red-400 text-xs">Weak</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-3 bg-gray-700 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-gray-400">Cost to train: 15 food, 10 iron per troop</span>
                  </div>
                  <button
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                    onClick={() => handleTrainTroops('lancer')}
                  >
                    Train
                  </button>
                </div>
              </div>

              {/* Marksman */}
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <span className="text-3xl mr-3">🏹</span>
                    <h3 className="text-lg font-semibold text-white">Marksman</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <span className="text-gray-400 text-sm block mb-1">Total</span>
                      <span className="text-xl font-bold text-white">{player.troops.marksman.total.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm block mb-1">Level</span>
                      <span className="text-xl font-bold text-white">{player.troops.marksman.level}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm block mb-1">Injured</span>
                      <span className="text-xl font-bold text-white">{player.troops.marksman.injured.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Stats</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-xs">Attack</span>
                          <span className="text-white text-xs">{15 * player.troops.marksman.level}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-xs">Defense</span>
                          <span className="text-white text-xs">{8 * player.troops.marksman.level}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-xs">Health</span>
                          <span className="text-white text-xs">{90 * player.troops.marksman.level}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-xs">March Speed</span>
                          <span className="text-white text-xs">100</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Type Advantages</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-xs">vs. Infantry</span>
                          <span className="text-red-400 text-xs">Weak</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-xs">vs. Lancer</span>
                          <span className="text-green-400 text-xs">Strong</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-xs">vs. Marksman</span>
                          <span className="text-white text-xs">Normal</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-3 bg-gray-700 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-gray-400">Cost to train: 12 food, 8 iron, 5 wood per troop</span>
                  </div>
                  <button
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                    onClick={() => handleTrainTroops('marksman')}
                  >
                    Train
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
