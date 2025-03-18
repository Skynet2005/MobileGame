import { createServer, IncomingMessage } from 'http';
import { WebSocketServer } from 'ws';
import { parse } from 'url';
import { NextApiRequest } from 'next';
import { prisma } from '@/database/prisma';

// Custom interface extending WebSocket
interface ChatWebSocket extends WebSocket {
  characterId: string;
  isAlive: boolean;
  channels: Set<string>;
  on(event: 'pong', listener: () => void): this;
  on(event: 'message', listener: (data: string) => void): this;
  on(event: 'close', listener: () => void): this;
}

// Maintain a list of connected clients
const clients = new Map<string, ChatWebSocket>();

// Create an HTTP server and WebSocket server
const httpServer = createServer();
const wss = new WebSocketServer({ noServer: true });

// Event handler for when a client connects
wss.on('connection', (ws: ChatWebSocket, _request: IncomingMessage, characterId: string) => {
  // Set properties for this client
  ws.characterId = characterId;
  ws.isAlive = true;
  ws.channels = new Set();

  // Store the client connection
  clients.set(characterId, ws);

  console.log(`Character ${characterId} connected`);

  // Send an initial welcome message
  sendToClient(ws, {
    type: 'connected',
    data: { characterId, message: 'Connected to chat server' }
  });

  // Broadcast character's online status to friends
  broadcastCharacterStatus(characterId, true);

  // Update character's online status in database
  updateCharacterOnlineStatus(characterId, true);

  // Set up ping interval to keep connection alive
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  // Handle messages from the client
  ws.on('message', async (message: string) => {
    try {
      const data = JSON.parse(message);
      handleClientMessage(ws, data);
    } catch (error) {
      console.error('Error processing message:', error);
      sendToClient(ws, {
        type: 'error',
        data: { message: 'Invalid message format' }
      });
    }
  });

  // Handle disconnection
  ws.on('close', () => {
    console.log(`Character ${characterId} disconnected`);
    clients.delete(characterId);

    // Broadcast character's offline status to friends
    broadcastCharacterStatus(characterId, false);

    // Update character's online status in database
    updateCharacterOnlineStatus(characterId, false);
  });
});

// Ping all clients every 30 seconds to keep connections alive
const pingInterval = setInterval(() => {
  Array.from(wss.clients).forEach((ws) => {
    const chatWs = ws as unknown as ChatWebSocket;
    if (chatWs.isAlive === false) {
      console.log(`Terminating inactive connection for character ${chatWs.characterId}`);
      return ws.terminate();
    }

    chatWs.isAlive = false;
    ws.ping();
  });
}, 30000);

// Clean up interval on server close
wss.on('close', () => {
  clearInterval(pingInterval);
});

// Handle upgrade requests (HTTP to WebSocket)
httpServer.on('upgrade', (request, socket, head) => {
  const { pathname, query } = parse(request.url!, true);

  // Only handle WebSocket connections to /api/ws route
  if (pathname === '/api/ws') {
    // Extract character ID from query parameters
    const characterId = Array.isArray(query.characterId)
      ? query.characterId[0]
      : query.characterId as string;

    if (!characterId) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    // Handle WebSocket upgrade
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request, characterId);
    });
  } else {
    socket.destroy();
  }
});

// Handle client messages based on their type
async function handleClientMessage(ws: ChatWebSocket, data: any) {
  switch (data.type) {
    case 'join_channel':
      joinChannel(ws, data.channelId);
      break;

    case 'leave_channel':
      leaveChannel(ws, data.channelId);
      break;

    case 'message':
      await handleChatMessage(ws, data);
      break;

    case 'friend_request':
      await handleFriendRequest(ws, data);
      break;

    case 'typing':
      notifyTyping(ws, data.channelId);
      break;

    case 'heartbeat':
      ws.isAlive = true;
      break;

    default:
      sendToClient(ws, {
        type: 'error',
        data: { message: 'Unknown message type' }
      });
  }
}

// Join a channel
function joinChannel(ws: ChatWebSocket, channelId: string) {
  ws.channels.add(channelId);
  sendToClient(ws, {
    type: 'channel_joined',
    data: { channelId }
  });

  // Notify channel members about new character
  broadcastToChannel(channelId, {
    type: 'character_joined',
    data: { characterId: ws.characterId, channelId }
  }, ws.characterId);
}

// Leave a channel
function leaveChannel(ws: ChatWebSocket, channelId: string) {
  ws.channels.delete(channelId);
  sendToClient(ws, {
    type: 'channel_left',
    data: { channelId }
  });

  // Notify channel members about character leaving
  broadcastToChannel(channelId, {
    type: 'character_left',
    data: { characterId: ws.characterId, channelId }
  }, ws.characterId);
}

