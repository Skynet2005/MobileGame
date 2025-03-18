import { prisma } from '@/database/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET blacklisted characters for a character
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const characterId = searchParams.get('characterId');

  if (!characterId) {
    return NextResponse.json({ error: 'Character ID is required' }, { status: 400 });
  }

  try {
    // Get all blacklisted characters
    const blacklistEntries = await prisma.blacklist.findMany({
      where: { blockerId: characterId },
      include: {
        blocked: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
      },
    });

    // Format the response
    const formattedEntries = blacklistEntries.map((entry: any) => ({
      id: entry.id,
      blockedId: entry.blockedId,
      name: entry.blocked.name,
      level: entry.blocked.level,
      createdAt: entry.createdAt,
    }));

    return NextResponse.json(formattedEntries);
  } catch (error) {
    console.error('Error fetching blacklist:', error);
    return NextResponse.json({ error: 'Failed to fetch blacklist' }, { status: 500 });
  }
}

// POST a new blacklist entry
export async function POST(request: NextRequest) {
  try {
    const { characterId, blockedId } = await request.json();

    if (!characterId || !blockedId) {
      return NextResponse.json({ error: 'Character ID and blocked ID are required' }, { status: 400 });
    }

    // Check if characters exist
    const [character, blockedCharacter] = await Promise.all([
      prisma.character.findUnique({ where: { id: characterId } }),
      prisma.character.findUnique({ where: { id: blockedId } }),
    ]);

    if (!character || !blockedCharacter) {
      return NextResponse.json({ error: 'One or both characters do not exist' }, { status: 404 });
    }

    // Check if already blacklisted
    const existingEntry = await prisma.blacklist.findFirst({
      where: {
        blockerId: characterId,
        blockedId,
      },
    });

    if (existingEntry) {
      return NextResponse.json({ error: 'Character is already blacklisted' }, { status: 409 });
    }

    // Create blacklist entry
    const newEntry = await prisma.blacklist.create({
      data: {
        blockerId: characterId,
        blockedId,
      },
      include: {
        blocked: {
          select: {
            name: true,
            level: true,
          },
        },
      },
    });

    // Remove any friendship if it exists
    await prisma.friend.deleteMany({
      where: {
        OR: [
          { characterId, friendId: blockedId },
          { characterId: blockedId, friendId: characterId },
        ],
      },
    });

    // Reject any pending friend requests
    await prisma.friendRequest.updateMany({
      where: {
        OR: [
          { senderId: characterId, receiverId: blockedId, status: 'pending' },
          { senderId: blockedId, receiverId: characterId, status: 'pending' },
        ],
      },
      data: {
        status: 'rejected',
      },
    });

    return NextResponse.json({
      id: newEntry.id,
      blockedId: newEntry.blockedId,
      name: newEntry.blocked.name,
      level: newEntry.blocked.level,
      createdAt: newEntry.createdAt,
    });
  } catch (error) {
    console.error('Error creating blacklist entry:', error);
    return NextResponse.json({ error: 'Failed to create blacklist entry' }, { status: 500 });
  }
}

// DELETE a blacklist entry
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const entryId = searchParams.get('id');

  if (!entryId) {
    return NextResponse.json({ error: 'Blacklist entry ID is required' }, { status: 400 });
  }

  try {
    // Delete the blacklist entry
    await prisma.blacklist.delete({
      where: { id: entryId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting blacklist entry:', error);
    return NextResponse.json({ error: 'Failed to delete blacklist entry' }, { status: 500 });
  }
}
