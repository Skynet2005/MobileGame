import { Channel } from '../../types/chat';
import { getApiUrl } from '@/chat/utils';

export async function createChannel(name: string, type: string, channelId?: string): Promise<Channel> {
  const url = getApiUrl('/api/chat/channels');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, type, id: channelId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create channel: ${response.statusText}`);
  }

  return await response.json();
}

export async function getChannels(type?: string): Promise<Channel[]> {
  const path = type ? `/api/chat/channels?type=${type}` : '/api/chat/channels';
  const url = getApiUrl(path);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch channels: ${response.statusText}`);
  }

  return await response.json();
}

export async function getChannelById(id: string): Promise<Channel> {
  const url = getApiUrl(`/api/chat/channels/${id}`);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch channel: ${response.statusText}`);
  }

  return await response.json();
}

export async function getChannelByName(name: string): Promise<Channel> {
  const url = getApiUrl(`/api/chat/channels?name=${name}`);
  const response = await fetch(url);

  return await response.json();
}

