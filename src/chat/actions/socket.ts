import { useEffect, useRef } from 'react';
import { Message } from '@/types/chat';

export interface UseSocketReturn {
  error: string | null;
  connected: boolean;
  joinChannel: (channelId: string) => void;
  leaveChannel: (channelId: string) => void;
  sendMessage: (channelId: string, content: string) => Promise<boolean>;
  sendFriendRequest: (receiverId: string) => void;
  subscribe: (event: string, callback: (data: any) => void) => void;
  unsubscribe: (event: string, callback: (data: any) => void) => void;
  updateName: (newName: string) => void;
}

/**
 * Custom hook for WebSocket communication
 * @param characterId The ID of the current character
 * @returns Socket interface for chat communication
 */

export default function useSocket(characterId: string): UseSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const errorRef = useRef<string | null>(null);
  const connectedRef = useRef<boolean>(false);
  const eventListeners = useRef<Map<string, Set<(data: any) => void>>>(new Map());

  useEffect(() => {
    if (!characterId) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    const ws = new WebSocket(`${wsUrl}/api/ws?characterId=${characterId}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
      connectedRef.current = true;
      errorRef.current = null;
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      connectedRef.current = false;
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (wsRef.current === ws) {
          useSocket(characterId);
        }
      }, 5000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      errorRef.current = 'Failed to connect to chat server';
      connectedRef.current = false;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const listeners = eventListeners.current.get(data.type);
        if (listeners) {
          listeners.forEach(listener => listener(data.data));
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    wsRef.current = ws;

    // Cleanup on unmount
    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [characterId]);

  const joinChannel = (channelId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'join_channel',
        channelId
      }));
    }
  };

  const leaveChannel = (channelId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'leave_channel',
        channelId
      }));
    }
  };

  const sendMessage = async (channelId: string, content: string): Promise<boolean> => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return false;

    return new Promise((resolve) => {
      try {
        wsRef.current!.send(JSON.stringify({
          type: 'message',
          channelId,
          content,
          characterId
        }));
        resolve(true);
      } catch (error) {
        console.error('Error sending message:', error);
        resolve(false);
      }
    });
  };

  const sendFriendRequest = (receiverId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'friend_request',
        receiverId
      }));
    }
  };

  const updateName = (newName: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'name_update',
        characterId,
        newName
      }));
    }
  };

  const subscribe = (event: string, callback: (data: any) => void) => {
    if (!eventListeners.current.has(event)) {
      eventListeners.current.set(event, new Set());
    }
    eventListeners.current.get(event)!.add(callback);
  };

  const unsubscribe = (event: string, callback: (data: any) => void) => {
    const listeners = eventListeners.current.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  };

  return {
    error: errorRef.current,
    connected: connectedRef.current,
    joinChannel,
    leaveChannel,
    sendMessage,
    sendFriendRequest,
    subscribe,
    unsubscribe,
    updateName
  };
}
