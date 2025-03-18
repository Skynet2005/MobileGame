import { prisma } from '@/database/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET friends for a character
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const characterId = searchParams.get('characterId');

  if (!characterId) {
    return NextResponse.json({ error: 'Character ID is required' }, { status: 400 });
  }

  try {
    // Get all friends for the character
    const friends = await prisma.friend.findMany({
      where: { characterId: characterId },
      include: {
        friend: {
          select: {
            id: true,
            name: true,
            level: true,
            isOnline: true,
            lastSeen: true,
            allianceTag: true,
            alliance: {
              select: {
                name: true
              }
            }
          },
        },
      },
    });

    // Format the response
    const formattedFriends = friends.map((friendship: any) => ({
      id: friendship.friend.id,
      name: friendship.friend.name,
      level: friendship.friend.level,
      online: friendship.friend.isOnline,
      lastSeen: friendship.friend.lastSeen,
      allianceTag: friendship.friend.allianceTag || (friendship.friend.alliance?.name || ''),
      alliance: friendship.friend.alliance ? {
        name: friendship.friend.alliance.name
      } : null,
      friendshipId: friendship.id,
    }));

    return NextResponse.json(formattedFriends);
  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json({ error: 'Failed to fetch friends' }, { status: 500 });
  }
}

// GET friend requests for a character
export async function GET_requests(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const characterId = searchParams.get('characterId');

  if (!characterId) {
    return NextResponse.json({ error: 'Character ID is required' }, { status: 400 });
  }

  try {
    // Get all friend requests for the character (both sent and received)
    const friendRequests = await prisma.friendRequest.findMany({
      where: {
        OR: [
          { senderId: characterId },
          { receiverId: characterId }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            level: true,
            allianceTag: true,
            alliance: {
              select: {
                name: true
              }
            }
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            level: true,
            allianceTag: true,
            alliance: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format the response
    const formattedRequests = friendRequests.map(request => ({
      id: request.id,
      sender: request.sender ? {
        id: request.sender.id,
        name: request.sender.name,
        level: request.sender.level,
        allianceTag: request.sender.allianceTag || (request.sender.alliance?.name || ''),
        alliance: request.sender.alliance ? {
          name: request.sender.alliance.name
        } : null
      } : null,
      receiver: request.receiver ? {
        id: request.receiver.id,
        name: request.receiver.name,
        level: request.receiver.level,
        allianceTag: request.receiver.allianceTag || (request.receiver.alliance?.name || ''),
        alliance: request.receiver.alliance ? {
          name: request.receiver.alliance.name
        } : null
      } : null,
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt
    }));

    return NextResponse.json(formattedRequests);
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    return NextResponse.json({ error: 'Failed to fetch friend requests' }, { status: 500 });
  }
}

// POST a new friend request
export async function POST(request: NextRequest) {
  try {
    const { senderId, receiverId } = await request.json();

    if (!senderId || !receiverId) {
      return NextResponse.json({ error: 'Sender ID and receiver ID are required' }, { status: 400 });
    }

    // Check if characters exist
    const [sender, receiver] = await Promise.all([
      prisma.character.findUnique({ where: { id: senderId } }),
      prisma.character.findUnique({ where: { id: receiverId } })
    ]);

    if (!sender || !receiver) {
      return NextResponse.json({ error: 'One or both characters do not exist' }, { status: 404 });
    }

    // Check if they are already friends
    const existingFriendship = await prisma.friend.findFirst({
      where: {
        OR: [
          { characterId: senderId, friendId: receiverId },
          { characterId: receiverId, friendId: senderId }
        ]
      }
    });

    if (existingFriendship) {
      return NextResponse.json({ error: 'Characters are already friends' }, { status: 409 });
    }

    // Check if there's already a pending request
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId }
        ]
      }
    });

    if (existingRequest) {
      return NextResponse.json({ error: 'A friend request already exists' }, { status: 409 });
    }

    // Create the friend request
    const newRequest = await prisma.friendRequest.create({
      data: {
        senderId,
        receiverId,
        status: 'PENDING'
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            level: true,
            allianceTag: true,
            alliance: {
              select: {
                name: true
              }
            }
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            level: true,
            allianceTag: true,
            alliance: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      id: newRequest.id,
      sender: newRequest.sender ? {
        id: newRequest.sender.id,
        name: newRequest.sender.name,
        level: newRequest.sender.level,
        allianceTag: newRequest.sender.allianceTag || (newRequest.sender.alliance?.name || ''),
        alliance: newRequest.sender.alliance ? {
          name: newRequest.sender.alliance.name
        } : null
      } : null,
      receiver: newRequest.receiver ? {
        id: newRequest.receiver.id,
        name: newRequest.receiver.name,
        level: newRequest.receiver.level,
        allianceTag: newRequest.receiver.allianceTag || (newRequest.receiver.alliance?.name || ''),
        alliance: newRequest.receiver.alliance ? {
          name: newRequest.receiver.alliance.name
        } : null
      } : null,
      status: newRequest.status,
      createdAt: newRequest.createdAt,
      updatedAt: newRequest.updatedAt
    });
  } catch (error) {
    console.error('Error creating friend request:', error);
    return NextResponse.json({ error: 'Failed to create friend request' }, { status: 500 });
  }
}

// PUT to update friend request status
export async function PUT(request: NextRequest) {
  try {
    const { requestId, status } = await request.json();

    if (!requestId || !status) {
      return NextResponse.json({ error: 'Request ID and status are required' }, { status: 400 });
    }

    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Get the friend request
    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
      include: {
        sender: true,
        receiver: true
      }
    });

    if (!friendRequest) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 });
    }

    // Update the request status
    const updatedRequest = await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            level: true,
            allianceTag: true,
            alliance: {
              select: {
                name: true
              }
            }
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            level: true,
            allianceTag: true,
            alliance: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    // If accepted, create the friendship
    if (status === 'ACCEPTED') {
      await prisma.friend.create({
        data: {
          characterId: friendRequest.senderId,
          friendId: friendRequest.receiverId
        }
      });
    }

    return NextResponse.json({
      id: updatedRequest.id,
      sender: updatedRequest.sender ? {
        id: updatedRequest.sender.id,
        name: updatedRequest.sender.name,
        level: updatedRequest.sender.level,
        allianceTag: updatedRequest.sender.allianceTag || (updatedRequest.sender.alliance?.name || ''),
        alliance: updatedRequest.sender.alliance ? {
          name: updatedRequest.sender.alliance.name
        } : null
      } : null,
      receiver: updatedRequest.receiver ? {
        id: updatedRequest.receiver.id,
        name: updatedRequest.receiver.name,
        level: updatedRequest.receiver.level,
        allianceTag: updatedRequest.receiver.allianceTag || (updatedRequest.receiver.alliance?.name || ''),
        alliance: updatedRequest.receiver.alliance ? {
          name: updatedRequest.receiver.alliance.name
        } : null
      } : null,
      status: updatedRequest.status,
      createdAt: updatedRequest.createdAt,
      updatedAt: updatedRequest.updatedAt
    });
  } catch (error) {
    console.error('Error updating friend request:', error);
    return NextResponse.json({ error: 'Failed to update friend request' }, { status: 500 });
  }
}

// DELETE a friendship
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const friendshipId = searchParams.get('id');

  if (!friendshipId) {
    return NextResponse.json({ error: 'Friendship ID is required' }, { status: 400 });
  }

  try {
    // Delete the friendship
    await prisma.friend.delete({
      where: { id: friendshipId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting friendship:', error);
    return NextResponse.json({ error: 'Failed to delete friendship' }, { status: 500 });
  }
}
