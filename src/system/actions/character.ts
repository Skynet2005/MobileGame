import { Character } from "@/types/player";
import { getApiUrl } from '@/chat/utils';

export async function createCharacter(name: string, level = 1, allianceTag = '', accountId: string): Promise<Character> {
  const url = getApiUrl('/api/characters');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, level, allianceTag, accountId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create user: ${response.statusText}`);
  }

  return await response.json();
}

export async function getCharacter(id: string): Promise<Character> {
  const url = getApiUrl(`/api/characters/${id}`);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch character: ${response.statusText}`);
  }

  return await response.json();
}

export async function getCharacterByName(name: string): Promise<Character> {
  const url = getApiUrl(`/api/characters/search?q=${encodeURIComponent(name)}`);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch character: ${response.statusText}`);
  }

  const characters = await response.json();
  return characters[0];
}

export async function getCharacterByAllianceTag(allianceTag: string): Promise<Character> {
  const url = getApiUrl(`/api/characters/search?q=${encodeURIComponent(allianceTag)}`);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch character: ${response.statusText}`);
  }

  const characters = await response.json();
  return characters[0];
}

export async function searchCharacters(accountId: string) {
  try {
    const response = await fetch(getApiUrl(`/api/characters/search?accountId=${accountId}`));
    if (!response.ok) {
      throw new Error('Failed to search characters');
    }
    return await response.json();
  } catch (error) {
    console.error('Error searching characters:', error);
    throw error;
  }
}

export async function updateCharacterStatus(id: string, isOnline: boolean, allianceTag?: string): Promise<Character> {
  const url = getApiUrl(`/api/characters/${id}`);
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      isOnline,
      ...(allianceTag && { allianceTag })
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update user status: ${response.statusText}`);
  }

  return await response.json();
}
