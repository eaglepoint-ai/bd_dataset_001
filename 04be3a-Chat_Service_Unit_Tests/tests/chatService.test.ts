// Ground truth test file - correct implementation
import prisma from "../repository_before/lib/database";
import { ChatService } from "../repository_before/chatService";

jest.mock("../repository_before/lib/database", () => ({
  __esModule: true,
  default: {
    conversation: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock("../repository_before/middleware/errorHandler", () => ({
  __esModule: true,
  createError: (message: string, statusCode: number) => {
    const err: any = new Error(message);
    err.statusCode = statusCode;
    return err;
  },
}));

const mockedPrisma = prisma as unknown as {
  conversation: {
    create: jest.Mock;
    findUnique: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    delete: jest.Mock;
  };
  message: {
    create: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
  };
};

describe("ChatService", () => {
  let service: ChatService;

  beforeEach(() => {
    service = new ChatService();
    jest.clearAllMocks();
  });

  describe("createConversation", () => {
    it("creates conversation with provided title", async () => {
      const conversation = { id: "c1", title: "My Chat" };
      mockedPrisma.conversation.create.mockResolvedValue(conversation);

      const result = await service.createConversation("My Chat");

      expect(mockedPrisma.conversation.create).toHaveBeenCalledWith({
        data: { title: "My Chat" },
      });
      expect(result).toEqual(conversation);
    });

    it("empty string title becomes null (title || null)", async () => {
      const conversation = { id: "c2", title: null };
      mockedPrisma.conversation.create.mockResolvedValue(conversation);

      const result = await service.createConversation("");

      expect(mockedPrisma.conversation.create).toHaveBeenCalledWith({
        data: { title: null },
      });
      expect(result).toEqual(conversation);
    });

    it("throws 409 for duplicate title (P2002)", async () => {
      mockedPrisma.conversation.create.mockRejectedValue({ code: "P2002" });

      await expect(service.createConversation("Dup")).rejects.toMatchObject({
        message: "Conversation title already exists",
        statusCode: 409,
      });
    });

    it("throws 500 for unknown error", async () => {
      mockedPrisma.conversation.create.mockRejectedValue(new Error("DB down"));

      await expect(service.createConversation("X")).rejects.toMatchObject({
        message: "Failed to create conversation",
        statusCode: 500,
      });
    });
  });

  describe("getConversationById", () => {
    it("returns conversation with messages when found", async () => {
      const conversation = {
        id: "c1",
        title: "T",
        messages: [{ id: "m1", content: "hi" }],
      };
      mockedPrisma.conversation.findUnique.mockResolvedValue(conversation);

      const result = await service.getConversationById("c1");

      expect(mockedPrisma.conversation.findUnique).toHaveBeenCalledWith({
        where: { id: "c1" },
        include: { messages: true },
      });
      expect(result).toEqual(conversation);
    });

    it("throws 404 when not found", async () => {
      mockedPrisma.conversation.findUnique.mockResolvedValue(null);

      await expect(service.getConversationById("missing")).rejects.toMatchObject({
        message: "Conversation not found",
        statusCode: 404,
      });
    });
  });

  describe("getAllConversations", () => {
    it("returns conversations with correct pagination", async () => {
      mockedPrisma.conversation.findMany.mockResolvedValue([{ id: "c1" }, { id: "c2" }]);
      mockedPrisma.conversation.count.mockResolvedValue(2);

      const result = await service.getAllConversations(1, 20);

      expect(mockedPrisma.conversation.findMany).toHaveBeenCalledWith({
        orderBy: { updatedAt: "desc" },
        skip: 0,
        take: 20,
      });
      expect(result.conversations).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        totalCount: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    });

    it("handles empty results", async () => {
      mockedPrisma.conversation.findMany.mockResolvedValue([]);
      mockedPrisma.conversation.count.mockResolvedValue(0);

      const result = await service.getAllConversations(1, 20);

      expect(result.conversations).toEqual([]);
      expect(result.pagination.totalPages).toBe(0);
    });

    it("page 0 produces negative skip", async () => {
      mockedPrisma.conversation.findMany.mockResolvedValue([]);
      mockedPrisma.conversation.count.mockResolvedValue(0);

      await service.getAllConversations(0, 20);

      expect(mockedPrisma.conversation.findMany).toHaveBeenCalledWith({
        orderBy: { updatedAt: "desc" },
        skip: -20,
        take: 20,
      });
    });
  });

  describe("deleteConversation", () => {
    it("deletes conversation successfully", async () => {
      mockedPrisma.conversation.delete.mockResolvedValue({ id: "c1" });

      const result = await service.deleteConversation("c1");

      expect(mockedPrisma.conversation.delete).toHaveBeenCalledWith({
        where: { id: "c1" },
      });
      expect(result).toEqual({ message: "Conversation deleted successfully" });
    });

    it("throws 404 when not found (P2025)", async () => {
      mockedPrisma.conversation.delete.mockRejectedValue({ code: "P2025" });

      await expect(service.deleteConversation("missing")).rejects.toMatchObject({
        message: "Conversation not found",
        statusCode: 404,
      });
    });
  });

  describe("createMessage", () => {
    it("creates message successfully", async () => {
      const msg = { id: "m1", conversationId: "c1", content: "hello", isFromUser: false };
      mockedPrisma.message.create.mockResolvedValue(msg);

      const result = await service.createMessage("c1", "hello");

      expect(mockedPrisma.message.create).toHaveBeenCalledWith({
        data: { content: "hello", isFromUser: false, conversationId: "c1" },
      });
      expect(result).toEqual(msg);
    });

    it("throws 404 when conversation not found (P2003)", async () => {
      mockedPrisma.message.create.mockRejectedValue({ code: "P2003" });

      await expect(service.createMessage("missing", "hi")).rejects.toMatchObject({
        message: "Conversation not found",
        statusCode: 404,
      });
    });
  });

  describe("getMessagesByConversation", () => {
    it("returns messages with correct pagination", async () => {
      mockedPrisma.message.findMany.mockResolvedValue([{ id: "m1" }, { id: "m2" }]);
      mockedPrisma.message.count.mockResolvedValue(2);

      const result = await service.getMessagesByConversation("c1", 1, 50);

      expect(mockedPrisma.message.findMany).toHaveBeenCalledWith({
        where: { conversationId: "c1" },
        orderBy: { createdAt: "desc" },
        skip: 0,
        take: 50,
      });
      expect(result.messages).toHaveLength(2);
    });

    it("handles empty results", async () => {
      mockedPrisma.message.findMany.mockResolvedValue([]);
      mockedPrisma.message.count.mockResolvedValue(0);

      const result = await service.getMessagesByConversation("c1", 1, 50);

      expect(result.messages).toEqual([]);
      expect(result.pagination.totalPages).toBe(0);
    });
  });
});

