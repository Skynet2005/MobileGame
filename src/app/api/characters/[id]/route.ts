import { NextResponse } from 'next/server';
import { prisma } from '@/database/prisma';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;

    // Find character by ID
    const character = await prisma.character.findUnique({
      where: { id },
      include: {
        profile: true,
        alliance: true
      }
    });

    if (!character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    // Format the response
    const response = {
      id: character.id,
      name: character.name,
      level: character.level,
      isOnline: character.isOnline,
      allianceId: character.allianceId,
      allianceTag: character.allianceTag,
      profile: character.profile || {
        power: 0,
        kills: 0,
        furnaceLevel: 1,
        state: 1,
        worldLocationX: 0,
        worldLocationY: 0,
        troops: JSON.stringify({
          infantry: { total: 0, level: 1, injured: 0 },
          lancer: { total: 0, level: 1, injured: 0 },
          marksman: { total: 0, level: 1, injured: 0 },
          marchQueue: 0
        })
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching character:', error);
    return NextResponse.json(
      { error: 'Failed to fetch character data' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const { isOnline, allianceTag, name } = await request.json();

    const character = await prisma.character.update({
      where: { id },
      data: {
        ...(isOnline !== undefined && { isOnline }),
        ...(allianceTag !== undefined && { allianceTag }),
        ...(name !== undefined && { name })
      },
      include: {
        profile: true,
        alliance: true
      }
    });

    return NextResponse.json(character);
  } catch (error) {
    console.error('Error updating character:', error);
    return NextResponse.json(
      { error: 'Failed to update character' },
      { status: 500 }
    );
  }
}
