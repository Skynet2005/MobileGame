import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/database/prisma';

export async function PUT(request: NextRequest) {
  try {
    const { characterId, newName } = await request.json();

    if (!characterId || !newName) {
      return NextResponse.json(
        { error: 'Character ID and new name are required' },
        { status: 400 }
      );
    }

    // Update character name
    const updatedCharacter = await prisma.character.update({
      where: { id: characterId },
      data: { name: newName },
      include: {
        chatMessages: true
      }
    });

    // Update all messages by this character with the new name
    await prisma.chatMessage.updateMany({
      where: { characterId: characterId },
      data: {
        // We don't need to update anything in the messages since they reference the character
        // The character's new name will be pulled when messages are fetched
      }
    });

    // Broadcast name change to all connected clients
    if (global.wss) {
      const nameChangeMessage = {
        type: 'name-updated',
        characterId: characterId,
        newName: newName
      };

      global.wss.clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(JSON.stringify(nameChangeMessage));
        }
      });
    }

    return NextResponse.json(updatedCharacter);
  } catch (error) {
    console.error('Error updating character name:', error);
    return NextResponse.json(
      { error: 'Failed to update character name' },
      { status: 500 }
    );
  }
}
