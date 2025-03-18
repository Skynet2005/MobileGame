"use client";

import { Friend } from "@/types/player";

interface ChatGroupInviteProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filteredFriends: Friend[];
}

export default function ChatGroupInvite({
  searchTerm,
  setSearchTerm,
  filteredFriends,
}: ChatGroupInviteProps) {
  return (
    <div className="bg-gray-800 border-b border-gray-700 p-4">
      <h3 className="text-white font-medium mb-3">Invite to Group Chat</h3>
      <p className="text-gray-400 text-sm mb-3">Select friends to invite (max 5 per group)</p>
      <div className="mb-3">
        <input
          type="text"
          placeholder="Search friends..."
          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {filteredFriends.map((friend) => (
          <div key={friend.id} className="flex items-center justify-between bg-gray-700 p-2 rounded">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${friend.isOnline ? "bg-green-500" : "bg-gray-500"}`}></div>
              <span className="text-white text-sm">{friend.name}</span>
              <span className="text-gray-400 text-xs ml-2">Lv.{friend.level}</span>
            </div>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded"
              aria-label={`Invite ${friend.name} to group chat`}
            >
              Invite
            </button>
          </div>
        ))}
        {filteredFriends.length === 0 && (
          <div className="text-center text-gray-400 py-2">
            {searchTerm ? "No friends match your search" : "No friends found"}
          </div>
        )}
      </div>
    </div>
  );
}
