// Unified Chat Connection Service
// This service manages all real-time connections for chat (WebSockets, SSE, WebRTC)

import webRTCService from './server/WebRtcService';
import { Channel, Message, WebSocketEventType, SSEEventType, MessageListener, FriendRequestListener, StatusListener, TypingListener, ChannelUpdateListener } from '@/types/chat';
import { Friend, FriendRequest, BlacklistEntry, Character } from "@/types/player"

export class ChatService {
  private ws: WebSocket | null = null;
  private eventSource: EventSource | null = null;
  private characterId: string | null = null;
  private wsUrl: string;
  private sseUrl: string;
  private isConnected: boolean = false;
  private isConnecting: boolean = false;
  private heartbeatInterval: number | null = null;
  private reconnectTimeout: number | null = null;

  // Event listeners
  private messageListeners: Set<MessageListener> = new Set();
  private friendRequestListeners: Set<FriendRequestListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private typingListeners: Set<TypingListener> = new Set();
  private channelUpdateListeners: Set<ChannelUpdateListener> = new Set();
  private connectionStatusListeners: Set<(isConnected: boolean) => void> = new Set();
  private errorListeners: Set<(error: Error) => void> = new Set();

  constructor() {
    // Set API endpoints
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    this.wsUrl = process.env.NODE_ENV === 'production'
      ? `${baseUrl.replace(/^http/, 'ws')}/api/ws`
      : 'ws://localhost:3001/api/ws';
    this.sseUrl = `${baseUrl}/api/chat/notifications/sse`;
  }

  // Initialize the service with a character ID
  public initialize(characterId: string): void {
    if (this.characterId === characterId && this.isConnected) {
      return; // Already initialized and connected with this character ID
    }

    this.characterId = characterId;

    // Initialize WebRTC for direct messaging
    webRTCService.initialize(characterId, this.handleWebRTCMessage.bind(this));

    // Connect to both WebSocket and Server-Sent Events
    this.connectWebSocket();
    this.connectSSE();
  }

