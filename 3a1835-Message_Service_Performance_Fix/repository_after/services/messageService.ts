import prisma from "../lib/database";
import { CreateMessageInput, MessageQuery } from "../lib/validation";
import { createError } from "../middleware/errorHandler";
import { ConversationService } from "./conversationService";

export class MessageService {
  private conversationService = new ConversationService();

  async getMessagesByConversationId(
    conversationId: string,
    query: MessageQuery
  ) {
    try {
      const { page = 1, limit = 50 } = query;
      const skip = (page - 1) * limit;

      // Run independent queries in parallel
      const [conversation, messages, totalCount] = await Promise.all([
        prisma.conversation.findUnique({
          where: { id: conversationId },
        }),
        prisma.message.findMany({
          where: { conversationId },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.message.count({
          where: { conversationId },
        }),
      ]);

      if (!conversation) {
        throw createError("Conversation not found", 404);
      }

      return {
        messages,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page * limit < totalCount,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      if (error instanceof Error && "statusCode" in error) {
        throw error;
      }
      console.error("Error fetching messages:", error);
      throw createError("Failed to fetch messages", 500);
    }
  }

  async createMessage(data: CreateMessageInput) {
    try {
      // Verify conversation exists first
      const conversation = await prisma.conversation.findUnique({
        where: { id: data.conversationId },
      });

      if (!conversation) {
        throw createError("Conversation not found", 404);
      }

      // Use transaction for atomic operations
      const message = await prisma.$transaction(async (tx: any) => {
        // Create the message
        const newMessage = await tx.message.create({
          data: {
            content: data.content,
            isFromUser: data.isFromUser,
            conversationId: data.conversationId,
          },
        });

        // Update conversation timestamp and potentially title
        if (data.isFromUser) {
          // Check if this is the first message
          const messageCount = await tx.message.count({
            where: { conversationId: data.conversationId },
          });

          if (messageCount === 1) {
            // First message - update both title and timestamp
            await tx.conversation.update({
              where: { id: data.conversationId },
              data: {
                title: data.content.slice(0, 50),
                updatedAt: new Date(),
              },
            });
          } else {
            // Not first message - only update timestamp
            await tx.conversation.update({
              where: { id: data.conversationId },
              data: { updatedAt: new Date() },
            });
          }
        } else {
          // Non-user message - only update timestamp
          await tx.conversation.update({
            where: { id: data.conversationId },
            data: { updatedAt: new Date() },
          });
        }

        return newMessage;
      });

      return message;
    } catch (error) {
      if (error instanceof Error && "statusCode" in error) {
        throw error;
      }
      console.error("Error creating message:", error);
      throw createError("Failed to create message", 500);
    }
  }

  async getMessageById(id: string) {
    try {
      const message = await prisma.message.findUnique({
        where: { id },
        include: {
          conversation: true,
        },
      });

      if (!message) {
        throw createError("Message not found", 404);
      }

      return message;
    } catch (error) {
      if (error instanceof Error && "statusCode" in error) {
        throw error;
      }
      console.error("Error fetching message:", error);
      throw createError("Failed to fetch message", 500);
    }
  }

  async getRecentMessagesAcrossConversations(userId: string, limit: number = 10) {
    try {
      // Single query with nested include - no N+1 problem
      const conversations = await prisma.conversation.findMany({
        where: { userId },
        take: limit,
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      // Transform to match expected format
      const messagesWithConversations = conversations
        .filter((conv: any) => conv.messages.length > 0)
        .map((conv: any) => ({
          conversation: {
            id: conv.id,
            title: conv.title,
            userId: conv.userId,
          },
          lastMessage: conv.messages[0],
        }));

      return messagesWithConversations;
    } catch (error) {
      console.error("Error fetching recent messages:", error);
      throw createError("Failed to fetch recent messages", 500);
    }
  }
}
