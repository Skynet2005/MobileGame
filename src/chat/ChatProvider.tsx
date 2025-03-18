'use client';

import { ReactNode, useContext } from 'react';
import { ChatContext } from './utils';
import useChatLogic from './hooks/useChatLogic';
import useChatSocketSubscriptions from './hooks/useChatSocketSubscriptions';

export function ChatProvider({ children }: { children: ReactNode }) {
  // Initialize all chat state and actions
  const chat = useChatLogic();

  // Subscribe to socket events in a separate hook.
  useChatSocketSubscriptions(chat);

  return (
    <ChatContext.Provider value={chat}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
