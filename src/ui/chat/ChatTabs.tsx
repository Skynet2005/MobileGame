"use client";

import { Tab, TabGroup, TabList, TabPanels, TabPanel } from "@headlessui/react";
import ChatMessageList from "./ChatMessageList";
import ChatInput from "./ChatInput";
import AllianceManagementModal from "../alliance/AllianceManagementModal";
import AllianceJoinModal from "../alliance/AllianceJoinModal";
import { useState, useEffect, useCallback } from "react";

// Add Chrome runtime type definition
declare global {
  interface Window {
    chrome?: {
      runtime: {
        connect: (options: { name: string }) => {
          disconnect: () => void;
        };
      };
    };
  }
}

interface ChatTabsProps {
  activeTab: number;
  setActiveTab: (tab: number) => void;
  tabChannels: any[];
  messages: Record<string, any[]>;
  handleScroll: () => void;
  messagesContainerRef: React.MutableRefObject<HTMLDivElement | null>;
  messagesEndRef: React.MutableRefObject<HTMLDivElement | null>;
  typingCharacters: Record<string, string[]>;
  scrollToBottom: (smooth?: boolean) => void;
  inputMessage: string;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleSendMessage: () => void;
  currentChannel: any;
  onInputChange: (value: string) => void;
  currentCharacter: any;
}

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
}: ChatTabsProps) {
  const [showAllianceModal, setShowAllianceModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [allianceModalTab, setAllianceModalTab] = useState(0);
  const [currentTabIndex, setCurrentTabIndex] = useState(activeTab);

  // Filter messages for the current channel
  const channelMessages = currentChannel?.id
    ? messages[currentChannel.id] || []
    : [];

  // Effect to scroll to bottom when channel changes or new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      scrollToBottom(false);
    }
  }, [activeTab, channelMessages.length, scrollToBottom]);

  // Check if character has an alliance
  const hasAlliance = currentCharacter?.allianceTag && currentCharacter.allianceTag !== "";

  // Handle tab change
  const handleTabChange = useCallback((index: number) => {
    setCurrentTabIndex(index);
    setActiveTab(index);
    // Add a small delay to ensure the new tab content is rendered
    setTimeout(() => scrollToBottom(false), 100);
  }, [setActiveTab, scrollToBottom]);

  // Effect to cleanup message channels on unmount
  useEffect(() => {
    return () => {
      // Cleanup any pending message channels
      if (window.chrome && window.chrome.runtime && window.chrome.runtime.connect) {
        const port = window.chrome.runtime.connect({ name: 'cleanup' });
        port.disconnect();
      }
    };
  }, []);

  console.log('ChatTabs - Current character:', currentCharacter);
  console.log('ChatTabs - Tab channels:', tabChannels);
  console.log('ChatTabs - Alliance channels:', tabChannels.filter(c => c.type === 'alliance'));

  const handleCreateAlliance = () => {
    setShowJoinModal(false);
    setShowAllianceModal(true);
  };

  const handleJoinAlliance = () => {
    setShowJoinModal(false);
    setShowAllianceModal(true);
    setAllianceModalTab(1);
  };

  const handleAllianceCreated = (alliance: any) => {
    // Update local state
    if (currentCharacter) {
      currentCharacter.allianceId = alliance.id;
      currentCharacter.allianceTag = alliance.tag;
    }
    setShowAllianceModal(false);
  };

  // Create organized chat tabs array
  const organizedTabs = [
    // World chat (from existing channels or default)
    tabChannels.find(c => c.type === 'world') || { id: 'world-chat', name: 'World', type: 'world' },

    // Alliance chat (always present)
    hasAlliance
      ? (tabChannels.find(c => c.type === 'alliance') || { id: 'alliance-chat', name: 'Alliance', type: 'alliance' })
      : { id: 'alliance-chat-placeholder', name: 'Alliance', type: 'alliance' },

    // Personal chat (from existing channels or default)
    tabChannels.find(c => c.type === 'personal') || { id: 'personal-chat', name: 'Personal', type: 'personal' }
  ];

  return (
    <>
      <TabGroup selectedIndex={currentTabIndex} onChange={handleTabChange} className="flex-grow flex flex-col overflow-hidden h-full">
        <TabList className="flex border-b border-gray-700">
          {organizedTabs.map((channel) => (
            <Tab
              key={channel.id}
              className={({ selected }) =>
                `flex-1 py-2 text-sm font-medium text-center focus:outline-none ${selected ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-400 hover:text-white"
                }`
              }
            >
              <div className="flex items-center justify-center space-x-1">
                {channel.type === "world" && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {channel.type === "alliance" && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                )}
                {channel.type === "personal" && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                )}
                <span>{channel.name}</span>
              </div>
            </Tab>
          ))}
        </TabList>
        <TabPanels className="flex-grow overflow-hidden h-full">
          {organizedTabs.map((channel, index) => (
            <TabPanel key={channel.id} className="h-full flex flex-col relative">
              {channel.type === "alliance" && !hasAlliance ? (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                  <div className="mb-8">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-white mb-2">Join an Alliance</h3>
                    <p className="text-gray-300 mb-4">Join an alliance to chat with allies and coordinate strategies!</p>
                  </div>
                  <div className="space-y-4">
                    <button
                      onClick={() => handleCreateAlliance()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors w-full max-w-xs"
                    >
                      Create Alliance
                    </button>
                    <button
                      onClick={() => handleJoinAlliance()}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-md transition-colors w-full max-w-xs"
                    >
                      Join Existing Alliance
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-hidden">
                    <ChatMessageList
                      channel={channel}
                      messages={messages[channel.id] || []}
                      messagesContainerRef={messagesContainerRef}
                      handleScroll={handleScroll}
                      typingCharacters={typingCharacters}
                      messagesEndRef={messagesEndRef}
                    />
                  </div>
                  <ChatInput
                    channel={channel}
                    inputMessage={inputMessage}
                    handleKeyDown={handleKeyDown}
                    handleSendMessage={handleSendMessage}
                    scrollToBottom={scrollToBottom}
                    onInputChange={onInputChange}
                  />
                </div>
              )}
            </TabPanel>
          ))}
        </TabPanels>
      </TabGroup>
      <AllianceJoinModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onCreateAlliance={handleCreateAlliance}
        onJoinAlliance={handleJoinAlliance}
      />
      <AllianceManagementModal
        isOpen={showAllianceModal}
        onClose={() => setShowAllianceModal(false)}
        initialTab={allianceModalTab}
        onAllianceCreated={handleAllianceCreated}
      />
    </>
  );
}
