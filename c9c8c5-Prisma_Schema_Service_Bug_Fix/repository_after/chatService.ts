import prisma from "./lib/database";
import { Prisma } from "@prisma/client";
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

  async createMessage(conversationId: string, content: string, isFromUser: boolean = false) {
    try {
      // Verify conversation exists
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw createError("Conversation not found", 404);
      }

      const message = await prisma.message.create({
        data: {
          content,
          isFromUser,
          conversationId,
        },
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

  async deleteConversation(id: string) {
    try {
      await prisma.conversation.delete({
        where: { id },
      });
      return { message: "Deleted successfully" };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw createError("Conversation not found", 404);
        }
      }
      console.error("Error deleting conversation:", error);
      throw createError("Failed to delete conversation", 500);
    }
  }

  // Threading feature methods
  async replyToMessage(parentId: string, content: string, isFromUser: boolean = false) {
    try {
      // Fetch parent message
      const parentMessage = await prisma.message.findUnique({
        where: { id: parentId },
        select: { id: true, conversationId: true, parentId: true },
      });

      if (!parentMessage) {
        throw createError("Parent message not found", 404);
      }

      // Validate: Cannot reply to a reply (max depth = 1)
      if (parentMessage.parentId !== null) {
        throw createError("Cannot reply to a reply. Threading depth exceeded.", 400);
      }

      // Create reply
      const reply = await prisma.message.create({
        data: {
          content,
          isFromUser,
          conversationId: parentMessage.conversationId,
          parentId: parentId,
        },
      });

      return reply;
    } catch (error) {
      if (error instanceof Error && "statusCode" in error) {
        throw error;
      }
      console.error("Error creating reply:", error);
      throw createError("Failed to create reply", 500);
    }
  }

  async getReplies(messageId: string, page = 1, limit = 50) {
    try {
      const skip = (page - 1) * limit;

      const [replies, totalCount] = await Promise.all([
        prisma.message.findMany({
          where: { parentId: messageId },
          orderBy: { createdAt: "asc" },
          skip,
          take: limit,
        }),
        prisma.message.count({ where: { parentId: messageId } }),
      ]);

      return {
        replies,
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
      console.error("Error fetching replies:", error);
      throw createError("Failed to fetch replies", 500);
    }
  }

  async getReplyCount(messageId: string): Promise<number> {
    try {
      const count = await prisma.message.count({
        where: { parentId: messageId },
      });
      return count;
    } catch (error) {
      console.error("Error counting replies:", error);
      throw createError("Failed to count replies", 500);
    }
  }

  async getMessagesWithReplyCount(conversationId: string, page = 1, limit = 50) {
    try {
      const skip = (page - 1) * limit;

      const [messages, totalCount] = await Promise.all([
        prisma.message.findMany({
          where: {
            conversationId,
            parentId: null, // Only top-level messages
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
          include: {
            _count: {
              select: { replies: true },
            },
          },
        }),
        prisma.message.count({
          where: {
            conversationId,
            parentId: null,
          },
        }),
      ]);

      return {
        messages: messages.map((msg) => ({
          ...msg,
          replyCount: msg._count.replies,
        })),
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
      console.error("Error fetching messages with reply count:", error);
      throw createError("Failed to fetch messages with reply count", 500);
    }
  }
}