// Handle and broadcast chat messages
async function handleChatMessage(ws: ChatWebSocket, data: any) {
  try {
    const { channelId, content, characterId } = data;

    if (!channelId || !content || !characterId) {
      console.error('Missing required message fields:', { channelId, content, characterId });
      return;
    }

    // Get channel details
    const channel = await prisma.chatChannel.findUnique({
      where: { id: channelId },
      include: { members: true }
    });

    if (!channel) {
      console.error('Channel not found:', channelId);
      return;
    }

    console.log('Processing message for channel:', {
      channelId,
      channelType: channel.type,
      allianceId: channel.allianceId
    });

    // Get character details
    const character = await prisma.character.findUnique({
      where: { id: characterId }
    });

    if (!character) {
      console.error('Character not found:', characterId);
      return;
    }

    // For alliance channels, verify character is in the alliance
    if (channel.type === 'alliance' && channel.allianceId) {
      console.log('Verifying alliance membership:', {
        characterId,
        allianceId: channel.allianceId
      });

      const isMember = await prisma.allianceMember.findUnique({
        where: {
          allianceId_characterId: {
            allianceId: channel.allianceId,
            characterId: character.id
          }
        }
      });

      if (!isMember) {
        console.error('Character not in alliance:', characterId);
        return;
      }

      console.log('Alliance membership verified for character:', characterId);
    }

    // Create the message
    const chatMessage = await prisma.chatMessage.create({
      data: {
        content,
        channelId,
        characterId
      },
      select: {
        id: true,
        content: true,
        channelId: true,
        characterId: true,
        createdAt: true
      }
    });

    // Prepare broadcast message
    const broadcastMessage = {
      type: 'message',
      channelId,
      message: {
        id: chatMessage.id,
        content: chatMessage.content,
        channelId: chatMessage.channelId,
        characterId: chatMessage.characterId,
        createdAt: chatMessage.createdAt,
        sender: {
          id: character.id,
          name: character.name,
          allianceId: character.allianceId,
          allianceTag: character.allianceTag
        }
      }
    };

    console.log('Broadcasting message:', {
      type: channel.type,
      channelId,
      messageId: chatMessage.id,
      allianceId: channel.allianceId || 'none'
    });

    // Broadcast to appropriate clients
    if (channel.type === 'alliance' && channel.allianceId) {
      // For alliance chat, only send to alliance members
      const allianceMembers = await prisma.allianceMember.findMany({
        where: { allianceId: channel.allianceId },
        select: { characterId: true }
      });
      const memberIds = allianceMembers.map(m => m.characterId);

      console.log('Broadcasting to alliance members:', {
        allianceId: channel.allianceId,
        memberCount: memberIds.length,
        memberIds
      });

      let messagesSent = 0;
      clients.forEach(client => {
        if (client.characterId && memberIds.includes(client.characterId)) {
          client.send(JSON.stringify(broadcastMessage));
          messagesSent++;
        }
      });

      console.log(`Sent alliance message to ${messagesSent} members`);
    } else {
      // For other channels, broadcast to all connected clients
      console.log('Broadcasting to all clients');
      let messagesSent = 0;
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(broadcastMessage));
          messagesSent++;
        }
      });
      console.log(`Sent message to ${messagesSent} clients`);
    }
  } catch (error) {
    console.error('Error handling chat message:', error);
  }
}

// Handle friend requests
async function handleFriendRequest(ws: ChatWebSocket, data: any) {
  const { receiverId } = data;

  try {
    // Create friend request in database
    const request = await prisma.friendRequest.create({
      data: {
        senderId: ws.characterId,
        receiverId,
        status: 'pending'
      },
      include: {
        sender: true
      }
    });

    // Format request for sending
    const formattedRequest = {
      id: request.id,
      senderId: request.senderId,
      createdAt: request.createdAt.toISOString(),
      status: request.status,
      sender: {
        id: request.sender.id,
        name: request.sender.name,
        level: request.sender.level
      }
    };

    // Send to receiver if they're online
    const receiverWs = clients.get(receiverId);
    if (receiverWs) {
      sendToClient(receiverWs, {
        type: 'friend_request',
        data: formattedRequest
      });
    }

    // Confirm to sender
    sendToClient(ws, {
      type: 'friend_request_sent',
      data: formattedRequest
    });
  } catch (error) {
    console.error('Error creating friend request:', error);
    sendToClient(ws, {
      type: 'error',
      data: { message: 'Failed to send friend request' }
    });
  }
}

