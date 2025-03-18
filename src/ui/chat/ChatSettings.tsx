"use client";

export default function ChatSettings() {
  return (
    <div className="bg-gray-800 border-b border-gray-700 p-4">
      <h3 className="text-white font-medium mb-3">Chat Settings</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="min-level" className="block text-sm text-gray-400 mb-1">
            Minimum player level for friend requests
          </label>
          <div className="flex items-center">
            <input
              id="min-level"
              type="range"
              min="1"
              max="30"
              defaultValue="5"
              className="w-full mr-2"
              aria-label="Minimum player level for friend requests"
            />
            <span className="text-white text-sm w-8">5</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-400">Allow private messages from strangers</label>
          <button
            className="px-3 py-1 rounded text-xs font-medium bg-green-600 text-white"
            aria-label="Allow private messages from strangers"
            title="Toggle private messages from strangers"
          >
            On
          </button>
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-400">Show online status to others</label>
          <button
            className="px-3 py-1 rounded text-xs font-medium bg-green-600 text-white"
            aria-label="Show online status to others"
            title="Toggle online status visibility"
          >
            On
          </button>
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-400">Chat notifications</label>
          <button
            className="px-3 py-1 rounded text-xs font-medium bg-green-600 text-white"
            aria-label="Chat notifications"
            title="Toggle chat notifications"
          >
            On
          </button>
        </div>
      </div>
    </div>
  );
}
