import { Account, AccountSettings, Character } from "@/types/player";
import { fetchWithTimeout, getApiUrl } from "@/chat/utils";

/**
 * Retrieves the account information for a character
 * @param characterId The ID of the character
 * @returns The account information
 */
export async function getAccount(characterId: string): Promise<Account> {
  try {
    const url = getApiUrl(`/api/account/${characterId}`);
    const response = await fetchWithTimeout(fetch(url));

    if (!response.ok) {
      throw new Error(`Failed to fetch account: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching account:', error);
    throw error;
  }
}

/**
 * Updates account settings for a character
 * @param characterId The ID of the character
 * @param settings The settings to update
 * @returns The updated account information
 */
export async function updateAccountSettings(characterId: string, settings: Partial<AccountSettings>): Promise<Account> {
  try {
    const url = getApiUrl(`/api/account/${characterId}/settings`);
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error(`Failed to update account settings: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating account settings:', error);
    throw error;
  }
}

/**
 * Changes the email address for an account
 * @param characterId The ID of the character
 * @param newEmail The new email address
 * @returns The updated account information
 */
export async function changeEmail(characterId: string, newEmail: string): Promise<Account> {
  try {
    const url = getApiUrl(`/api/account/${characterId}/email`);
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: newEmail }),
    });

    if (!response.ok) {
      throw new Error(`Failed to change email: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error changing email:', error);
    throw error;
  }
}

/**
 * Changes the password for an account
 * @param characterId The ID of the character
 * @param currentPassword The current password
 * @param newPassword The new password
 * @returns Success message
 */
export async function changePassword(
  characterId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  try {
    const url = getApiUrl(`/api/account/${characterId}/password`);
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to change password: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
}

/**
 * Deactivates a character account
 * @param characterId The ID of the character
 * @param reason Optional reason for deactivation
 * @returns Success message
 */
export async function deactivateAccount(
  characterId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const url = getApiUrl(`/api/account/${characterId}/deactivate`);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      throw new Error(`Failed to deactivate account: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error deactivating account:', error);
    throw error;
  }
}
