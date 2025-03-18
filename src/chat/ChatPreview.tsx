'use client';

import { useState, useEffect } from 'react';
import { useChat } from './ChatProvider';

interface ChatPreviewProps {
  onOpen: () => void;
}

export default function ChatPreview({ onOpen }: ChatPreviewProps) {
  const { previewMessages, channels } = useChat();
  const [displayMessages, setDisplayMessages] = useState<Array<any>>([]);

  // Update display messages when preview messages change
  useEffect(() => {
    // Get the channel names to display and sort messages by timestamp
    const messagesWithChannelNames = previewMessages
      .map(msg => {
        const channel = channels.find(c => c.id === msg.channelId);
        return {
          ...msg,
          channelName: channel?.name || 'World'
        };
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Only display the latest 2 messages
    setDisplayMessages(messagesWithChannelNames.slice(-2));
  }, [previewMessages, channels]);

  // Format timestamp relative to now
  const formatTime = (timestamp: string) => {
    const now = new Date();
    const msgTime = new Date(timestamp);
    const diffMs = now.getTime() - msgTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 24 * 60) return `${Math.floor(diffMins / 60)}h ago`;
    return msgTime.toLocaleDateString();
  };

  return (
    <div
      className="fixed bottom-[5rem] left-0 w-full bg-black/70 bg-opacity-70 backdrop-blur-sm border-t border-gray-700 cursor-pointer z-40"
      onClick={onOpen}
    >
      <div className="max-w-screen-xl mx-auto px-3 py-2">
        {/* Always show two message rows, fill with actual messages if available */}
        {displayMessages.length > 0 ? (
          displayMessages.map((msg) => (
            <div key={msg.id} className="flex items-start text-xs mb-1 last:mb-0 overflow-hidden group">
              <span className="font-semibold text-blue-300 mr-1">
                [{msg.channelName}] {msg.sender?.allianceTag ? `[${msg.sender.allianceTag}] ` : ''}{msg.sender?.name || 'System'}:
              </span>
              <span className="text-white truncate flex-grow">{msg.content}</span>
              <span className="text-gray-400 text-xs ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {formatTime(msg.timestamp)}
              </span>
            </div>
          ))
        ) : (
          // Empty placeholder rows that maintain the two-line layout
          <>
            <div className="flex items-start text-xs mb-1 h-5 opacity-50">
              <span className="text-gray-400 italic">No recent messages</span>
            </div>
            <div className="flex items-start text-xs mb-1 h-5 opacity-50">
              <span className="text-gray-400 italic">Click to open chat</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
