import { prisma } from '@/database/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    // Destructure and await both request body and params
    const [{ characterId }, { channelId }] = await Promise.all([
      request.json(),
      params
    ]);

    if (!channelId || !characterId) {
      return NextResponse.json(
        { error: 'Channel ID and character ID are required' },
        { status: 400 }
      );
    }

    // Check if member already exists
    const existingMember = await prisma.chatMember.findUnique({
      where: {
        channelId_characterId: {
          channelId,
          characterId
        }
      }
    });

    if (existingMember) {
      return NextResponse.json(existingMember);
    }

    // Create new member if doesn't exist
    const member = await prisma.chatMember.create({
      data: {
        channelId,
        characterId
      }
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error('Error adding member to channel:', error);
    return NextResponse.json(
      { error: 'Failed to add member to channel' },
      { status: 500 }
    );
  }
}
