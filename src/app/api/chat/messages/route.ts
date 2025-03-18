import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/database/prisma';

// GET messages for a specific channel
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const channelId = searchParams.get('channelId');
  const limit = parseInt(searchParams.get('limit') || '100');

  if (!channelId) {
    return NextResponse.json({ error: 'Channel ID is required' }, { status: 400 });
  }

  try {
    console.log(`Fetching messages for channel ${channelId} with limit ${limit}`);
    const messages = await prisma.chatMessage.findMany({
      where: {
        channelId: channelId,
      },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            level: true,
            allianceId: true,
            allianceTag: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: limit
    });

    // Format messages to include sender information
    const formattedMessages = messages.map(message => ({
      id: message.id,
      content: message.content,
      channelId: message.channelId,
      timestamp: message.createdAt,
      sender: {
        id: message.character.id,
        name: message.character.name,
        level: message.character.level,
        allianceId: message.character.allianceId,
        allianceTag: message.character.allianceTag
      }
    }));

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST a new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelId, characterId, content } = body;

    if (!channelId || !characterId || !content) {
      return NextResponse.json(
        { error: 'Channel ID, character ID, and content are required' },
        { status: 400 }
      );
    }

    // Get character details first
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      select: {
        id: true,
        name: true,
        level: true,
        allianceId: true,
        allianceTag: true
      }
    });

    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    // Get channel details
    const channel = await prisma.chatChannel.findUnique({
      where: { id: channelId },
      select: {
        id: true,
        type: true,
        allianceId: true
      }
    });

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    // For alliance channels, verify the character is in the alliance
    if (channel.type === 'alliance') {
      if (!character.allianceId || character.allianceId !== channel.allianceId) {
        return NextResponse.json({ error: 'Character not in alliance' }, { status: 403 });
      }
    }

    const message = await prisma.chatMessage.create({
      data: {
        channelId,
        characterId,
        content,
        allianceId: character.allianceId,
        allianceTag: character.allianceTag
      },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            level: true,
            allianceId: true,
            allianceTag: true
          }
        },
        channel: true
      }
    });

    // Format the response
    const formattedMessage = {
      id: message.id,
      content: message.content,
      channelId: message.channelId,
      channelType: channel.type,
      timestamp: message.createdAt,
      sender: {
        id: message.character.id,
        name: message.character.name,
        level: message.character.level,
        allianceId: message.character.allianceId,
        allianceTag: message.character.allianceTag
      }
    };

    return NextResponse.json(formattedMessage);
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}

// DELETE messages from a channel
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const channelId = searchParams.get('channelId');

  if (!channelId) {
    return NextResponse.json({ error: 'Channel ID is required' }, { status: 400 });
  }

  try {
    // Verify the channel exists
    const channelExists = await prisma.chatChannel.findUnique({
      where: { id: channelId },
      select: { id: true }
    });

    if (!channelExists) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    // Delete all messages in this channel
    const { count } = await prisma.chatMessage.deleteMany({
      where: { channelId: channelId }
    });

    console.log(`Deleted ${count} messages from channel ${channelId}`);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${count} messages from channel`
    });
  } catch (error) {
    console.error('Error deleting messages:', error);
    return NextResponse.json({ error: 'Failed to delete messages' }, { status: 500 });
  }
}
