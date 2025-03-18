import { prisma } from '@/database/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET friend requests for a character
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const characterId = searchParams.get('characterId');

  if (!characterId) {
    return NextResponse.json({ error: 'Character ID is required' }, { status: 400 });
  }

  try {
    // Get all pending friend requests for the character
    const requests = await prisma.friendRequest.findMany({
      where: {
        receiverId: characterId,
        status: 'pending',
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
      },
    });

    // Format the response
    const formattedRequests = requests.map((request: any) => ({
      id: request.id,
      name: request.sender.name,
      level: request.sender.level,
      senderId: request.sender.id,
      createdAt: request.createdAt,
    }));

    return NextResponse.json(formattedRequests);
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    return NextResponse.json({ error: 'Failed to fetch friend requests' }, { status: 500 });
  }
}

// PATCH to update a friend request (accept/reject)
export async function PATCH(request: NextRequest) {
  try {
    const { requestId, status } = await request.json();

    if (!requestId || !status) {
      return NextResponse.json({ error: 'Request ID and status are required' }, { status: 400 });
    }

    if (status !== 'accepted' && status !== 'rejected') {
      return NextResponse.json({ error: 'Status must be either "accepted" or "rejected"' }, { status: 400 });
    }

    // Find the friend request
    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!friendRequest) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 });
    }

    // Update the status
    const updatedRequest = await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status },
    });

    // If accepted, create friendship entries for both characters
    if (status === 'accepted') {
      await Promise.all([
        prisma.friend.create({
          data: {
            characterId: friendRequest.receiverId,
            friendId: friendRequest.senderId,
          },
        }),
        prisma.friend.create({
          data: {
            characterId: friendRequest.senderId,
            friendId: friendRequest.receiverId,
          },
        }),
      ]);
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error updating friend request:', error);
    return NextResponse.json({ error: 'Failed to update friend request' }, { status: 500 });
  }
}
