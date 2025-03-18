export default function ChatTabs({
  activeTab,
  setActiveTab,
  tabChannels,
  messages,
  handleScroll,
  messagesContainerRef,
  messagesEndRef,
  typingCharacters,
  scrollToBottom,
  inputMessage,
  handleKeyDown,
  handleSendMessage,
  currentChannel,
  onInputChange,
  currentCharacter,
}: {
  activeTab: number;
  setActiveTab: (tab: number) => void;
  tabChannels: Channel[];
  messages: Message[];
  handleScroll: () => void;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  typingCharacters: { [key: string]: boolean };
  scrollToBottom: (smooth?: boolean) => void;
  inputMessage: string;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleSendMessage: () => void;
  currentChannel: Channel;
  onInputChange: (value: string) => void;
  currentCharacter: Character | null;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-gray-700">
        {tabChannels.map((channel, index) => (
          <button
            key={channel.id}
            className={`px-4 py-2 ${activeTab === index
                ? "bg-gray-800 text-white"
                : "bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            onClick={() => {
              setActiveTab(index);
              // Scroll to bottom when switching tabs
              setTimeout(() => scrollToBottom(false), 100);
            }}
          >
            {channel.name}
          </button>
        ))}
      </div>
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onScroll={handleScroll}
      >
        {messages.map((message, index) => (
          <ChatMessage
            key={`${message.id}-${index}`}
            message={message}
            isCurrentCharacter={message.characterId === currentCharacter?.id}
          />
        ))}
        {Object.keys(typingCharacters).length > 0 && (
          <div className="text-gray-500 italic">
            {Object.keys(typingCharacters)
              .filter((id) => id !== currentCharacter?.id)
              .join(", ")}{" "}
            is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput
        message={inputMessage}
        onKeyDown={handleKeyDown}
        onChange={onInputChange}
        onSendMessage={handleSendMessage}
        currentChannel={currentChannel}
      />
    </div>
  );
}
