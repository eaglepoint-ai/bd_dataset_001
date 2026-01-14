import prisma from "./lib/database";
import { createError } from "./middleware/errorHandler";

export class MessageService {
  async createMessage(conversationId: string, content: string, isFromUser: boolean = false) {
    try {
      const message = await prisma.message.create({
        data: {
          content,
          isFromUser,
          conversationId,
        },
      });
      return message;
    } catch (error: any) {
      if (error?.code === "P2003") {
        throw createError("Conversation not found", 404);
      }
      console.error("Error creating message:", error);
      throw createError("Failed to create message", 500);
    }
  }

  async getMessagesByConversation(conversationId: string, page = 1, limit = 50) {
    try {
      const skip = (page - 1) * limit;

      const [messages, totalCount] = await Promise.all([
        prisma.message.findMany({
          where: { conversationId },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.message.count({ where: { conversationId } }),
      ]);

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
      console.error("Error fetching messages:", error);
      throw createError("Failed to fetch messages", 500);
    }
  }

  async getMessageById(id: string) {
    try {
      const message = await prisma.message.findUnique({
        where: { id },
      });

      if (!message) {
        throw createError("Message not found", 404);
      }

      return message;
    } catch (error: any) {
      if (error?.statusCode) {
        throw error;
      }
      console.error("Error fetching message:", error);
      throw createError("Failed to fetch message", 500);
    }
  }

  async deleteMessage(id: string) {
    try {
      await prisma.message.delete({
        where: { id },
      });
      return { message: "Message deleted successfully" };
    } catch (error: any) {
      if (error?.code === "P2025") {
        throw createError("Message not found", 404);
      }
      console.error("Error deleting message:", error);
      throw createError("Failed to delete message", 500);
    }
  }

  // TODO: Implement threading feature
  // - replyToMessage(parentId, content, isFromUser)
  // - getReplies(messageId, page, limit)
  // - getReplyCount(messageId)
  // - getMessagesWithReplyCount(conversationId)
}
