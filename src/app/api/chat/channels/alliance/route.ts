import { NextResponse } from 'next/server';
import { prisma } from '@/database/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { allianceId, name } = body;

    // Create a new alliance channel
    const channel = await prisma.chatChannel.create({
      data: {
        name: name || 'Alliance',
        type: 'alliance',
        description: 'Alliance chat channel',
        isPrivate: true,
        allianceId: allianceId || null // Allow null for characters not in an alliance
      }
    });

    return NextResponse.json(channel);
  } catch (error) {
    console.error('Error creating alliance channel:', error);
    return NextResponse.json(
      { error: 'Failed to create alliance channel' },
      { status: 500 }
    );
  }
}
