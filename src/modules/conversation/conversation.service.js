import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class ConversationService {
  /**
   * Get or create conversation between two users
   */
  async getOrCreateConversation(currentUserId, participantId) {
    // Check if user is trying to message themselves
    if (currentUserId === participantId) {
      throw new Error('Cannot create conversation with yourself');
    }

    // Check if either user has blocked the other
    const blockStatus = await this.checkBlockStatus(currentUserId, participantId);
    if (blockStatus.isBlockedByMe || blockStatus.isBlockingMe) {
      throw new Error('Cannot create conversation with blocked user');
    }

    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        participants: {
          every: {
            userId: {
              in: [currentUserId, participantId]
            }
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                uuid: true,
                username: true,
                name: true,
                fotoProfil: true
              }
            }
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (existingConversation) {
      // Count unread messages for current user
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: existingConversation.id,
          senderId: participantId,
          isRead: false
        }
      });

      return {
        conversation: this.formatConversation(existingConversation, unreadCount),
        isNew: false
      };
    }

    // Create new conversation
    const newConversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId: currentUserId },
            { userId: participantId }
          ]
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                uuid: true,
                username: true,
                name: true,
                fotoProfil: true
              }
            }
          }
        }
      }
    });

    return {
      conversation: this.formatConversation(newConversation, 0),
      isNew: true
    };
  }

  /**
   * Get all conversations for a user
   */
  async getUserConversations(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                uuid: true,
                username: true,
                name: true,
                fotoProfil: true
              }
            }
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      skip,
      take: limit
    });

    const total = await prisma.conversation.count({
      where: {
        participants: {
          some: {
            userId: userId
          }
        }
      }
    });

    // Get unread counts for each conversation
    const formattedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherParticipant = conv.participants.find(p => p.userId !== userId);
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: otherParticipant.userId,
            isRead: false
          }
        });

        return this.formatConversationForList(conv, userId, unreadCount);
      })
    );

    return {
      data: formattedConversations,
      meta: {
        page,
        limit,
        total,
        hasMore: skip + limit < total
      }
    };
  }

  /**
   * Check if user is participant of conversation
   */
  async isParticipant(conversationId, userId) {
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId
      }
    });
    return !!participant;
  }

  /**
   * Check block status between two users
   */
  async checkBlockStatus(userId, otherUserId) {
    const [blockedByMe, blockingMe] = await Promise.all([
      prisma.userBlock.findFirst({
        where: {
          blockerId: userId,
          blockedUserId: otherUserId
        }
      }),
      prisma.userBlock.findFirst({
        where: {
          blockerId: otherUserId,
          blockedUserId: userId
        }
      })
    ]);

    return {
      isBlockedByMe: !!blockedByMe,
      isBlockingMe: !!blockingMe
    };
  }

  /**
   * Format conversation response
   */
  formatConversation(conversation, unreadCount = 0) {
    const lastMessage = conversation.messages?.[0];
    
    return {
      id: conversation.id,
      uuid: conversation.uuid,
      participants: conversation.participants.map(p => ({
        id: p.user.id,
        uuid: p.user.uuid,
        username: p.user.username,
        name: p.user.name,
        fotoProfil: p.user.fotoProfil
      })),
      lastMessage: lastMessage ? {
        id: lastMessage.id,
        senderId: lastMessage.senderId,
        content: lastMessage.content,
        createdAt: lastMessage.createdAt,
        isRead: lastMessage.isRead
      } : null,
      unreadCount,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt
    };
  }

  /**
   * Format conversation for list (show other participant only)
   */
  formatConversationForList(conversation, currentUserId, unreadCount = 0) {
    const otherParticipant = conversation.participants.find(p => p.userId !== currentUserId);
    const lastMessage = conversation.messages?.[0];

    return {
      id: conversation.id,
      uuid: conversation.uuid,
      otherParticipant: {
        id: otherParticipant.user.id,
        uuid: otherParticipant.user.uuid,
        username: otherParticipant.user.username,
        name: otherParticipant.user.name,
        fotoProfil: otherParticipant.user.fotoProfil
      },
      lastMessage: lastMessage ? {
        id: lastMessage.id,
        senderId: lastMessage.senderId,
        senderName: lastMessage.sender?.name,
        content: lastMessage.content,
        createdAt: lastMessage.createdAt,
        isRead: lastMessage.isRead
      } : null,
      unreadCount,
      updatedAt: conversation.updatedAt
    };
  }
}

export default new ConversationService();
