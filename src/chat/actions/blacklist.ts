import { BlacklistEntry } from '@/types/player';
import { getApiUrl } from '@/chat/utils';

export async function getBlacklist(characterId: string): Promise<BlacklistEntry[]> {
  const url = getApiUrl(`/api/chat/blacklist?characterId=${characterId}`);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch blacklist: ${response.statusText}`);
  }

  return await response.json();
}

export async function addToBlacklist(characterId: string, blockedId: string): Promise<BlacklistEntry> {
  const url = getApiUrl('/api/chat/blacklist');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ characterId, blockedId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to add to blacklist: ${response.statusText}`);
  }

  return await response.json();
}

export async function removeFromBlacklist(entryId: string): Promise<{ success: boolean }> {
  const url = getApiUrl(`/api/chat/blacklist/${entryId}`);
  const response = await fetch(url, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to remove from blacklist: ${response.statusText}`);
  }

  return { success: true };
}
