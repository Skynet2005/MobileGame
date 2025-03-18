import { prisma } from '../prisma';
import { Friend, FriendRequest, Character } from '@/types/player';

export class FriendService {
  // Send friend request
  static async sendFriendRequest(senderId: string, receiverId: string): Promise<FriendRequest> {
    return prisma.friendRequest.create({
      data: {
        senderId,
        receiverId,
        status: 'PENDING'
      },
      include: {
        sender: true,
        receiver: true
      }
    });
  }

  // Accept friend request
  static async acceptFriendRequest(requestId: string): Promise<Friend> {
    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
      include: {
        sender: true,
        receiver: true
      }
    });

    if (!request) throw new Error('Friend request not found');

    // Create friend relationship
    const friend = await prisma.friend.create({
      data: {
        characterId: request.senderId,
        friendId: request.receiverId
      },
      include: {
        character: true,
        friend: true
      }
    });

    // Update request status
    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'ACCEPTED' }
    });

    return friend;
  }

  // Reject friend request
  static async rejectFriendRequest(requestId: string): Promise<void> {
    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' }
    });
  }

  // Get friend requests for character
  static async getFriendRequests(characterId: string): Promise<FriendRequest[]> {
    return prisma.friendRequest.findMany({
      where: {
        OR: [
          { senderId: characterId },
          { receiverId: characterId }
        ]
      },
      include: {
        sender: true,
        receiver: true
      }
    });
  }

  // Get character's friends
  static async getCharacterFriends(characterId: string): Promise<Friend[]> {
    return prisma.friend.findMany({
      where: {
        OR: [
          { characterId },
          { friendId: characterId }
        ]
      },
      include: {
        character: true,
        friend: true
      }
    });
  }

  // Remove friend
  static async removeFriend(characterId: string, friendId: string): Promise<void> {
    await prisma.friend.deleteMany({
      where: {
        OR: [
          { characterId, friendId },
          { characterId: friendId, friendId: characterId }
        ]
      }
    });
  }

  // Check if characters are friends
  static async areFriends(characterId1: string, characterId2: string): Promise<boolean> {
    const friend = await prisma.friend.findFirst({
      where: {
        OR: [
          { characterId: characterId1, friendId: characterId2 },
          { characterId: characterId2, friendId: characterId1 }
        ]
      }
    });
    return !!friend;
  }

  // Get pending friend requests
  static async getPendingFriendRequests(characterId: string): Promise<FriendRequest[]> {
    return prisma.friendRequest.findMany({
      where: {
        receiverId: characterId,
        status: 'PENDING'
      },
      include: {
        sender: true
      }
    });
  }

  // Get sent friend requests
  static async getSentFriendRequests(characterId: string): Promise<FriendRequest[]> {
    return prisma.friendRequest.findMany({
      where: {
        senderId: characterId,
        status: 'PENDING'
      },
      include: {
        receiver: true
      }
    });
  }

  // Cancel friend request
  static async cancelFriendRequest(requestId: string): Promise<void> {
    await prisma.friendRequest.delete({
      where: { id: requestId }
    });
  }

  // Get online friends
  static async getOnlineFriends(characterId: string): Promise<Friend[]> {
    return prisma.friend.findMany({
      where: {
        OR: [
          { characterId },
          { friendId: characterId }
        ]
      },
      include: {
        character: true,
        friend: true
      }
    }).then(friends =>
      friends.filter(friend =>
        (friend.characterId === characterId && friend.friend.isOnline) ||
        (friend.friendId === characterId && friend.character.isOnline)
      )
    );
  }
}
