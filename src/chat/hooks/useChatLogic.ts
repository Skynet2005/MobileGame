import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Channel, Message } from '@/types/chat';
import { Character, Friend, FriendRequest, BlacklistEntry } from '@/types/player';
import { prisma } from '@/database/prisma';

import { getBlacklist, addToBlacklist, removeFromBlacklist } from '@/chat/actions/blacklist';
import { createChannel, getChannels } from '@/chat/actions/channels';
import { getFriends, getFriendRequests, respondToFriendRequest } from '@/chat/actions/friends';
import { getMessages, sendMessage as apiSendMessage } from '@/chat/actions/messages';
import { createCharacter, searchCharacters, updateCharacterStatus } from '@/system/actions/character';
import useSocket from '@/chat/actions/socket';
import ChatService from '../ChatService';

import { CHANNEL_IDS, safeApiCall } from '@/chat/utils';
import chatService from '@/chat/ChatService';

function useChatLogic() {
  const pathname = usePathname();

  // State variables
  const [isInitialized, setIsInitialized] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentCharacter, setCurrentCharacter] = useState<Character | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMessages, setPreviewMessages] = useState<Message[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Refs for tracking timeouts, joined channels and pending requests
  const timeoutsRef = useRef<Array<{ clear: () => void }>>([]);
  const joinedChannelsRef = useRef<Set<string>>(new Set<string>());
  const pendingRequestsRef = useRef<Record<string, boolean>>({});
  const dataLoadedRef = useRef({
    character: false,
    channels: false,
    friends: false,
    requests: false,
    blacklist: false,
  });

  // Initialize socket connection using currentCharacter ID
  const socket = useSocket(currentCharacter?.id || '');

  // Add missing socket methods
  const extendedSocket = {
    ...socket,
    isConnected: socket.connected || false,
    subscribeToMessages: (callback: any) => {
      socket.subscribe('message', callback);
      return () => socket.unsubscribe('message', callback);
    },
    subscribeToFriendRequests: (callback: any) => {
      socket.subscribe('friendRequest', callback);
      return () => socket.unsubscribe('friendRequest', callback);
    },
    subscribeToCharacterStatus: (callback: any) => {
      socket.subscribe('characterStatus', callback);
      return () => socket.unsubscribe('characterStatus', callback);
    },
    subscribeToTyping: (callback: any) => {
      socket.subscribe('typing', callback);
      return () => socket.unsubscribe('typing', callback);
    }
  };

  // Add name update handler
  useEffect(() => {
    const handleNameUpdate = (data: { characterId: string; newName: string }) => {
      if (data.characterId === currentCharacter?.id) {
        setCurrentCharacter(prev => prev ? { ...prev, name: data.newName } : null);
      }
      // Update messages with the new name
      setMessages(prev => {
        const updatedMessages = { ...prev };
        Object.keys(updatedMessages).forEach(channelId => {
          updatedMessages[channelId] = updatedMessages[channelId].map(msg => {
            if (msg.sender?.id === data.characterId) {
              return {
                ...msg,
                sender: { ...msg.sender, name: data.newName }
              };
            }
            return msg;
          });
        });
        return updatedMessages;
      });
    };

    socket.subscribe('name-updated', handleNameUpdate);

    return () => {
      socket.unsubscribe('name-updated', handleNameUpdate);
    };
  }, [socket, currentCharacter?.id]);

  // Add character refresh logic
  useEffect(() => {
    if (!currentCharacter?.id) return;

    const refreshCharacter = async () => {
      try {
        const response = await fetch(`/api/characters/${currentCharacter.id}`);
        if (!response.ok) return;

        const updatedCharacter = await response.json();
        if (updatedCharacter.name !== currentCharacter.name) {
          setCurrentCharacter(updatedCharacter);
          // Update messages with the new name
          setMessages(prev => {
            const updatedMessages = { ...prev };
            Object.keys(updatedMessages).forEach(channelId => {
              updatedMessages[channelId] = updatedMessages[channelId].map(msg => {
                if (msg.sender?.id === currentCharacter.id) {
                  return {
                    ...msg,
                    sender: { ...msg.sender, name: updatedCharacter.name }
                  };
                }
                return msg;
              });
            });
            return updatedMessages;
          });
        }
      } catch (error) {
        console.error('Error refreshing character:', error);
      }
    };

    // Refresh character data every 5 seconds
    const intervalId = setInterval(refreshCharacter, 5000);

    return () => clearInterval(intervalId);
  }, [currentCharacter?.id]);

  // --- Message Processing ---
  const processMessage = useCallback((message: any): Message => {
    if (!message) {
      console.error('Attempted to process null/undefined message');
      return {
        id: `error-${Date.now()}`,
        content: 'Error processing message',
        isSystem: true,
        channelId: '',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        read: false,
      };
    }

    const getISOString = (value: any): string => {
      if (!value) return new Date().toISOString();
      if (typeof value === 'string') return value;
      if (value instanceof Date) return value.toISOString();
      return new Date().toISOString();
    };

    // Remove any temporary message with the same content
    setMessages(prev => {
      const updatedMessages = { ...prev };
      if (updatedMessages[message.channelId]) {
        updatedMessages[message.channelId] = updatedMessages[message.channelId].filter(
          msg => !(msg.id.startsWith('temp-') && msg.content === message.content)
        );
      }
      return updatedMessages;
    });

    return {
      id: message.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      content: message.content,
      isSystem: message.isSystem || false,
      sender: message.sender
        ? {
          id: message.sender.id,
          name: message.sender.name,
          level: message.sender.level || 0,
          allianceTag: message.sender.allianceTag || null,
        }
        : null,
      timestamp: getISOString(message.timestamp || message.createdAt),
      channelId: message.channelId,
      createdAt: getISOString(message.createdAt || message.timestamp),
      read: false,
    };
  }, []);

  // --- Message Sending ---
  const sendMessage = useCallback(
    async (channelId: string, content: string, isSystem = false): Promise<boolean> => {
      if (!channelId) {
        console.error('Cannot send message: channelId is required');
        return false;
      }
      if (!content || content.trim() === '') {
        console.error('Cannot send empty message');
        return false;
      }
      try {
        console.log(
          `Sending message to channel ${channelId}:`,
          content,
          isSystem ? '(system)' : ''
        );
        const senderId = isSystem ? 'system' : currentCharacter?.id || 'unknown-character';
        if (!isSystem && !currentCharacter) {
          console.error('Cannot send character message: No current character');
          return false;
        }

        // Create a temporary message for immediate display
        const tempMessage: Message = {
          id: `temp-${Date.now()}`,
          content,
          isSystem,
          sender: isSystem ? null : {
            id: currentCharacter?.id || '',
            name: currentCharacter?.name || '',
            level: currentCharacter?.level || 0,
            allianceTag: currentCharacter?.allianceTag || undefined,
            allianceId: currentCharacter?.allianceId || undefined,
            isOnline: true,
            lastSeen: new Date().toISOString(),
          },
          channelId,
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          read: false,
        };

        // Update messages state immediately with the temporary message
        setMessages(prev => ({
          ...prev,
          [channelId]: [...(prev[channelId] || []), tempMessage],
        }));

        // Send message via WebSocket
        const success = await socket.sendMessage(channelId, content);

        if (!success) {
          // If sending failed, remove the temporary message
          setMessages(prev => ({
            ...prev,
            [channelId]: prev[channelId].filter(msg => msg.id !== tempMessage.id),
          }));
          return false;
        }

        return true;
      } catch (error) {
        console.error('Error sending message:', error);
        return false;
      }
    },
    [currentCharacter, socket]
  );

  // --- Loading Messages ---
  const loadMessages = useCallback(async (channelId: string) => {
    try {
      const channelMessages = await getMessages(channelId);
      setMessages(prev => ({
        ...prev,
        [channelId]: channelMessages || [],
      }));
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages(prev => ({
        ...prev,
        [channelId]: [],
      }));
    }
  }, []);

  const loadAllChannelMessages = useCallback(
    async (channelsToLoad = channels) => {
      console.log('Loading messages for all channels:', channelsToLoad);
      if (channelsToLoad.length === 0) {
        console.log('No channels to load messages for');
        return;
      }
      const worldChannel = channelsToLoad.find(c => c.type === 'world');
      if (worldChannel) {
        console.log('Loading messages for World Chat first:', worldChannel.id);
        await loadMessages(worldChannel.id);
      }
      for (const channel of channelsToLoad) {
        if (channel.type === 'world') continue;
        console.log(`Loading messages for ${channel.name} (${channel.type}):`, channel.id);
        await loadMessages(channel.id);
      }
      console.log('Finished loading messages for all channels');
    },
    [channels, loadMessages]
  );

  // --- Channels Initialization ---
  const initializeDefaultChannels = useCallback(async () => {
    if (!currentCharacter || dataLoadedRef.current.channels) return;
    try {
      pendingRequestsRef.current['initChannels'] = true;
      console.log('Initializing default channels...');
      console.log('Current character alliance info:', {
        allianceId: currentCharacter.allianceId,
        allianceTag: currentCharacter.allianceTag
      });
      const existingChannels = await getChannels();
      console.log('Existing channels:', existingChannels);
      const channelsToCreate: Partial<Channel>[] = [];

      // World channel initialization
      const worldChannel = existingChannels.find(c => c.type === 'world');
      if (!worldChannel) {
        channelsToCreate.push({
          name: 'World',
          type: 'world',
          id: CHANNEL_IDS.WORLD,
        });
      } else {
        console.log('World channel already exists:', worldChannel);
      }

      // Alliance channel initialization
      if (currentCharacter.allianceId) {
        const allianceChannel = existingChannels.find(c =>
          c.type === 'alliance' && c.allianceId === currentCharacter.allianceId
        );

        if (!allianceChannel) {
          try {
            console.log('Creating alliance channel...');
            const response = await fetch('/api/chat/channels/alliance', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                allianceId: currentCharacter.allianceId,
                name: `Alliance: ${currentCharacter.allianceTag || 'Chat'}`
              }),
            });

            if (!response.ok) {
              throw new Error('Failed to create alliance channel');
            }

            const newChannel = await response.json();
            console.log('Created alliance channel:', newChannel);

            // Add the character to the new alliance channel
            try {
              const memberResponse = await fetch(`/api/chat/channels/${newChannel.id}/members`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  characterId: currentCharacter.id
                }),
              });

              if (!memberResponse.ok) {
                console.error('Failed to add character to alliance channel');
              }
            } catch (error) {
              console.error('Error adding character to alliance channel:', error);
            }
          } catch (error) {
            console.error('Error creating alliance channel:', error);
          }
        } else {
          console.log('Alliance channel already exists:', allianceChannel);
          // Add character to existing alliance channel if not already a member
          try {
            const memberResponse = await fetch(`/api/chat/channels/${allianceChannel.id}/members`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                characterId: currentCharacter.id
              }),
            });

            if (!memberResponse.ok) {
              console.log('Character already a member of alliance channel');
            }
          } catch (error) {
            console.log('Error adding character to alliance channel:', error);
          }
        }
      }

      // Personal channel initialization
      const personalChannel = existingChannels.find(c => c.type === 'personal');
      if (!personalChannel) {
        channelsToCreate.push({
          name: 'Personal',
          type: 'personal',
        });
      } else {
        console.log('Personal channel already exists:', personalChannel);
      }

      // Create new channels
      for (const channel of channelsToCreate) {
        const { name, type, id } = channel;
        console.log(`Creating ${type} channel: ${name}`);
        if (type !== 'alliance') {
          await createChannel(name!, type!, id);
        }
      }

      const updatedChannels = await getChannels();
      console.log('Updated channels list:', updatedChannels);
      setChannels(updatedChannels);
      await loadAllChannelMessages(updatedChannels);
      dataLoadedRef.current.channels = true;
    } catch (error) {
      console.error('Failed to initialize channels:', error);
      setError('Failed to initialize channels. Please try again later.');
    } finally {
      pendingRequestsRef.current['initChannels'] = false;
    }
  }, [currentCharacter, loadAllChannelMessages]);

  // --- Channel Joining/Leaving ---
  const joinChannel = useCallback(
    (channelId: string) => {
      if (!channelId) {
        console.error('Attempted to join channel with null/undefined ID');
        return;
      }
      if (!joinedChannelsRef.current.has(channelId)) {
        console.log(`Joining channel: ${channelId}`);
        socket.joinChannel(channelId);
        joinedChannelsRef.current.add(channelId);
      } else {
        console.log(`Channel ${channelId} already joined, skipping socket join`);
      }
      loadMessages(channelId);
    },
    [socket, loadMessages]
  );

  const leaveChannel = useCallback(
    (channelId: string) => {
      socket.leaveChannel(channelId);
    },
    [socket]
  );

  // --- Character Initialization ---
  useEffect(() => {
    const initializeCharacter = async () => {
      if (currentCharacter !== null || pendingRequestsRef.current['initCharacter']) return;

      try {
        pendingRequestsRef.current['initCharacter'] = true;
        console.log('Initializing chat character...');

        // Get account from localStorage
        const accountStr = localStorage.getItem('account');
        if (!accountStr) {
          console.log('No account found in chat initialization, skipping');
          return;
        }

        let account;
        try {
          account = JSON.parse(accountStr);
        } catch (error) {
          console.error('Error parsing account data:', error);
          return;
        }

        if (!account || !account.id) {
          console.log('Invalid account data in chat initialization, skipping');
          return;
        }

        // Initialize character only if we have valid account data
        let character;
        try {
          console.log('Checking for existing character');
          const existingCharacters = await searchCharacters(account.id);
          if (existingCharacters && existingCharacters.length > 0) {
            character = existingCharacters[0];
            console.log('Found existing character:', character);
            character = await updateCharacterStatus(character.id, true);
            console.log('Updated existing character online status');
          } else {
            console.log('No existing character found, creating new character');
            const response = await fetch('/api/characters', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                accountId: account.id,
                isOnline: true
              }),
            });

            if (!response.ok) {
              throw new Error(`Failed to create character: ${response.statusText}`);
            }

            character = await response.json();
            console.log('New character created:', character);
          }
        } catch (searchError) {
          console.warn('Error searching for character:', searchError);
          return;
        }

        if (character) {
          console.log('Setting current character:', character);
          setCurrentCharacter(character);
          dataLoadedRef.current.character = true;
          await initializeDefaultChannels();
        }
      } catch (error) {
        console.error('Failed to initialize character:', error);
        setError('Failed to create character. Please try again later.');
      } finally {
        pendingRequestsRef.current['initCharacter'] = false;
      }
    };

    // Initialize character if we're not on an auth page
    if (!pathname.includes('/register') && !pathname.includes('/login') && !pathname.includes('/signin')) {
      initializeCharacter();
    }
  }, [pathname, initializeDefaultChannels, currentCharacter]);

  // --- Preview Messages (for World Chat) ---
  useEffect(() => {
    const updatePreviewMessages = () => {
      const worldChatMessages = messages[CHANNEL_IDS.WORLD] || [];
      const characterMessages = worldChatMessages.filter(msg => !msg.isSystem);
      characterMessages.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      const recentCharacterMessages = characterMessages.slice(-2); // Take last 2 messages
      if (recentCharacterMessages.length > 0) {
        setPreviewMessages(recentCharacterMessages);
      } else {
        const placeholderMessage: Message = {
          id: 'welcome-message',
          content: 'No recent messages in World Chat',
          isSystem: true,
          sender: {
            id: 'system',
            name: 'System',
            level: 100,
            allianceTag: '',
          },
          channelId: CHANNEL_IDS.WORLD,
          channelName: 'World',
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          read: false,
        };
        setPreviewMessages([placeholderMessage]);
      }
    };
    updatePreviewMessages();
  }, [messages]);

  // --- Cleanup on Unmount ---
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(t => t.clear());
      timeoutsRef.current = [];
    };
  }, []);

  // --- Load All Chat Data Once Character is Set ---
  useEffect(() => {
    if (!currentCharacter?.id || isInitialized) return;
    if (isLoadingData) return;
    setIsLoadingData(true);
    const loadAllData = async () => {
      try {
        await initializeDefaultChannels();
        if (!dataLoadedRef.current.channels) {
          await safeApiCall(
            'loadChannels',
            () => getChannels(),
            (channelsData) => {
              setChannels(channelsData);
              dataLoadedRef.current.channels = true;
              const worldChannel = channelsData.find(c => c.type === 'world');
              if (worldChannel) {
                try {
                  loadMessages(worldChannel.id);
                  socket.joinChannel(worldChannel.id);
                } catch (error) {
                  console.error(`Failed to load world channel messages:`, error);
                }
              }
            },
            10000,
            pendingRequestsRef
          );
        }
        if (!dataLoadedRef.current.friends && currentCharacter.id) {
          await safeApiCall(
            'loadFriends',
            () => getFriends(currentCharacter.id),
            (friendsData) => {
              setFriends(friendsData);
              dataLoadedRef.current.friends = true;
            },
            5000,
            pendingRequestsRef
          );
        }
        if (!dataLoadedRef.current.requests && currentCharacter.id) {
          await safeApiCall(
            'loadFriendRequests',
            () => getFriendRequests(currentCharacter.id),
            (requestsData) => {
              setFriendRequests(requestsData);
              dataLoadedRef.current.requests = true;
            },
            5000,
            pendingRequestsRef
          );
        }
        if (!dataLoadedRef.current.blacklist && currentCharacter.id) {
          await safeApiCall(
            'loadBlacklist',
            () => getBlacklist(currentCharacter.id),
            (blacklistData) => {
              setBlacklist(blacklistData);
              dataLoadedRef.current.blacklist = true;
            },
            5000,
            pendingRequestsRef
          );
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading chat data:', error);
        setError('Failed to initialize chat. Please try again later.');
      } finally {
        setIsLoadingData(false);
      }
    };
    loadAllData();
  }, [currentCharacter?.id, isInitialized, socket, safeApiCall, initializeDefaultChannels]);

  // --- Chat Open/Close ---
  const openChat = useCallback(() => {
    setIsChatOpen(true);
    if (channels.length === 0 && currentCharacter) {
      console.log('No channels found when opening chat, initializing defaults');
      initializeDefaultChannels();
    }
    if (currentCharacter && channels.length > 0) {
      console.log('Loading all channel messages on chat open');
      loadAllChannelMessages();
    }
    const joinedChannels = new Set<string>();
    if (channels.length > 0 && Object.keys(messages).length === 0 && currentCharacter) {
      const worldChannel = channels.find(c => c.type === 'world');
      if (worldChannel && !joinedChannels.has(worldChannel.id)) {
        console.log('Joining world channel on chat open:', worldChannel.id);
        joinChannel(worldChannel.id);
        joinedChannels.add(worldChannel.id);
      }
    }
  }, [channels, messages, currentCharacter, initializeDefaultChannels, joinChannel, loadAllChannelMessages]);

  const closeChat = useCallback(() => {
    setIsChatOpen(false);
  }, []);

  const reloadChannelMessages = useCallback(async (channelId: string): Promise<Message[] | undefined> => {
    try {
      const channelMessages = await getMessages(channelId);
      setMessages(prev => ({
        ...prev,
        [channelId]: channelMessages
      }));
      return channelMessages;
    } catch (error) {
      console.error('Error reloading messages:', error);
      return undefined;
    }
  }, []);

  // --- Expose methods to update messages and friend statuses (for socket subscriptions) ---
  const updateMessages = useCallback((convertedMessage: Message) => {
    console.log('Updating messages for channel:', convertedMessage.channelId, 'Message:', convertedMessage);
    setMessages(prev => {
      const channelMessages = prev[convertedMessage.channelId] || [];
      // Check if message already exists to avoid duplicates
      if (channelMessages.some(m => m.id === convertedMessage.id)) {
        console.log('Message already exists in channel:', convertedMessage.channelId);
        return prev;
      }
      // Create new messages array for the channel, maintaining chronological order
      const updatedMessages = {
        ...prev,
        [convertedMessage.channelId]: [...channelMessages, convertedMessage].sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      };
      console.log('Updated messages state:', updatedMessages);
      return updatedMessages;
    });
  }, []);

  const updateFriendStatus = useCallback((characterId: string, isOnline: boolean) => {
    setFriends(prev =>
      prev.map(friend =>
        friend.id === characterId ? { ...friend, isOnline } : friend
      )
    );
  }, []);

  // --- Return the complete chat context ---
  return {
    isInitialized,
    isChatOpen,
    openChat,
    closeChat,
    currentCharacter,
    channels,
    messages,
    friends,
    friendRequests,
    blacklist,
    loadingMessages,
    sendMessage,
    joinChannel,
    leaveChannel,
    sendFriendRequest: async (receiverId: string) => {
      try {
        socket.sendFriendRequest(receiverId);
        return true;
      } catch (error) {
        console.error('Error sending friend request:', error);
        return false;
      }
    },
    acceptFriendRequest: async (requestId: string) => {
      if (!currentCharacter) throw new Error('Character not authenticated');
      try {
        await respondToFriendRequest(requestId, 'accepted');
        setFriendRequests(prev => prev.filter(req => req.id !== requestId));
        if (currentCharacter.id) {
          const friendsData = await getFriends(currentCharacter.id);
          setFriends(friendsData);
        }
      } catch (error) {
        console.error('Failed to accept friend request:', error);
        throw error;
      }
    },
    rejectFriendRequest: async (requestId: string) => {
      try {
        await respondToFriendRequest(requestId, 'rejected');
        setFriendRequests(prev => prev.filter(req => req.id !== requestId));
      } catch (error) {
        console.error('Failed to reject friend request:', error);
        throw error;
      }
    },
    addToBlacklist: async (blockedId: string) => {
      if (!currentCharacter) throw new Error('Character not authenticated');
      try {
        const entry = await addToBlacklist(currentCharacter.id, blockedId);
        setBlacklist(prev => [...prev, entry]);
        setFriends(prev => prev.filter(friend => friend.id !== blockedId));
      } catch (error) {
        console.error('Failed to add to blacklist:', error);
        throw error;
      }
    },
    removeFromBlacklist: async (entryId: string) => {
      try {
        await removeFromBlacklist(entryId);
        setBlacklist(prev => prev.filter(entry => entry.id !== entryId));
      } catch (error) {
        console.error('Failed to remove from blacklist:', error);
        throw error;
      }
    },
    error: socket.error || error,
    previewMessages,
    reloadChannelMessages,
    // Expose additional methods for socket subscriptions:
    processMessage,
    updateMessages,
    updateFriendStatus,
    socket: extendedSocket,
    setFriendRequests,
  };
}

export default useChatLogic;
