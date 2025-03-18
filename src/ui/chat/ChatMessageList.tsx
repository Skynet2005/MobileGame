"use client";

interface ChatMessageListProps {
  channel: any;
  messages: any[];
  messagesContainerRef: React.MutableRefObject<HTMLDivElement | null>;
  handleScroll: () => void;
  typingCharacters: Record<string, string[]>;
  messagesEndRef: React.MutableRefObject<HTMLDivElement | null>;
}

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes} UTC`;
};

export default function ChatMessageList({
  channel,
  messages,
  messagesContainerRef,
  handleScroll,
  typingCharacters,
  messagesEndRef,
}: ChatMessageListProps) {
  return (
    <div
      className="h-full overflow-y-auto p-4 flex flex-col space-y-3"
      ref={messagesContainerRef}
      onScroll={handleScroll}
    >
      <div className="text-center text-gray-500 text-xs border-b border-gray-700 pb-2 mb-2">
        Beginning of conversation
      </div>
      {messages.map((msg) => (
        <div key={msg.id} className={`${msg.isSystem ? "text-center" : ""}`}>
          {msg.isSystem ? (
            <div className="text-yellow-500 text-xs italic">{msg.content}</div>
          ) : (
            <div>
              <div className="flex items-baseline">
                <span className="font-medium text-blue-400 mr-2">
                  {msg.sender?.allianceTag ? `[${msg.sender.allianceTag}] ` : ""}
                  {msg.sender?.name || "Unknown"}:
                </span>
                <span className="text-gray-300 text-xs">{formatTimestamp(msg.timestamp)}</span>
              </div>
              <p className="text-white text-sm break-words pl-1">{msg.content}</p>
            </div>
          )}
        </div>
      ))}
      {typingCharacters[channel.id]?.length > 0 && (
        <div className="text-gray-400 text-xs italic animate-pulse">
          {typingCharacters[channel.id].length === 1
            ? `${typingCharacters[channel.id][0]} is typing...`
            : `${typingCharacters[channel.id].length} people are typing...`}
        </div>
      )}
      {messages.length === 0 && (
        <div className="text-center text-gray-500 mt-4 mb-auto">
          <p>No messages yet in this channel.</p>
          <p className="text-sm">Be the first to say something!</p>
        </div>
      )}
      <div ref={messagesEndRef} className="h-0" />
    </div>
  );
}
