'use client';

interface LeaderboardModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  player: any;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  value: number;
  rank: number;
}

export default function LeaderboardModal({ isOpen, onCloseAction, player }: LeaderboardModalProps) {
  // If not open, don't render
  if (!isOpen) return null;

  // Mock data for leaderboards
  const powerRankings: LeaderboardEntry[] = [
    { id: '1', name: 'Player 1', value: 50000, rank: 1 },
    { id: '2', name: 'Player 2', value: 47500, rank: 2 },
    { id: '3', name: 'Player 3', value: 45200, rank: 3 },
    { id: '4', name: 'Player 4', value: 42000, rank: 4 },
    { id: '5', name: 'Player 5', value: 39800, rank: 5 },
    { id: '6', name: 'Player 6', value: 37500, rank: 6 },
    { id: '7', name: 'Player 7', value: 35200, rank: 7 },
    { id: '8', name: 'Player 8', value: 33000, rank: 8 },
    { id: '9', name: 'Player 9', value: 31500, rank: 9 },
    { id: '10', name: 'Player 10', value: 30000, rank: 10 },
  ];

  const killRankings: LeaderboardEntry[] = [
    { id: '4', name: 'Player 4', value: 1240, rank: 1 },
    { id: '5', name: 'Player 5', value: 980, rank: 2 },
    { id: '6', name: 'Player 6', value: 850, rank: 3 },
    { id: '7', name: 'Player 7', value: 720, rank: 4 },
    { id: '1', name: 'Player 1', value: 680, rank: 5 },
    { id: '8', name: 'Player 8', value: 550, rank: 6 },
    { id: '9', name: 'Player 9', value: 420, rank: 7 },
    { id: '2', name: 'Player 2', value: 380, rank: 8 },
    { id: '10', name: 'Player 10', value: 320, rank: 9 },
    { id: '3', name: 'Player 3', value: 290, rank: 10 },
  ];

  // Mock data for alliances
  const allianceRankings = [
    { id: '1', name: 'Alliance Alpha', members: 30, power: 1250000, rank: 1 },
    { id: '2', name: 'Iron Warriors', members: 28, power: 980000, rank: 2 },
    { id: '3', name: 'Frost Giants', members: 29, power: 920000, rank: 3 },
    { id: '4', name: 'Phoenix Flame', members: 25, power: 880000, rank: 4 },
    { id: '5', name: 'Shadow Hunters', members: 27, power: 750000, rank: 5 },
  ];

  // Get rank color
  const getRankColor = (rank: number): string => {
    switch (rank) {
      case 1: return 'text-yellow-500';
      case 2: return 'text-gray-400';
      case 3: return 'text-amber-700';
      default: return 'text-white';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-[100] flex items-center justify-center">
      <div className="bg-gray-900 w-full h-full overflow-auto flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 px-6 py-4 flex justify-between items-center border-b border-gray-700 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-white">Leaderboards</h2>
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
            {/* State Rankings */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-6">State 1 Rankings</h3>

              {/* Power Rankings */}
              <div className="bg-gray-800 rounded-lg p-6 mb-8">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-blue-400">Power Ranking</h4>
                </div>

                {/* Player's rank */}
                <div className="mb-4 pb-4 border-b border-gray-700">
                  <p className="text-gray-400 text-sm mb-2">
                    Your Rank: <span className="text-white">Not Available</span>
                  </p>
                  <p className="text-gray-400 text-sm">
                    Your Power: <span className="text-white">{player?.power?.toLocaleString() || 'Not Available'}</span>
                  </p>
                </div>

                {/* Rankings List */}
                <div className="space-y-2">
                  {powerRankings.map(entry => (
                    <div key={entry.id} className="flex items-center justify-between bg-gray-700 p-3 rounded">
                      <div className="flex items-center">
                        <span className={`w-8 text-center font-bold ${getRankColor(entry.rank)}`}>{entry.rank}</span>
                        <span className="ml-3 text-white">{entry.name}</span>
                      </div>
                      <span className="text-white">{entry.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Kill Rankings */}
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 rounded-full bg-red-700 flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-red-400">Kill Ranking</h4>
                </div>

                {/* Player's rank */}
                <div className="mb-4 pb-4 border-b border-gray-700">
                  <p className="text-gray-400 text-sm mb-2">
                    Your Rank: <span className="text-white">Not Available</span>
                  </p>
                  <p className="text-gray-400 text-sm">
                    Your Kills: <span className="text-white">{player?.kills?.toLocaleString() || 'Not Available'}</span>
                  </p>
                </div>

                {/* Rankings List */}
                <div className="space-y-2">
                  {killRankings.map(entry => (
                    <div key={entry.id} className="flex items-center justify-between bg-gray-700 p-3 rounded">
                      <div className="flex items-center">
                        <span className={`w-8 text-center font-bold ${getRankColor(entry.rank)}`}>{entry.rank}</span>
                        <span className="ml-3 text-white">{entry.name}</span>
                      </div>
                      <span className="text-white">{entry.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Alliance Rankings */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-6">Alliance Rankings</h3>

              {player?.alliance?.tag ? (
                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-green-400">Alliance Power Ranking</h4>
                  </div>

                  {/* Player's alliance rank */}
                  <div className="mb-4 pb-4 border-b border-gray-700">
                    <p className="text-gray-400 text-sm mb-2">
                      Your Alliance: <span className="text-white">{player.alliance.tag}</span>
                    </p>
                    <p className="text-gray-400 text-sm">
                      Alliance Rank: <span className="text-white">Not Available</span>
                    </p>
                  </div>

                  {/* Rankings List */}
                  <div className="space-y-2">
                    {allianceRankings.map(alliance => (
                      <div key={alliance.id} className="flex items-center justify-between bg-gray-700 p-3 rounded">
                        <div className="flex items-center">
                          <span className={`w-8 text-center font-bold ${getRankColor(alliance.rank)}`}>{alliance.rank}</span>
                          <div className="ml-3">
                            <span className="text-white block">{alliance.name}</span>
                            <span className="text-gray-400 text-xs">{alliance.members} members</span>
                          </div>
                        </div>
                        <span className="text-white">{alliance.power.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-800 rounded-lg p-6 text-center">
                  <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h4 className="text-lg font-medium text-white mb-2">Join an Alliance</h4>
                  <p className="text-gray-400 max-w-md mx-auto">
                    Join an alliance to view alliance rankings, participate in alliance events, and receive help from alliance members.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
