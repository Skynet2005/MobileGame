import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/database/prisma';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { name, tag, characterId } = data;

    // Validate required fields
    if (!name || !tag || !characterId) {
      return NextResponse.json(
        { error: 'Name, tag, and characterId are required' },
        { status: 400 }
      );
    }

    // Validate tag format (3-4 characters)
    if (tag.length < 3 || tag.length > 4) {
      return NextResponse.json(
        { error: 'Alliance tag must be 3-4 characters' },
        { status: 400 }
      );
    }

    // Check if tag is already taken
    const existingAlliance = await prisma.alliance.findFirst({
      where: { tag }
    });

    if (existingAlliance) {
      return NextResponse.json(
        { error: 'Alliance tag is already taken' },
        { status: 400 }
      );
    }

    // Check if character exists and is not in an alliance
    const character = await prisma.character.findUnique({
      where: { id: characterId }
    });

    if (!character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

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
