// Chat Types

import { Character, Friend, FriendRequest, BlacklistEntry } from './player';

// WebSocket message types
export type WebSocketEventType =
  | 'message'
  | 'join_channel'
  | 'leave_channel'
  | 'friend_request'
  | 'typing'
  | 'heartbeat';

// Server-Sent Events types
export type SSEEventType =
  | 'message'
  | 'channel_joined'
  | 'channel_left'
  | 'character_joined'
  | 'character_left'
  | 'friend_request'
  | 'character_status'
  | 'typing'
  | 'initial_channels'
  | 'initial_messages';

// WebSocket Message Type Definition
export type WebSocketMessageType =
  | 'connected'
  | 'message'
  | 'message_sent'
  | 'channel_joined'
  | 'channel_left'
  | 'character_joined'
  | 'character_left'
  | 'friend_request'
  | 'friend_request_sent'
  | 'character_status'
  | 'typing'
  | 'error';

// WebSocket Event listener Types
export type MessageListener = (message: Message) => void;
export type FriendRequestListener = (request: FriendRequest) => void;
export type StatusListener = (data: { characterId: string; isOnline: boolean }) => void;
export type TypingListener = (data: { characterId: string; channelId: string }) => void;
export type ChannelUpdateListener = (channels: Channel[]) => void;

// Chat WebSocket Definition
export interface ChatWebSocket extends WebSocket {
  characterId: string;
  isAlive: boolean;
  channels: Set<string>;
}

// WebRTC Signal Data Definition
export interface WebRTCSignalData {
  type: 'offer' | 'answer' | 'ice_candidate';
  from: string;
  to: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

// Notification type definition
export interface Notification {
  id: string;
  type: 'MESSAGE' | 'FRIEND_REQUEST' | 'SYSTEM';
  title: string;
  content: string;
  isRead: boolean;
  characterId: string;
  createdAt: Date;
  updatedAt: Date;
  sourceId?: string; // ID of the related entity (message, friend request, etc.)
}

// SSE Event type definition
export interface SSEEvent {
  id: string;
  type: 'NOTIFICATION' | 'CHARACTER_STATUS';
  data: any;
  timestamp: number;
}

// Channel type definition
export interface Channel {
  id: string;
  name: string;
  type?: string;
  description?: string;
  isPrivate?: boolean;
  allianceId?: string;
  createdAt: Date;
  updatedAt: Date;
  members?: Character[];
}

// Messages Definition
export interface Message {
  id: string;
  isSystem: boolean;
  channelId: string;
  channelName?: string;
  timestamp: string;
  senderId?: string;
  sender?: {
    id: string;
    name: string;
    image?: string;
    allianceId?: string;
    allianceTag?: string;
    alliance?: {
      name: string;
    };
    isOnline?: boolean;
    lastSeen?: string;
    level: number;
  } | null;
  content: string;
  createdAt: string;
  read?: boolean;
}

// Typing Indicator Definition
export interface TypingIndicator {
  characterId: string;
  channelId: string;
  timestamp: string;
}

export interface ChatContext {
  isInitialized: boolean;
  isChatOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  currentCharacter: Character | null;
  channels: Channel[];
  messages: Record<string, Message[]>;
  friends: Friend[];
  friendRequests: FriendRequest[];
  blacklist: BlacklistEntry[];
  loadingMessages: boolean;
  sendMessage: (channelId: string, content: string, isSystem?: boolean) => Promise<boolean>;
  joinChannel: (channelId: string) => void;
  leaveChannel: (channelId: string) => void;
  sendFriendRequest: (receiverId: string) => Promise<boolean>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  rejectFriendRequest: (requestId: string) => Promise<void>;
  addToBlacklist: (blockedId: string) => Promise<void>;
  removeFromBlacklist: (entryId: string) => Promise<void>;
  error: string | null;
  previewMessages: Message[];
  reloadChannelMessages: (channelId: string) => Promise<Message[] | undefined>;
}

export interface UseSocketReturn {
  isConnected: boolean;
  error: string | null;
  sendMessage: (channelId: string, content: string) => Promise<boolean>;
  joinChannel: (channelId: string) => void;
  leaveChannel: (channelId: string) => void;
  sendFriendRequest: (receiverId: string) => void;
  subscribeToMessages: (callback: (message: Message) => void) => () => void;
  subscribeToFriendRequests: (callback: (request: FriendRequest) => void) => () => void;
  subscribeToCharacterStatus: (callback: (data: { characterId: string; isOnline: boolean }) => void) => () => void;
  subscribeToTyping: (callback: (data: { characterId: string; channelId: string }) => void) => () => void;
}

export interface ChatService {
  initialize: (characterId: string) => void;
  subscribeToConnectionStatus: (callback: (connected: boolean) => void) => () => void;
  subscribeToErrors: (callback: (err: { message: string }) => void) => () => void;
  sendMessage: (channelId: string, content: string) => Promise<boolean>;
  joinChannel: (channelId: string) => void;
  leaveChannel: (channelId: string) => void;
  sendFriendRequest: (receiverId: string) => void;
  subscribeToMessages: (callback: (chatMessage: Message) => void) => () => void;
  subscribeToFriendRequests: (callback: (request: FriendRequest) => void) => () => void;
  subscribeToCharacterStatus: (callback: (data: { characterId: string; isOnline: boolean }) => void) => () => void;
  subscribeToTyping: (callback: (data: { characterId: string; channelId: string }) => void) => () => void;
}

