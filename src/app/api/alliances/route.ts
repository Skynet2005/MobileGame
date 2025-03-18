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

    // Verify character exists
    const character = await prisma.character.findUnique({
      where: { id: characterId }
    });

    if (!character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
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

export async function GET() {
  try {
    const alliances = await prisma.alliance.findMany({
      include: {
        leader: {
          select: {
            id: true,
            name: true
          }
        },
        members: {
          include: {
            character: {
              select: {
                id: true,
                name: true,
                profile: {
                  select: {
                    power: true
                  }
                }
              }
            }
          }
        }
      }
    });

    return NextResponse.json(alliances);
  } catch (error) {
    console.error('Error fetching alliances:', error);
    return NextResponse.json({ error: 'Failed to fetch alliances' }, { status: 500 });
  }
}