  // Connect to WebSocket server
  private connectWebSocket(): void {
    if (!this.characterId || this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    // Close existing connection if any
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    try {
      // Connect to WebSocket server with character ID
      this.ws = new WebSocket(`${this.wsUrl}?characterId=${this.characterId}`);

      // Set up event handlers
      this.ws.onopen = this.handleWebSocketOpen.bind(this);
      this.ws.onmessage = this.handleWebSocketMessage.bind(this);
      this.ws.onclose = this.handleWebSocketClose.bind(this);
      this.ws.onerror = this.handleWebSocketError.bind(this);
    } catch (error) {
      console.error('Error connecting to WebSocket server:', error);
      this.isConnecting = false;
      this.notifyError(new Error('Failed to connect to chat server'));
    }
  }

  // Connect to Server-Sent Events endpoint
  private connectSSE(): void {
    if (!this.characterId || (this.eventSource && this.eventSource.readyState === EventSource.OPEN)) {
      return;
    }

    // Close existing connection if any
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    try {
      // Connect to SSE endpoint with Character ID
      this.eventSource = new EventSource(`${this.sseUrl}?characterId=${this.characterId}`);

      // Set up event handlers
      this.eventSource.onopen = this.handleSSEOpen.bind(this);
      this.eventSource.onerror = this.handleSSEError.bind(this);

      // Add event listeners for different SSE event types
      this.setupSSEListeners();
    } catch (error) {
      console.error('Error connecting to SSE endpoint:', error);
      this.notifyError(new Error('Failed to connect to event stream'));
    }
  }

  // Set up listeners for Server-Sent Events
  private setupSSEListeners(): void {
    if (!this.eventSource) return;

    // Chat messages
    this.eventSource.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        this.notifyMessage(data);
      } catch (error) {
        console.error('Error processing SSE message event:', error);
      }
    });

    // Name updates
    this.eventSource.addEventListener('name_update', (event) => {
      try {
        const data = JSON.parse(event.data);
        this.notifyMessage({
          id: `name-update-${Date.now()}`,
          content: `${data.oldName} changed their name to ${data.newName}`,
          isSystem: true,
          channelId: 'system',
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          sender: null
        });
        // Update all messages with the new name
        this.messageListeners.forEach(listener => {
          listener({
            id: `name-update-${Date.now()}`,
            content: `${data.oldName} changed their name to ${data.newName}`,
            isSystem: true,
            channelId: 'system',
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            sender: null
          });
        });
      } catch (error) {
        console.error('Error processing SSE name update event:', error);
      }
    });

    // Friend requests
    this.eventSource.addEventListener('friend_request', (event) => {
      try {
        const data = JSON.parse(event.data);
        this.notifyFriendRequest(data);
      } catch (error) {
        console.error('Error processing SSE friend request event:', error);
      }
    });

    // Character status updates
    this.eventSource.addEventListener('character_status', (event) => {
      try {
        const data = JSON.parse(event.data);
        this.notifyStatusUpdate(data);
      } catch (error) {
        console.error('Error processing SSE character status event:', error);
      }
    });

    // Typing indicators
    this.eventSource.addEventListener('typing', (event) => {
      try {
        const data = JSON.parse(event.data);
        this.notifyTyping(data);
      } catch (error) {
        console.error('Error processing SSE typing event:', error);
      }
    });

    // Initial channel data
    this.eventSource.addEventListener('initial_channels', (event) => {
      try {
        const channels = JSON.parse(event.data);
        this.notifyChannelUpdate(channels);
      } catch (error) {
        console.error('Error processing SSE initial channels event:', error);
      }
    });
  }

  // WebSocket event handlers
  private handleWebSocketOpen(): void {
    console.log('WebSocket connection established');
    this.isConnected = true;
    this.isConnecting = false;
    this.notifyConnectionStatus(true);

    // Start heartbeat to keep connection alive
    this.startHeartbeat();
  }

  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);

      // Dispatch by message type
      switch (data.type) {
        case 'message':
          this.notifyMessage(data.data);
          break;
        case 'friend_request':
          this.notifyFriendRequest(data.data);
          break;
        case 'character_status':
          this.notifyStatusUpdate(data.data);
          break;
        case 'typing':
          this.notifyTyping(data.data);
          break;
        case 'error':
          this.notifyError(new Error(data.data.message));
          break;
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }

  private handleWebSocketClose(event: CloseEvent): void {
    console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
    this.isConnected = false;
    this.isConnecting = false;
    this.notifyConnectionStatus(false);

    // Stop heartbeat
    if (this.heartbeatInterval !== null) {
      window.clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Attempt to reconnect
    if (event.code !== 1000) { // Not a normal closure
      this.scheduleReconnect();
    }
  }

  private handleWebSocketError(event: Event): void {
    console.error('WebSocket error:', event);
    this.notifyError(new Error('WebSocket connection error'));
    this.isConnecting = false;
  }

  // SSE event handlers
  private handleSSEOpen(): void {
    console.log('SSE connection established');
  }

  private handleSSEError(event: Event): void {
    console.error('SSE error:', event);

    // Don't treat this as a critical error if we have WebSocket working
    // Just log it and try to reconnect later
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket is still connected, continuing without SSE');
      return;
    }

    // Only notify about error if both WebSocket and SSE are failing
    this.notifyError(new Error('Connection issue with real-time updates'));

    // Attempt to reconnect SSE after a delay
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;

      // Reconnect after a delay
      setTimeout(() => this.connectSSE(), 5000);
    }
  }

  // WebRTC message handler
  private handleWebRTCMessage(message: any): void {
    if (message.type === 'direct_message') {
      // Convert to chat message format
      const Message: Message = {
        id: `webrtc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        content: message.content,
        sender: {
          id: message.from,
          name: 'Character', // Name will be fetched/filled by the chat context
          level: 0      // Level will be fetched/filled by the chat context
        },
        channelId: 'direct',
        timestamp: message.timestamp,
        createdAt: message.timestamp,
        isSystem: false
      };

      this.notifyMessage(Message);
    }
  }

  // Send a chat message
  public async sendMessage(data: {
    channelId: string;
    channelType: string;
    content: string;
    characterId: string;
    allianceTag?: string;
    allianceId?: string;
  }) {
    try {
      console.log('ChatService.sendMessage - Sending message:', data);

      // Validate character has alliance if sending to alliance chat
      if (data.channelType === 'alliance') {
        if (!data.allianceId || !data.allianceTag) {
          console.error('Cannot send alliance message - character has no alliance');
          return;
        }

        // Get the alliance channel for this alliance
        const allianceChannel = await this.getOrCreateAllianceChannel(data.allianceId);
        if (allianceChannel) {
          // Override the channelId to use the alliance channel
          data.channelId = allianceChannel.id;
        } else {
          console.error('Failed to get or create alliance channel');
          return;
        }
      }

      // Send the message to the websocket server
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'chat_message',
          data: {
            channelId: data.channelId,
            channelType: data.channelType,
            content: data.content,
            characterId: data.characterId,
            allianceTag: data.allianceTag,
            allianceId: data.allianceId
          }
        }));
      } else {
        console.error('Socket not connected');
      }
    } catch (error) {
      console.error('Error in sendMessage:', error);
    }
  }

  private async getOrCreateAllianceChannel(allianceId: string): Promise<any> {
    try {
      // First try to find existing alliance channel
      const response = await fetch('/api/chat/channels');
      const channels = await response.json();

      const allianceChannel = channels.find((channel: any) =>
        channel.type === 'alliance' && channel.allianceId === allianceId
      );

      if (allianceChannel) {
        return allianceChannel;
      }

      // If no channel exists, create one
      const createResponse = await fetch('/api/chat/channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'alliance',
          allianceId: allianceId,
          name: 'Alliance Chat'
        })
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create alliance channel');
      }

      return await createResponse.json();
    } catch (error) {
      console.error('Error in getOrCreateAllianceChannel:', error);
      return null;
    }
  }

  // Join a chat channel
  public joinChannel(channelId: string): void {
    if (!this.characterId || !this.isConnected) return;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        // Add character ID for alliance channel validation
        this.ws.send(JSON.stringify({
          type: 'join_channel',
          channelId,
          characterId: this.characterId
        }));
      } catch (error) {
        console.error('Error joining channel:', error);
      }
    }
  }

  // Leave a chat channel
  public leaveChannel(channelId: string): void {
    if (!this.characterId || !this.isConnected) return;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({
          type: 'leave_channel',
          channelId
        }));
      } catch (error) {
        console.error('Error leaving channel:', error);
      }
    }
  }

  // Send a friend request
  public sendFriendRequest(receiverId: string): void {
    if (!this.characterId || !this.isConnected) return;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({
          type: 'friend_request',
          receiverId
        }));
      } catch (error) {
        console.error('Error sending friend request:', error);
      }
    }
  }

  // Notify that character is typing in a channel
  public sendTypingIndicator(channelId: string): void {
    if (!this.characterId || !this.isConnected) return;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({
          type: 'typing',
          channelId
        }));
      } catch (error) {
        console.error('Error sending typing indicator:', error);
      }
    }
  }

  // Start WebRTC connection for direct messaging
  public startDirectChat(targetCharacterId: string): Promise<void> {
    return webRTCService.initiateConnection(targetCharacterId);
  }

  // Event notification methods
  private notifyMessage(message: Message): void {
    this.messageListeners.forEach(listener => {
      try {
        listener(message);
      } catch (error) {
        console.error('Error in message listener:', error);
      }
    });
  }

  private notifyFriendRequest(request: FriendRequest): void {
    this.friendRequestListeners.forEach(listener => {
      try {
        listener(request);
      } catch (error) {
        console.error('Error in friend request listener:', error);
      }
    });
  }

  private notifyStatusUpdate(data: { characterId: string; isOnline: boolean }): void {
    this.statusListeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Error in status listener:', error);
      }
    });
  }

  private notifyTyping(data: { characterId: string; channelId: string }): void {
    this.typingListeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Error in typing listener:', error);
      }
    });
  }

  private notifyChannelUpdate(channels: Channel[]): void {
    this.channelUpdateListeners.forEach(listener => {
      try {
        listener(channels);
      } catch (error) {
        console.error('Error in channel update listener:', error);
      }
    });
  }

  private notifyConnectionStatus(isConnected: boolean): void {
    this.connectionStatusListeners.forEach(listener => {
      try {
        listener(isConnected);
      } catch (error) {
        console.error('Error in connection status listener:', error);
      }
    });
  }

  private notifyError(error: Error): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (err) {
        console.error('Error in error listener:', err);
      }
    });
  }

  // Heartbeat to keep WebSocket connection alive
  private startHeartbeat(): void {
    if (this.heartbeatInterval !== null) {
      window.clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ type: 'heartbeat' }));
        } catch (error) {
          console.error('Error sending heartbeat:', error);
        }
      }
    }, 30000);
  }

  // Schedule a reconnection attempt
  private scheduleReconnect(): void {
    if (this.reconnectTimeout !== null) {
      window.clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = window.setTimeout(() => {
      console.log('Attempting to reconnect...');
      this.connectWebSocket();
    }, 5000);
  }

  // Clean up all connections
  public disconnect(): void {
    // Clear intervals and timeouts
    if (this.heartbeatInterval !== null) {
      window.clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.reconnectTimeout !== null) {
      window.clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Close WebSocket
    if (this.ws) {
      this.ws.onclose = null; // Prevent reconnection attempt
      this.ws.close();
      this.ws = null;
    }

    // Close SSE
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    // Close WebRTC connections
    webRTCService.closeAllConnections();

    // Reset state
    this.isConnected = false;
    this.isConnecting = false;
    this.notifyConnectionStatus(false);
  }

  // Subscribe to events
  public subscribeToMessages(listener: MessageListener): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  public subscribeToFriendRequests(listener: FriendRequestListener): () => void {
    this.friendRequestListeners.add(listener);
    return () => this.friendRequestListeners.delete(listener);
  }

  public subscribeToCharacterStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  public subscribeToTyping(listener: TypingListener): () => void {
    this.typingListeners.add(listener);
    return () => this.typingListeners.delete(listener);
  }

  public subscribeToChannelUpdates(listener: ChannelUpdateListener): () => void {
    this.channelUpdateListeners.add(listener);
    return () => this.channelUpdateListeners.delete(listener);
  }

  public subscribeToConnectionStatus(listener: (isConnected: boolean) => void): () => void {
    this.connectionStatusListeners.add(listener);
    listener(this.isConnected); // Immediately notify with current status
    return () => this.connectionStatusListeners.delete(listener);
  }

  public subscribeToErrors(listener: (error: Error) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  // Getters
  public get connected(): boolean {
    return this.isConnected && this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  // Ensure connection is active (reconnect if needed)
  public ensureConnection(): void {
    // If not connected, try to reconnect
    if (!this.connected && !this.isConnecting && this.characterId) {
      console.log('Ensuring chat connection is active...');
      this.connectWebSocket();
      this.connectSSE();
    }
  }

  // Close connections
  public close(): void {
    this.disconnect();
  }
}

// Export a singleton instance
const chatService = new ChatService();
export default chatService;
