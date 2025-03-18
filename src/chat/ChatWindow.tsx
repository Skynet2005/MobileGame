"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ChatHeader from "../ui/chat/ChatHeader";
import ChatSettings from "../ui/chat/ChatSettings";
import ChatGroupInvite from "../ui/chat/ChatGroupInvite";
import ChatFriendsPanel from "../ui/chat/ChatFriendsPanel";
import ChatTabs from "../ui/chat/ChatTabs";
import DebugPanel from "../ui/chat/DebugPanel";
import { useChat } from "./ChatProvider";
import chatService from "@/chat/ChatService";
import useDebounce from "@/chat/actions/debounce";
import ScrollToBottom from "../ui/chat/ScrollToBottom";

export default function ChatWindow({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [activeFriendsTab, setActiveFriendsTab] = useState(0); // 0: Friends, 1: Requests, 2: Blacklist
  const [showGroupInvite, setShowGroupInvite] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingCharacters, setTypingCharacters] = useState<Record<string, string[]>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [showAltMessages, setShowAltMessages] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [characterHasScrolled, setCharacterHasScrolled] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Refs for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Chat context (from your ChatContext provider)
  const {
    currentCharacter,
    channels,
    messages,
    friends,
    friendRequests,
    blacklist,
    sendMessage: contextSendMessage,
    acceptFriendRequest,
    rejectFriendRequest,
    addToBlacklist,
    removeFromBlacklist,
    joinChannel,
    reloadChannelMessages,
    isInitialized,
  } = useChat();

  // Track which channels have been joined
  const joinedChannelsRef = useRef<Record<string, boolean>>({});

  // Filter channels to be shown in tabs (world, alliance, personal)
  const tabChannels = channels
    .filter((channel) =>
      channel &&
      channel.type &&
      ["world", "alliance", "personal"].includes(channel.type)
    )
    .sort((a, b) => {
      const order = { world: 0, alliance: 1, personal: 2 };
      return order[a.type as keyof typeof order] - order[b.type as keyof typeof order];
    });

  console.log('ChatWindow - All channels:', channels);
  console.log('ChatWindow - Filtered tab channels:', tabChannels);
  console.log('ChatWindow - Alliance channels:', channels.filter(c => c.type === 'alliance'));

  // Ensure channels are joined (only once per session)
  useEffect(() => {
    if (!tabChannels.length || !isInitialized) return;
    const ensureChannelJoined = (channelId: string) => {
      if (!channelId) return;
      if (!joinedChannelsRef.current[channelId]) {
        console.log(`Joining channel: ${channelId}`);
        joinChannel(channelId);
        joinedChannelsRef.current[channelId] = true;
      }
    };

    // Join active channel
    if (tabChannels[activeTab]) {
      ensureChannelJoined(tabChannels[activeTab].id);
    }
    // Also ensure World chat is joined
    const worldChannel = tabChannels.find((channel) => channel.type === "world");
    if (worldChannel) {
      ensureChannelJoined(worldChannel.id);
    }
  }, [tabChannels, activeTab, joinChannel, isInitialized]);

  // Ensure messages are sorted by createdAt timestamp
  const sortedMessages = { ...messages };
  Object.keys(sortedMessages).forEach(channelId => {
    sortedMessages[channelId] = [...messages[channelId]].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateA - dateB;  // Changed to ascending order (oldest to newest)
    });
  });

  // Handle scroll events (for "scroll to bottom" button visibility)
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    // Show button when scrolled up more than 100px from bottom
    const atBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 100;
    setIsAtBottom(atBottom);
    setCharacterHasScrolled(!atBottom);
  };

  // Scroll to bottom function
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesContainerRef.current) {
      const { scrollHeight, clientHeight } = messagesContainerRef.current;
      messagesContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: smooth ? "smooth" : "auto"
      });
      setIsAtBottom(true);
      setCharacterHasScrolled(false);
    }
  }, []);

  // Initial scroll to bottom when chat opens
  useEffect(() => {
    const initialScrollTimeout = setTimeout(() => {
      scrollToBottom(false);
    }, 100);
    return () => clearTimeout(initialScrollTimeout);
  }, []); // Empty dependency array means this runs once when component mounts

  // Auto-scroll to bottom on new messages only if we were already at the bottom
  useEffect(() => {
    if (isAtBottom) {
      const scrollTimeout = setTimeout(() => {
        scrollToBottom(true);
      }, 100);
      return () => clearTimeout(scrollTimeout);
    }
  }, [sortedMessages, activeTab, isAtBottom, scrollToBottom]);

  // Reset activeTab index if needed
  useEffect(() => {
    if (tabChannels.length > 0 && activeTab >= tabChannels.length) {
      setActiveTab(0);
    }
  }, [tabChannels, activeTab]);

  // Handle typing indicator timeout
  useEffect(() => {
    if (!isTyping) return;
    const typingTimeout = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
    return () => clearTimeout(typingTimeout);
  }, [isTyping, inputMessage]);

  // Send typing indicator when character types
  useEffect(() => {
    if (!inputMessage || !currentCharacter) return;
    if (!isTyping) {
      setIsTyping(true);
      const channel = tabChannels[activeTab]?.id;
      if (channel) {
        chatService.sendTypingIndicator(channel);
      }
    }
  }, [inputMessage, currentCharacter, isTyping, activeTab, tabChannels]);

  // Send message handler
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentCharacter) return;

    // Get the current channel from organized tabs
    const currentChannel = tabChannels[activeTab];
    if (!currentChannel || !currentChannel.id) {
      console.error('Invalid channel selection');
      return;
    }

    // Don't allow sending messages in alliance chat if not in an alliance
    if (currentChannel.type === 'alliance' && !currentCharacter.allianceId) {
      console.error('Cannot send message: Not in an alliance');
      return;
    }

    // Log detailed channel and message info for debugging
    console.log('Current channel details:', {
      channelId: currentChannel.id,
      channelType: currentChannel.type,
      channelName: currentChannel.name,
      activeTab,
      allChannels: tabChannels.map(c => ({ id: c.id, type: c.type, name: c.name }))
    });

    console.log('Sending message with details:', {
      channelId: currentChannel.id,
      channelType: currentChannel.type,
      content: inputMessage,
      characterId: currentCharacter.id,
      allianceId: currentCharacter.allianceId,
      allianceTag: currentCharacter.allianceTag
    });

    try {
      // Ensure we're joined to the channel before sending
      if (!joinedChannelsRef.current[currentChannel.id]) {
        await joinChannel(currentChannel.id);
        joinedChannelsRef.current[currentChannel.id] = true;
      }

      // Send the message and wait for confirmation
      const success = await contextSendMessage(currentChannel.id, inputMessage);

      if (success) {
        console.log('Message sent successfully to channel:', currentChannel.type);
        setInputMessage("");
        setIsTyping(false);
        setTimeout(() => scrollToBottom(true), 100);
      } else {
        console.error('Failed to send message to channel:', currentChannel.type);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Keyboard event handler for message input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Close chat window
  const handleClose = () => {
    onClose();
  };

  // Filter friends by search term
  const filteredFriends = friends.filter((friend) =>
    friend.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center h-full overflow-hidden">
      <div className="bg-gray-900 w-full h-full overflow-auto flex flex-col pb-[85px] relative">
        <ChatHeader
          onToggleSettings={() => setShowSettings(!showSettings)}
          onToggleFriends={() => setShowFriends(!showFriends)}
          onToggleGroupInvite={() => setShowGroupInvite(!showGroupInvite)}
          onToggleDebug={() => setShowDebug(!showDebug)}
          onClose={handleClose}
        />
        {showSettings && <ChatSettings />}
        {showGroupInvite && (
          <ChatGroupInvite
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filteredFriends={filteredFriends}
          />
        )}
        {showFriends && (
          <ChatFriendsPanel
            activeTab={activeFriendsTab}
            setActiveTab={setActiveFriendsTab}
            friends={friends}
            friendRequests={friendRequests}
            blacklist={blacklist}
            addToBlacklist={addToBlacklist}
            removeFromBlacklist={removeFromBlacklist}
            acceptFriendRequest={acceptFriendRequest}
            rejectFriendRequest={rejectFriendRequest}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filteredFriends={filteredFriends}
          />
        )}
        <ChatTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabChannels={tabChannels}
          messages={sortedMessages}
          handleScroll={handleScroll}
          messagesContainerRef={messagesContainerRef}
          messagesEndRef={messagesEndRef}
          typingCharacters={typingCharacters}
          scrollToBottom={scrollToBottom}
          inputMessage={inputMessage}
          handleKeyDown={handleKeyDown}
          handleSendMessage={handleSendMessage}
          currentChannel={tabChannels[activeTab]}
          onInputChange={setInputMessage}
          currentCharacter={currentCharacter}
        />
        {showDebug && <DebugPanel tabChannels={tabChannels} activeTab={activeTab} messages={sortedMessages} />}
        <ScrollToBottom onClick={() => scrollToBottom(true)} isVisible={!isAtBottom} />
      </div>
    </div>
  );
}
