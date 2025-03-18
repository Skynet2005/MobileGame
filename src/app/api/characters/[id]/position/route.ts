import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/database/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get character ID from params
    const characterId = params.id;

    // Get position data from request body
    const { worldLocationX, worldLocationY } = await request.json();

    // Validate input
    if (typeof worldLocationX !== 'number' || typeof worldLocationY !== 'number') {
      return NextResponse.json(
        { error: 'Invalid coordinates. X and Y must be numbers.' },
        { status: 400 }
      );
    }

    // Update character position in database
    const updatedCharacter = await prisma.character.update({
      where: {
        id: characterId
      },
      data: {
        profile: {
          update: {
            worldLocationX,
            worldLocationY
          }
        }
      },
      select: {
        id: true,
        profile: {
          select: {
            worldLocationX: true,
            worldLocationY: true
          }
        }
      }
    });

    // Return updated position
    return NextResponse.json({
      success: true,
      data: {
        id: updatedCharacter.id,
        position: {
          x: updatedCharacter.profile?.worldLocationX,
          y: updatedCharacter.profile?.worldLocationY
        }
      }
    });

  } catch (error) {
    console.error('Error updating character position:', error);
    return NextResponse.json(
      { error: 'Failed to update character position' },
      { status: 500 }
    );
  }
}

// Created Logic for review: Get character position
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get character ID from params
    const characterId = params.id;

    // Get character position from database
    const character = await prisma.character.findUnique({
      where: {
        id: characterId
      },
      select: {
        id: true,
        profile: {
          select: {
            worldLocationX: true,
            worldLocationY: true
          }
        }
      }
    });

    if (!character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    // Return position
    return NextResponse.json({
      success: true,
      data: {
        id: character.id,
        position: {
          x: character.profile?.worldLocationX,
          y: character.profile?.worldLocationY
        }
      }
    });

  } catch (error) {
    console.error('Error getting character position:', error);
    return NextResponse.json(
      { error: 'Failed to get character position' },
      { status: 500 }
    );
  }
}
