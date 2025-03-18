import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/database/prisma';

// Map to store active connections
const clients = new Map<string, ReadableStreamController<Uint8Array>>();

// Helper function to send an SSE event to a specific client
export const sendSSEEvent = async (characterId: string, event: string, data: any) => {
  const controller = clients.get(characterId);
  if (controller) {
    const formattedEvent = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(new TextEncoder().encode(formattedEvent));
  }
};

// Helper function to send an SSE event to a specific client
export const sendNotification = async (characterId: string, event: any) => {
  const controller = clients.get(characterId);
  if (controller) {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    controller.enqueue(new TextEncoder().encode(data));
  }
};

// Helper function to send SSE events to all clients or filtered clients
export const broadcastNotification = async (event: any, filter?: (characterId: string) => boolean) => {
  for (const [characterId, controller] of clients.entries()) {
    if (!filter || filter(characterId)) {
      const data = `data: ${JSON.stringify(event)}\n\n`;
      controller.enqueue(new TextEncoder().encode(data));
    }
  }
};

// Helper function to broadcast an event to all clients
export const broadcastSSEEvent = async (event: string, data: any) => {
  for (const controller of clients.values()) {
    const formattedEvent = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(new TextEncoder().encode(formattedEvent));
  }
};

// Create a readable stream for SSE
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const characterId = searchParams.get('characterId');

  if (!characterId) {
    return NextResponse.json({ error: 'Character ID is required' }, { status: 400 });
  }

  const stream = new ReadableStream({
    start: async (controller) => {
      // Store the controller for this client
      clients.set(characterId, controller);

      console.log(`SSE connection established for character: ${characterId}`);

      // Send a connection event to confirm the connection is established
      const connectEvent = `event: connected\ndata: ${JSON.stringify({ characterId, message: 'SSE connection established' })}\n\n`;
      controller.enqueue(new TextEncoder().encode(connectEvent));

      // Send a keepalive comment every 30 seconds to prevent connection timeouts
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': keepalive\n\n'));
        } catch (error) {
          clearInterval(pingInterval);
          clients.delete(characterId);
        }
      }, 30000);

      // Handle connection closed
      req.signal.addEventListener('abort', () => {
        clearInterval(pingInterval);
        clients.delete(characterId);
        console.log(`SSE connection closed for character: ${characterId}`);
      });

      // Send initial data to the client
      try {
        // Send channels
        const channels = await prisma.chatChannel.findMany({
          orderBy: { createdAt: 'asc' },
        });
        const channelsEvent = `event: initial_channels\ndata: ${JSON.stringify(channels)}\n\n`;
        controller.enqueue(new TextEncoder().encode(channelsEvent));

        // Send recent messages for world channel
        const worldChannel = channels.find(c => c.type === 'world');
        if (worldChannel) {
          const messages = await prisma.chatMessage.findMany({
            where: { channelId: worldChannel.id },
            include: {
              character: {
                select: {
                  id: true,
                  name: true,
                  level: true,
                  allianceId: true,
                  allianceTag: true,
                  alliance: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
          });

          // Filter out any messages with empty content
          const filteredMessages = messages.filter(msg =>
            msg && msg.content && msg.content.trim() !== ''
          );

          // Only send if we have valid messages
          if (filteredMessages.length > 0) {
            const messagesEvent = `event: initial_messages\ndata: ${JSON.stringify({
              channelId: worldChannel.id,
              messages: filteredMessages.map(msg => ({
                id: msg.id,
                content: msg.content,
                character: {
                  id: msg.character.id,
                  name: msg.character.name,
                  level: msg.character.level,
                  allianceId: msg.character.allianceId,
                  allianceTag: msg.character.allianceTag || (msg.character.alliance?.name || ''),
                  alliance: msg.character.alliance ? {
                    name: msg.character.alliance.name
                  } : null
                },
                timestamp: msg.createdAt.toISOString()
              }))
            })}\n\n`;
            controller.enqueue(new TextEncoder().encode(messagesEvent));
          }
        }
      } catch (error) {
        console.error('Error sending initial data via SSE:', error);
      }
    }
  });

  // Return the stream with SSE headers
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
