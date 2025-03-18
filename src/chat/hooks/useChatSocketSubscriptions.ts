import { useEffect } from 'react';
import { FriendRequest, Character } from '@/types/player';
import { Message, UseSocketReturn } from '@/types/chat';

interface ExtendedChatContext {
  socket: UseSocketReturn;
  currentCharacter: Character | null;
  processMessage: (message: any) => Message;
  updateMessages: (message: Message) => void;
  updateFriendStatus: (characterId: string, isOnline: boolean) => void;
  setFriendRequests: React.Dispatch<React.SetStateAction<FriendRequest[]>>;
}

const useChatSocketSubscriptions = (chat: ExtendedChatContext) => {
  const { socket, currentCharacter, processMessage, updateMessages, updateFriendStatus, setFriendRequests } = chat;

  useEffect(() => {
    if (!socket.isConnected || !currentCharacter) return;

    // Subscribe to new messages.
    const messageUnsub = socket.subscribeToMessages((socketMessage: any) => {
      try {
        console.log('Raw socket message received:', socketMessage);

        if (!socketMessage) {
          console.warn('Skipping null/undefined socket message');
          return;
        }

        // Validate message structure
        if (typeof socketMessage !== 'object') {
          console.warn('Invalid message format - not an object:', socketMessage);
          return;
        }

        // Extract message data based on message format
        let messageData;
        if (socketMessage.type === 'message' && socketMessage.message) {
          messageData = socketMessage.message;
          console.log('Extracted message data from type:message format:', messageData);
        } else {
          messageData = socketMessage;
          console.log('Using direct message data format:', messageData);
        }

        // Get the channel ID from the outer message if it exists, otherwise from the message data
        const channelId = socketMessage.channelId || messageData.channelId;

        // Validate required fields
        if (!messageData.id || !messageData.content || !channelId) {
          console.warn('Message missing required fields:', { messageData, channelId });
          return;
        }

        const messageToProcess = {
          id: messageData.id,
          content: messageData.content,
          channelId: channelId, // Use the extracted channelId
          characterId: messageData.characterId,
          createdAt: messageData.createdAt
            ? (typeof messageData.createdAt === 'number'
              ? new Date(messageData.createdAt).toISOString()
              : messageData.createdAt)
            : new Date().toISOString(),
          sender: messageData.sender || (currentCharacter
            ? {
              id: currentCharacter.id,
              name: currentCharacter.name,
              level: currentCharacter.level,
              allianceTag: currentCharacter.allianceTag,
            }
            : null),
        };

        console.log('Processing message for channel:', channelId);
        const convertedMessage = processMessage(messageToProcess);

        if (!convertedMessage.channelId) {
          console.warn('Converted message missing channelId:', convertedMessage);
          return;
        }

        console.log('Updating messages with:', convertedMessage);
        updateMessages(convertedMessage);
      } catch (error) {
        console.error('Error processing socket message:', error);
      }
    });

    // Subscribe to friend requests.
    const requestUnsub = socket.subscribeToFriendRequests((socketRequest: any) => {
      if (setFriendRequests) {
        setFriendRequests((prev: FriendRequest[]) => {
          const convertedRequest: FriendRequest = {
            id: socketRequest.id,
            senderId: socketRequest.senderId,
            receiverId: socketRequest.receiverId,
            createdAt: new Date(),
            status:
              socketRequest.status === 'PENDING'
                ? 'PENDING'
                : socketRequest.status === 'ACCEPTED'
                  ? 'ACCEPTED'
                  : socketRequest.status === 'REJECTED'
                    ? 'REJECTED'
                    : 'PENDING',
            sender: socketRequest.sender
              ? {
                id: socketRequest.sender.id,
                name: socketRequest.sender.name,
                level: 0,
                accountId: socketRequest.sender.accountId || '',
              }
              : {
                id: socketRequest.senderId,
                name: 'Unknown',
                level: 0,
                accountId: '',
              },
          };
          if (prev.some((r: FriendRequest) => r.id === convertedRequest.id)) return prev;
          return [...prev, convertedRequest];
        });
      }
    });

    // Subscribe to character status changes.
    const statusUnsub = socket.subscribeToCharacterStatus(({ characterId, isOnline }: { characterId: string; isOnline: boolean }) => {
      updateFriendStatus(characterId, isOnline);
    });

    return () => {
      messageUnsub();
      requestUnsub();
      statusUnsub();
    };
  }, [socket.isConnected, currentCharacter, socket, processMessage, updateMessages, updateFriendStatus, setFriendRequests]);
};

export default useChatSocketSubscriptions;
