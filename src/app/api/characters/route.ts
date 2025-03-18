import { NextResponse } from 'next/server';
import { CharacterService } from '@/lib/db/services';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('POST /api/characters called with body:', body);
    const { name, level, isOnline, id, allianceTag, accountId } = body;

    // Validate accountId
    if (!accountId) {
      console.log('Account ID is required');
      return NextResponse.json({
        error: 'Account ID is required',
        details: 'Please provide an accountId in the request body'
      }, { status: 400 });
    }

    // Check if account exists
    console.log('Checking if account exists:', accountId);
    const account = await prisma.account.findUnique({
      where: { id: accountId }
    });

    if (!account) {
      console.log('Account not found:', accountId);
      return NextResponse.json({
        error: 'Account not found',
        details: `No account found with ID: ${accountId}`
      }, { status: 404 });
    }

    // Check if character with this name already exists
    console.log('Checking for existing character with name:', name);
    const existingCharacters = await prisma.character.findMany({
      where: {
        name: name
      },
      take: 1
    });

    if (existingCharacters.length > 0) {
      console.log('Character already exists:', existingCharacters[0]);
      return NextResponse.json({
        error: 'A character with this name already exists',
        character: existingCharacters[0]
      }, { status: 200 });
    }

    // Create new character
    console.log('Creating new character:', { name, accountId });
    const newCharacter = await prisma.character.create({
      data: {
        id: id || undefined, // Use provided ID if available, otherwise let Prisma generate one
        name,
        level: level || 1,
        isOnline: Boolean(isOnline ?? true),
        allianceTag: allianceTag || '',
        accountId,
        profile: {
          create: {
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
        }
      },
      include: {
        alliance: true,
        profile: true
      }
    });

    console.log('Character created successfully:', newCharacter);
    return NextResponse.json(newCharacter);
  } catch (error) {
    console.error('Error in POST /api/characters:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json({
      error: 'Failed to create/update character',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    const characters = await CharacterService.getCharactersByAccountId(accountId);
    return NextResponse.json(characters);
  } catch (error) {
    console.error('Get characters error:', error);
    return NextResponse.json(
      { error: 'Failed to get characters' },
      { status: 500 }
    );
  }
}
