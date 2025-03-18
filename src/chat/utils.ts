// src/chat/utils.ts
"use client"

import { createContext } from 'react';
import { ChatContext as ChatContextType } from '@/types/chat';

// Hardcoded channel IDs for consistent reference
export const CHANNEL_IDS = {
  WORLD: 'world-chat-global-f8c7e6d5',
  SYSTEM_ANNOUNCEMENTS: 'system-announcements-a1b2c3d4'
};

// Helper to handle URLs on both client and server
export function getApiUrl(path: string): string {
  // Check if we're running on the server
  if (typeof window === 'undefined') {
    // Server-side - need absolute URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    return `${baseUrl}${path}`;
  }
  // Client-side - relative URL is fine
  return path;
}

// Create the chat context for React's context API
export const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Helper to create timeouts that can be safely managed
export const createTimeout = (callback: () => void, ms: number): { timeout: NodeJS.Timeout, clear: () => void } => {
  const timeout = setTimeout(callback, ms);
  return {
    timeout,
    clear: () => clearTimeout(timeout)
  };
};

// Helper function to fetch with timeout
export const fetchWithTimeout = async (fetchPromise: Promise<any>, timeoutMs: number = 5000) => {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([fetchPromise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
};

// Helper function to safely make API calls with tracking to prevent duplicates
// This should be used within a component with proper React hooks
export const safeApiCall = async <T extends any>(
  key: string,
  apiCall: () => Promise<T>,
  onSuccess: (data: T) => void,
  timeoutMs: number = 5000,
  pendingRequestsRef: React.MutableRefObject<Record<string, boolean>>
): Promise<void> => {
  // If this request is already in progress, skip
  if (pendingRequestsRef.current[key]) {
    return;
  }

  pendingRequestsRef.current[key] = true;

  try {
    const data = await fetchWithTimeout(apiCall(), timeoutMs);
    onSuccess(data);
  } catch (error) {
    console.error(`API call '${key}' failed:`, error);
    // Don't set global error for individual API calls to avoid cascading errors
  } finally {
    pendingRequestsRef.current[key] = false;
  }
};
