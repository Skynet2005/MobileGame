"use client";

interface ChatFriendsPanelProps {
  activeTab: number;
  setActiveTab: (tab: number) => void;
  friends: any[];
  friendRequests: any[];
  blacklist: any[];
  addToBlacklist: (id: string) => void;
  removeFromBlacklist: (id: string) => void;
  acceptFriendRequest: (id: string) => Promise<void>;
  rejectFriendRequest: (id: string) => Promise<void>;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredFriends: any[];
}

export default function ChatFriendsPanel({
  activeTab,
  setActiveTab,
  friends,
  friendRequests,
  blacklist,
  addToBlacklist,
  removeFromBlacklist,
  acceptFriendRequest,
  rejectFriendRequest,
  searchTerm,
  setSearchTerm,
  filteredFriends,
}: ChatFriendsPanelProps) {
  return (
    <div className="bg-gray-800 border-b border-gray-700 p-4">
      <div className="mb-3">
        <h3 className="text-white font-medium mb-2">Friends Management</h3>
        <div className="flex space-x-2 mb-3">
          <button
            className={`${activeTab === 0 ? "bg-blue-600" : "bg-gray-700"} text-white text-xs px-3 py-1 rounded`}
            onClick={() => setActiveTab(0)}
            title="View friends list"
          >
            Friends ({friends.length})
          </button>
          <button
            className={`${activeTab === 1 ? "bg-blue-600" : "bg-gray-700"} text-white text-xs px-3 py-1 rounded`}
            onClick={() => setActiveTab(1)}
            title="Friend requests"
          >
            Requests ({friendRequests.length})
          </button>
          <button
            className={`${activeTab === 2 ? "bg-blue-600" : "bg-gray-700"} text-white text-xs px-3 py-1 rounded`}
            onClick={() => setActiveTab(2)}
            title="Blacklisted players"
          >
            Blacklist ({blacklist.length})
          </button>
        </div>
        <div className="mb-3">
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="space-y-2 max-h-36 overflow-y-auto">
          {activeTab === 0 && (
            <>
              {filteredFriends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${friend.isOnline ? "bg-green-500" : "bg-gray-500"}`}></div>
                    <span className="text-white text-sm">{friend.name}</span>
                    <span className="text-gray-400 text-xs ml-2">Lv.{friend.level}</span>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded"
                      title={`Message ${friend.name}`}
                      onClick={() => {
                        // Trigger direct chat – replace with your actual method
                      }}
                    >
                      Message
                    </button>
                    <button
                      className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded"
                      title={`Block ${friend.name}`}
                      onClick={() => addToBlacklist(friend.id)}
                    >
                      Block
                    </button>
                  </div>
                </div>
              ))}
              {filteredFriends.length === 0 && (
                <div className="text-center text-gray-400 py-2">
                  {searchTerm ? "No friends match your search" : "No friends found"}
                </div>
              )}
            </>
          )}
          {activeTab === 1 && (
            <>
              {friendRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                  <div>
                    <span className="text-white text-sm">{request.sender.name}</span>
                    <span className="text-gray-400 text-xs ml-2">Lv.{request.sender.level}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded"
                      title="Accept friend request"
                      onClick={() => acceptFriendRequest(request.id)}
                    >
                      Accept
                    </button>
                    <button
                      className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded"
                      title="Decline friend request"
                      onClick={() => rejectFriendRequest(request.id)}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
              {friendRequests.length === 0 && (
                <div className="text-center text-gray-400 py-2">
                  No pending friend requests
                </div>
              )}
            </>
          )}
          {activeTab === 2 && (
            <>
              {blacklist.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                  <div>
                    <span className="text-white text-sm">{entry.name}</span>
                    <span className="text-gray-400 text-xs ml-2">Lv.{entry.level}</span>
                  </div>
                  <button
                    className="bg-gray-600 hover:bg-gray-500 text-white text-xs px-2 py-1 rounded"
                    title="Unblock player"
                    onClick={() => removeFromBlacklist(entry.id)}
                  >
                    Unblock
                  </button>
                </div>
              ))}
              {blacklist.length === 0 && (
                <div className="text-center text-gray-400 py-2">
                  No blocked players
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
