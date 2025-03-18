import { Friend, FriendRequest } from '@/types/player';
import { getApiUrl } from '@/chat/utils';

export async function getFriends(characterId: string): Promise<Friend[]> {
  const url = getApiUrl(`/api/chat/friends?characterId=${characterId}`);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch friends: ${response.statusText}`);
  }

  return await response.json();
}

export async function getFriendRequests(characterId: string): Promise<FriendRequest[]> {
  const url = getApiUrl(`/api/chat/friends/requests?characterId=${characterId}`);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch friend requests: ${response.statusText}`);
  }

  return await response.json();
}

export async function respondToFriendRequest(requestId: string, status: 'accepted' | 'rejected'): Promise<{ id: string }> {
  const url = getApiUrl(`/api/chat/friends/requests/${requestId}`);
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error(`Failed to respond to friend request: ${response.statusText}`);
  }

  return await response.json();
}

export async function sendFriendRequest(senderId: string, receiverId: string): Promise<{ id: string }> {
  const url = getApiUrl('/api/chat/friends/requests');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ senderId, receiverId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send friend request: ${response.statusText}`);
  }

  return await response.json();
}

export async function removeFriend(friendId: string): Promise<{ success: boolean }> {
  const url = getApiUrl(`/api/chat/friends/${friendId}`);
  const response = await fetch(url, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to remove friend: ${response.statusText}`);
  }

  return { success: true };
}
