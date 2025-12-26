import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class MessageService {
  /**
   * Get messages in a conversation
   */
  async getMessages(conversationId, userId, page = 1, limit = 50, before = null) {
    // Verify user is participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId
      }
    });

    if (!participant) {
      throw new Error('You are not a participant of this conversation');
    }

    const whereClause = {
      conversationId
    };

    // If 'before' is provided, get messages before that message ID
    if (before) {
      whereClause.id = {
        lt: parseInt(before)
      };
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            fotoProfil: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    const total = await prisma.message.count({
      where: { conversationId }
    });

    return {
      data: messages.map(msg => this.formatMessage(msg)),
      meta: {
        page,
        limit,
        total,
        hasMore: messages.length === limit
      }
    };
  }

  /**
   * Send a message
   */
  async sendMessage(conversationId, senderId, content) {
    // Verify user is participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: senderId
      }
    });

    if (!participant) {
      throw new Error('You are not a participant of this conversation');
    }

    // Get the other participant to check block status
    const otherParticipant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: {
          not: senderId
        }
      }
    });

    if (!otherParticipant) {
      throw new Error('Conversation has no other participant');
    }

    // Check if either user has blocked the other
    const [blockedByMe, blockingMe] = await Promise.all([
      prisma.userBlock.findFirst({
        where: {
          blockerId: senderId,
          blockedUserId: otherParticipant.userId
        }
      }),
      prisma.userBlock.findFirst({
        where: {
          blockerId: otherParticipant.userId,
          blockedUserId: senderId
        }
      })
    ]);

    if (blockedByMe || blockingMe) {
      throw new Error('Cannot send message to blocked user');
    }

    // Create message and update conversation timestamp
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId,
          senderId,
          content,
          isRead: false
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              fotoProfil: true
            }
          }
        }
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      })
    ]);

    return this.formatMessage(message);
  }

  /**
   * Mark all messages in conversation as read
   */
  async markAsRead(conversationId, userId) {
    // Verify user is participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId
      }
    });

    if (!participant) {
      throw new Error('You are not a participant of this conversation');
    }

    // Mark all unread messages from other users as read
    const result = await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: {
          not: userId
        },
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    return result.count;
  }

  /**
   * Format message response
   */
  formatMessage(message) {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderName: message.sender?.name,
      senderPhoto: message.sender?.fotoProfil,
      content: message.content,
      isRead: message.isRead,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt
    };
  }
}

export default new MessageService();
