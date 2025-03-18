import { prisma } from '../prisma';
import { Notification } from '@/types/chat';

export class NotificationService {
  // Create notification
  static async createNotification(
    characterId: string,
    type: string,
    title: string,
    content: string,
    sourceId?: string
  ): Promise<Notification> {
    return prisma.notification.create({
      data: {
        characterId,
        type,
        title,
        content,
        sourceId
      }
    });
  }

  // Get character's notifications
  static async getCharacterNotifications(characterId: string): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: { characterId },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  // Get unread notifications
  static async getUnreadNotifications(characterId: string): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: {
        characterId,
        isRead: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  // Mark notification as read
  static async markNotificationAsRead(notificationId: string): Promise<Notification> {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });
  }

  // Mark all notifications as read
  static async markAllNotificationsAsRead(characterId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        characterId,
        isRead: false
      },
      data: { isRead: true }
    });
  }

  // Delete notification
  static async deleteNotification(notificationId: string): Promise<void> {
    await prisma.notification.delete({
      where: { id: notificationId }
    });
  }

  // Delete all notifications
  static async deleteAllNotifications(characterId: string): Promise<void> {
    await prisma.notification.deleteMany({
      where: { characterId }
    });
  }

  // Get notification by ID
  static async getNotificationById(notificationId: string): Promise<Notification | null> {
    return prisma.notification.findUnique({
      where: { id: notificationId }
    });
  }

  // Get notifications by type
  static async getNotificationsByType(characterId: string, type: string): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: {
        characterId,
        type
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  // Get unread notification count
  static async getUnreadNotificationCount(characterId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        characterId,
        isRead: false
      }
    });
  }

  // Create system notification
  static async createSystemNotification(
    characterId: string,
    title: string,
    content: string
  ): Promise<Notification> {
    return this.createNotification(characterId, 'SYSTEM', title, content);
  }

  // Create message notification
  static async createMessageNotification(
    characterId: string,
    title: string,
    content: string,
    messageId: string
  ): Promise<Notification> {
    return this.createNotification(characterId, 'MESSAGE', title, content, messageId);
  }

  // Create friend request notification
  static async createFriendRequestNotification(
    characterId: string,
    title: string,
    content: string,
    requestId: string
  ): Promise<Notification> {
    return this.createNotification(characterId, 'FRIEND_REQUEST', title, content, requestId);
  }

  // Get notifications in date range
  static async getNotificationsInDateRange(
    characterId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: {
        characterId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
}
