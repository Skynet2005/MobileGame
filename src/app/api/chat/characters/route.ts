import { prisma } from '@/database/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET characters
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  const name = searchParams.get('name');
  const exactName = searchParams.get('exactName');

  try {
    console.log('GET /api/chat/characters called with params:', { id, name, exactName });

    // Get a specific character by ID
    if (id) {
      console.log('Fetching character by ID:', id);
      const character = await prisma.character.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          level: true,
          isOnline: true,
          allianceId: true,
          allianceTag: true,
          lastSeen: true,
          alliance: {
            select: {
              name: true
            }
          }
        },
      });

      if (!character) {
        console.log('Character not found:', id);
        return NextResponse.json({ error: 'Character not found' }, { status: 404 });
      }

      return NextResponse.json(character);
    }

    // Search characters by exact name match
    if (exactName) {
      console.log('Searching characters by exact name:', exactName);
      const characters = await prisma.character.findMany({
        where: {
          name: exactName
        },
        select: {
          id: true,
          name: true,
          level: true,
          isOnline: true,
          allianceTag: true,
          allianceId: true,
          alliance: {
            select: {
              name: true
            }
          }
        },
        take: 10,
      });

      return NextResponse.json(characters);
    }

    // Search characters by partial name match
    if (name) {
      console.log('Searching characters by partial name:', name);
      const characters = await prisma.character.findMany({
        where: {
          name: {
            contains: name,
          },
        },
        select: {
          id: true,
          name: true,
          level: true,
          isOnline: true,
          allianceTag: true,
          allianceId: true,
          alliance: {
            select: {
              name: true
            }
          }
        },
        take: 10,
      });

      return NextResponse.json(characters);
    }

    // Get all characters (limited)
    console.log('Fetching all characters (limited)');
    const characters = await prisma.character.findMany({
      select: {
        id: true,
        name: true,
        level: true,
        isOnline: true,
        allianceTag: true,
        allianceId: true,
      },
      take: 50,
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(characters);
  } catch (error) {
    console.error('Error in GET /api/chat/characters:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json({
      error: 'Failed to fetch characters',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST a new character or update status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('POST /api/chat/characters called with body:', body);
    const { name, level, isOnline, id, allianceTag, accountId } = body;

    // If ID is provided, update the character
    if (id) {
      console.log('Updating character:', id);
      const updatedCharacter = await prisma.character.update({
        where: { id },
        data: {
          ...(isOnline !== undefined && { isOnline }),
          ...(level !== undefined && { level }),
          ...(allianceTag !== undefined && { allianceTag }),
          lastSeen: new Date(),
        },
        include: {
          alliance: true
        }
      });

      return NextResponse.json(updatedCharacter);
    }

    // Create a new character
    if (!name) {
      console.log('Name is required');
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check if character with this name already exists - simplified query
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

    // Validate accountId
    if (!accountId) {
      console.log('Account ID is required');
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    // Check if account exists
    console.log('Checking if account exists:', accountId);
    const account = await prisma.account.findUnique({
      where: { id: accountId }
    });

    if (!account) {
      console.log('Account not found:', accountId);
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Create new character if it doesn't exist
    console.log('Creating new character:', { name, accountId });
    const newCharacter = await prisma.character.create({
      data: {
        name,
        level: level || 1,
        isOnline: Boolean(isOnline ?? true),
        allianceTag: allianceTag || '',
        accountId
      },
      include: {
        alliance: true
      }
    });

    console.log('Character created successfully:', newCharacter);
    return NextResponse.json(newCharacter);
  } catch (error) {
    console.error('Error in POST /api/chat/characters:', error);
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

// Seed a demo character
export async function seedDemoCharacter() {
  try {
    const demoCharacterName = 'Player';

    // Check if demo character already exists - simplified query
    const existingCharacters = await prisma.character.findMany({
      where: {
        name: demoCharacterName
      },
      take: 1
    });

    if (existingCharacters.length > 0) {
      return existingCharacters[0];
    }

    // Create demo character
    const demoCharacter = await prisma.character.create({
      data: {
        name: demoCharacterName,
        level: 10,
        isOnline: true,
        accountId: 'demo-account'
      },
    });

    return demoCharacter;
  } catch (error) {
    console.error('Error seeding demo character:', error);
    throw error;
  }
}
