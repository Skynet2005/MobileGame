"use client";

interface DebugPanelProps {
  tabChannels: any[];
  activeTab: number;
  messages: Record<string, any[]>;
}

export default function DebugPanel({ tabChannels, activeTab, messages }: DebugPanelProps) {
  const currentChannel = tabChannels[activeTab];
  const currentMessages = currentChannel ? messages[currentChannel.id] || [] : [];
  return (
    <div className="bg-gray-900 border border-red-500 p-2 mt-2 text-xs text-white rounded">
      <h3 className="font-bold mb-1 text-red-400">Debug Panel</h3>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p>
            <span className="opacity-70">Chat Initialized:</span>{" "}
            {currentChannel ? "Yes" : "No"}
          </p>
          <p>
            <span className="opacity-70">Channels Loaded:</span>{" "}
            {tabChannels.length > 0 ? "Yes" : "No"}
          </p>
          <p>
            <span className="opacity-70">Current Character:</span>{" "}
            {currentChannel?.name || "Unknown"}
          </p>
          <p>
            <span className="opacity-70">Channels:</span> {tabChannels.length}
          </p>
        </div>
        <div>
          <p>
            <span className="opacity-70">Active Tab:</span> {activeTab}
          </p>
          <p>
            <span className="opacity-70">Current Channel:</span>{" "}
            {currentChannel?.name || "None"}
          </p>
          <p>
            <span className="opacity-70">Channel ID:</span>{" "}
            {currentChannel?.id || "None"}
          </p>
          <p>
            <span className="opacity-70">Message Count:</span>{" "}
            {currentMessages.length}
          </p>
        </div>
      </div>
      <div className="mt-2 space-y-1">
        <button
          className="bg-blue-800 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs block w-full"
          onClick={() => {
            console.log("Current messages state:", messages);
            console.log("Current channel ID:", currentChannel?.id);
          }}
        >
          Log Messages
        </button>
        <button
          className="bg-purple-800 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs block w-full"
          onClick={() => {
            // Toggle alternative message display if needed
          }}
        >
          Toggle Alt Messages
        </button>
        <button
          className="bg-red-800 hover:bg-red-700 text-white px-2 py-1 rounded text-xs block w-full"
          onClick={() => {
            if (currentChannel) {
              console.log(`Reloading messages for channel ${currentChannel.id}`);
              // Trigger channel reload logic here
            }
          }}
        >
          Reload Channel Messages
        </button>
        <button
          className="bg-indigo-800 hover:bg-indigo-700 text-white px-2 py-1 rounded text-xs block w-full"
          onClick={() => {
            if (currentChannel) {
              console.log(`Force refreshing messages from database for channel ${currentChannel.id}`);
              // Trigger force refresh logic here
            }
          }}
        >
          Force Refresh From Database
        </button>
        <button
          className="bg-red-900 hover:bg-red-800 text-white px-2 py-1 rounded text-xs block w-full"
          onClick={async () => {
            if (currentChannel) {
              const channelId = currentChannel.id;
              if (window.confirm(`Are you sure you want to delete ALL messages in ${currentChannel.name}?`)) {
                try {
                  const response = await fetch(`/api/chat/messages?channelId=${channelId}`, {
                    method: "DELETE",
                  });
                  if (response.ok) {
                    console.log(`All messages deleted from channel ${channelId}`);
                    // Trigger channel rejoin or reload here
                  } else {
                    console.error("Failed to delete messages:", await response.json());
                  }
                } catch (error) {
                  console.error("Error deleting messages:", error);
                }
              }
            }
          }}
        >
          Clear All Channel Messages
        </button>
      </div>
    </div>
  );
}
