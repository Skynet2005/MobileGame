import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/database/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const characterId = params.id;
    const { name, tag } = await request.json();

    // Validate required fields
    if (!name || !tag) {
      return NextResponse.json(
        { error: 'Name and tag are required' },
        { status: 400 }
      );
    }

    // Check if character exists
    const character = await prisma.character.findUnique({
      where: { id: characterId }
    });

    if (!character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    // Check if character is already in an alliance
    if (character.allianceId) {
      return NextResponse.json(
        { error: 'Character is already in an alliance' },
        { status: 400 }
      );
    }

    // Create the alliance
    const alliance = await prisma.alliance.create({
      data: {
        name,
        tag,
        decree: '',
        recruitingSetting: 'instant',
        preferredLanguage: 'all',
        banner: '{}',
        leader: {
          connect: { id: characterId }
        }
      }
    });

    // Create alliance member with R5 rank
    await prisma.allianceMember.create({
      data: {
        allianceId: alliance.id,
        characterId,
        rank: 'R5'
      }
    });

    // Update character with alliance info
    await prisma.character.update({
      where: { id: characterId },
      data: {
        allianceId: alliance.id,
        allianceTag: alliance.tag
      }
    });

    // Create alliance chat channel
    const allianceChannel = await prisma.chatChannel.create({
      data: {
        name: `Alliance ${alliance.tag}`,
        type: 'alliance',
        allianceId: alliance.id,
        isPrivate: true,
        members: {
          create: {
            characterId
          }
        }
      }
    });

    // Return both alliance and channel info
    return NextResponse.json(
      {
        alliance,
        channel: allianceChannel
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating alliance:', error);
    return NextResponse.json(
      { error: 'Failed to create alliance' },
      { status: 500 }
    );
  }
}
