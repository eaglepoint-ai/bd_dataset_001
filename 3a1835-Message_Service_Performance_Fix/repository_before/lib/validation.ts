import { z } from "zod";

export const createConversationSchema = z.object({
  title: z.string().optional(),
});

export const updateConversationSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").optional(),
});

export const conversationParamsSchema = z.object({
  id: z.string().cuid("Invalid conversation ID format"),
});

export const createMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Message content cannot be empty")
    .max(1000, "Message content too long"),
  conversationId: z.string().cuid("Invalid conversation ID format"),
  isFromUser: z.boolean().optional().default(true),
});

export const messageParamsSchema = z.object({
  conversationId: z.string().cuid("Invalid conversation ID format"),
});

export const messageQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50)),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;
export type ConversationParams = z.infer<typeof conversationParamsSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type MessageParams = z.infer<typeof messageParamsSchema>;
export type MessageQuery = z.infer<typeof messageQuerySchema>;