// Notify characters in a channel about typing
function notifyTyping(ws: ChatWebSocket, channelId: string) {
  broadcastToChannel(channelId, {
    type: 'typing',
    data: { characterId: ws.characterId, channelId }
  }, ws.characterId);
}

// Broadcast a message to all characters in a channel
function broadcastToChannel(channelId: string, message: any, excludeCharacterId?: string) {
  for (const client of clients.values()) {
    if (client.channels.has(channelId) && (!excludeCharacterId || client.characterId !== excludeCharacterId)) {
      sendToClient(client, message);
    }
  }
}

// Broadcast character status to all friends
async function broadcastCharacterStatus(characterId: string, isOnline: boolean) {
  try {
    // Find character's friends
    const friends = await prisma.friend.findMany({
      where: {
        OR: [
          { characterId },
          { friendId: characterId }
        ]
      },
      include: {
        character: true,
        friend: true
      }
    });

    // Get IDs of friends
    const friendIds = friends.map((f: { characterId: string; friendId: string }) =>
      f.characterId === characterId ? f.friendId : f.characterId
    );

    // Send status update to online friends
    for (const friendId of friendIds) {
      const friendWs = clients.get(friendId);
      if (friendWs) {
        sendToClient(friendWs, {
          type: 'character_status',
          data: { characterId, isOnline }
        });
      }
    }
  } catch (error) {
    console.error('Error broadcasting character status:', error);
  }
}

// Update character's online status in database
async function updateCharacterOnlineStatus(characterId: string, isOnline: boolean) {
  try {
    await prisma.character.update({
      where: { id: characterId },
      data: {
        isOnline,
        lastSeen: new Date()
      }
    });
  } catch (error) {
    console.error('Error updating character status in database:', error);
  }
}

// Helper to send messages to a client with error handling
function sendToClient(client: ChatWebSocket, message: any) {
  try {
    client.send(JSON.stringify(message));
  } catch (error) {
    console.error('Error sending message to client:', error);
  }
}

// Start the server on a specified port
export const startWebSocketServer = (port: number = 3001) => {
  httpServer.listen(port, () => {
    console.log(`WebSocket server is running on port ${port}`);
  });

  return () => {
    httpServer.close();
    wss.close();
  };
};

// Export a function to create a server-side WebSocket handler for API routes
export function createWebSocketHandler() {
  return (req: NextApiRequest, res: any) => {
    // The actual upgrade handling is done in the httpServer.on('upgrade') handler
    res.end('WebSocket endpoint');
  };
}

export function setupWebSocketServer(port: number) {
  const wss = new WebSocketServer({ port });
  console.log(`Starting WebSocket server on port ${port}...`);

  const connectedClients = new Map();

  wss.on('connection', (ws, req) => {
    let characterId: string | null = null;

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'identify') {
          characterId = message.characterId;
          connectedClients.set(characterId, ws);
          console.log(`Character ${characterId} connected`);
          return;
        }

        if (message.type === 'message') {
          console.log('Processing message:', message);

          if (!message.channelId || !message.content || !message.characterId) {
            console.error('Missing required message fields');
            return;
          }

          try {
            // Get character details
            const character = await prisma.character.findUnique({
              where: { id: message.characterId },
              select: {
                id: true,
                name: true,
                level: true,
                allianceId: true,
                allianceTag: true
              }
            });

            if (!character) {
              console.error('Character not found');
              return;
            }

            // Create the message in the database
            const chatMessage = await prisma.chatMessage.create({
              data: {
                content: message.content,
                channelId: message.channelId,
                characterId: message.characterId
              },
              select: {
                id: true,
                content: true,
                channelId: true,
                characterId: true,
                createdAt: true
              }
            });

            // Broadcast the message to all connected clients
            const broadcastMessage = {
              type: 'message',
              channelId: chatMessage.channelId,
              message: {
                id: chatMessage.id,
                content: chatMessage.content,
                channelId: chatMessage.channelId,
                characterId: chatMessage.characterId,
                createdAt: chatMessage.createdAt,
                sender: {
                  id: character.id,
                  name: character.name,
                  allianceId: character.allianceId,
                  allianceTag: character.allianceTag
                }
              }
            };

            wss.clients.forEach((client) => {
              if (client.readyState === 1) { // WebSocket.OPEN
                client.send(JSON.stringify(broadcastMessage));
              }
            });
          } catch (error) {
            console.error('Error processing message:', error);
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      if (characterId) {
        console.log(`Character ${characterId} disconnected`);
        connectedClients.delete(characterId);
      }
    });
  });

  console.log('WebSocket server startup complete.');
  return wss;
}
