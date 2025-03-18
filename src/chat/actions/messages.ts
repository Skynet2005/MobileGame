import { Message } from "@/types/chat";
import { getApiUrl } from '@/chat/utils';

export async function getMessages(channelId: string, limit: number = 100): Promise<Message[]> {
  try {
    const response = await fetch(`/api/chat/messages?channelId=${channelId}&limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}

export async function sendMessage(channelId: string, characterId: string, content: string, allianceTag?: string, allianceId?: string) {
  try {
    const response = await fetch('/api/chat/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channelId,
        characterId,
        content,
        allianceTag,
        allianceId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

