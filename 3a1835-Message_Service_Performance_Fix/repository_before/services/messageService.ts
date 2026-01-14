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
      
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw createError("Conversation not found", 404);
      }

      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "desc" },
      });

      const totalCount = await prisma.message.count({
        where: { conversationId },
      });

      const skip = (page - 1) * limit;
      const paginatedMessages = messages.slice(skip, skip + limit);

      return {
        messages: paginatedMessages,
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
      const conversation = await prisma.conversation.findUnique({
        where: { id: data.conversationId },
      });

      if (!conversation) {
        throw createError("Conversation not found", 404);
      }

      const message = await prisma.message.create({
        data: {
          content: data.content,
          isFromUser: data.isFromUser,
          conversationId: data.conversationId,
        },
      });

      if (data.isFromUser) {
        await this.conversationService.updateConversationTitleFromFirstMessage(
          data.conversationId,
          data.content
        );
      }

      await prisma.conversation.update({
        where: { id: data.conversationId },
        data: { updatedAt: new Date() },
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
          conversation: {
            include: {
              messages: true,
            },
          },
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
      const conversations = await prisma.conversation.findMany({
        where: { userId },
        take: limit,
      });

      const messagesWithConversations = [];
      for (const conv of conversations) {
        const lastMessage = await prisma.message.findFirst({
          where: { conversationId: conv.id },
          orderBy: { createdAt: "desc" },
        });
        
        if (lastMessage) {
          messagesWithConversations.push({
            conversation: conv,
            lastMessage,
          });
        }
      }

      return messagesWithConversations;
    } catch (error) {
      console.error("Error fetching recent messages:", error);
      throw createError("Failed to fetch recent messages", 500);
    }
  }
}

