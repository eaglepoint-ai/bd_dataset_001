import prisma from "./lib/database";
import { createError } from "./middleware/errorHandler";

export class ChatService {
  async createConversation(title?: string) {
    try {
      const conversation = await prisma.conversation.create({
        data: { title },
      });
      return conversation;
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw createError("Failed to create conversation", 500);
    }
  }

  async getConversationMessages(conversationId: string, page = 1, limit = 50) {
    try {
      const skip = (page - 1) * limit;

      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      });

      return messages;
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw createError("Failed to fetch messages", 500);
    }
  }

  async createMessage(conversationId: string, content: string, isFromUser: boolean) {
    try {
      const message = await prisma.message.create({
        data: {
          content,
          isFromUser,
          conversationId,
        },
      });
      return message;
    } catch (error) {
      console.error("Error creating message:", error);
      throw createError("Failed to create message", 500);
    }
  }

  async deleteConversation(id: string) {
    try {
      await prisma.conversation.delete({
        where: { id },
      });
      return { message: "Deleted successfully" };
    } catch (error) {
      console.error("Error deleting conversation:", error);
      throw createError("Failed to delete conversation", 500);
    }
  }
}

