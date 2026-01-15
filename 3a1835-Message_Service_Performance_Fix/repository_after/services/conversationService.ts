import prisma from "../lib/database.js";
import { createError } from "../middleware/errorHandler.js";

export class ConversationService {
  async updateConversationTitleFromFirstMessage(
    conversationId: string,
    content: string
  ) {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { messages: { take: 1 } },
      });

      if (conversation && conversation.messages.length === 1) {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { title: content.slice(0, 50) },
        });
      }
    } catch (error) {
      console.error("Error updating conversation title:", error);
    }
  }
}