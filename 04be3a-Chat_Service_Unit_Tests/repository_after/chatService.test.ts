import { ChatService } from "../repository_before/chatService";
import prisma from "../repository_before/lib/database";

jest.mock("../repository_before/lib/database", () => ({
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
}));

describe("ChatService", () => {
  let chatService: ChatService;

  beforeEach(() => {
    chatService = new ChatService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createConversation", () => {
    it("should create a conversation successfully with a title", async () => {
      const mockConversation = {
        id: "1",
        title: "Test Chat",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (prisma.conversation.create as jest.Mock).mockResolvedValue(
        mockConversation
      );

      const result = await chatService.createConversation("Test Chat");

      expect(prisma.conversation.create).toHaveBeenCalledWith({
        data: { title: "Test Chat" },
      });
      expect(result).toEqual(mockConversation);
    });

    it("should create a conversation successfully without a title", async () => {
      const mockConversation = {
        id: "1",
        title: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (prisma.conversation.create as jest.Mock).mockResolvedValue(
        mockConversation
      );

      const result = await chatService.createConversation();

      expect(prisma.conversation.create).toHaveBeenCalledWith({
        data: { title: null },
      });
      expect(result).toEqual(mockConversation);
    });

    it("should handle empty string title as null", async () => {
      const mockConversation = {
        id: "1",
        title: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (prisma.conversation.create as jest.Mock).mockResolvedValue(
        mockConversation
      );

      const result = await chatService.createConversation("");

      expect(prisma.conversation.create).toHaveBeenCalledWith({
        data: { title: null },
      });
      expect(result).toEqual(mockConversation);
    });

    it("should throw 409 if title already exists", async () => {
      const error: any = new Error("Unique constraint failed");
      error.code = "P2002";
      (prisma.conversation.create as jest.Mock).mockRejectedValue(error);

      await expect(
        chatService.createConversation("Duplicate")
      ).rejects.toMatchObject({
        message: "Conversation title already exists",
        statusCode: 409,
      });
    });

    it("should throw 500 on unexpected error", async () => {
      (prisma.conversation.create as jest.Mock).mockRejectedValue(
        new Error("DB Error")
      );

      await expect(
        chatService.createConversation("Title")
      ).rejects.toMatchObject({
        message: "Failed to create conversation",
        statusCode: 500,
      });
    });
  });

  describe("getConversationById", () => {
    it("should return conversation if found", async () => {
      const mockConversation = { id: "1", title: "Test", messages: [] };
      (prisma.conversation.findUnique as jest.Mock).mockResolvedValue(
        mockConversation
      );

      const result = await chatService.getConversationById("1");

      expect(prisma.conversation.findUnique).toHaveBeenCalledWith({
        where: { id: "1" },
        include: { messages: true },
      });
      expect(result).toEqual(mockConversation);
    });

    it("should throw 404 if conversation not found", async () => {
      (prisma.conversation.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        chatService.getConversationById("999")
      ).rejects.toMatchObject({
        message: "Conversation not found",
        statusCode: 404,
      });
    });
  });

  describe("getAllConversations", () => {
    it("should return conversations with default pagination", async () => {
      const mockConversations = [{ id: "1" }, { id: "2" }];
      (prisma.conversation.findMany as jest.Mock).mockResolvedValue(
        mockConversations
      );
      (prisma.conversation.count as jest.Mock).mockResolvedValue(20);

      const result = await chatService.getAllConversations();

      expect(prisma.conversation.findMany).toHaveBeenCalledWith({
        orderBy: { updatedAt: "desc" },
        skip: 0,
        take: 20,
      });
      expect(result).toEqual({
        conversations: mockConversations,
        pagination: {
          page: 1,
          limit: 20,
          totalCount: 20,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      });
    });

    it("should return empty results", async () => {
      (prisma.conversation.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.conversation.count as jest.Mock).mockResolvedValue(0);

      const result = await chatService.getAllConversations();

      expect(result.conversations).toEqual([]);
      expect(result.pagination.totalCount).toBe(0);
    });

    it("should handle custom pagination", async () => {
      (prisma.conversation.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.conversation.count as jest.Mock).mockResolvedValue(50);

      // page 2, limit 10. skip = 10.
      const result = await chatService.getAllConversations(2, 10);

      expect(prisma.conversation.findMany).toHaveBeenCalledWith({
        orderBy: { updatedAt: "desc" },
        skip: 10,
        take: 10,
      });
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.hasPrev).toBe(true);
    });

    it("should handle edge case: large limit", async () => {
      (prisma.conversation.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.conversation.count as jest.Mock).mockResolvedValue(100);

      await chatService.getAllConversations(1, 1000);

      expect(prisma.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 1000,
        })
      );
    });

    it("should handle edge case: page 0 (negative skip)", async () => {
      (prisma.conversation.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.conversation.count as jest.Mock).mockResolvedValue(10);

      await chatService.getAllConversations(0, 10);

      expect(prisma.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: -10,
        })
      );
    });

    it("should handle edge case: negative page", async () => {
      (prisma.conversation.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.conversation.count as jest.Mock).mockResolvedValue(10);

      await chatService.getAllConversations(-1, 10);

      expect(prisma.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: -20,
        })
      );
    });
  });

  describe("deleteConversation", () => {
    it("should delete conversation successfully", async () => {
      (prisma.conversation.delete as jest.Mock).mockResolvedValue({ id: "1" });

      const result = await chatService.deleteConversation("1");

      expect(prisma.conversation.delete).toHaveBeenCalledWith({
        where: { id: "1" },
      });
      expect(result).toEqual({ message: "Conversation deleted successfully" });
    });

    it("should throw 404 if not found", async () => {
      const error: any = new Error("Record to delete does not exist");
      error.code = "P2025";
      (prisma.conversation.delete as jest.Mock).mockRejectedValue(error);

      await expect(chatService.deleteConversation("999")).rejects.toMatchObject(
        {
          message: "Conversation not found",
          statusCode: 404,
        }
      );
    });

    it("should throw 500 on other errors", async () => {
      (prisma.conversation.delete as jest.Mock).mockRejectedValue(
        new Error("DB Error")
      );

      await expect(chatService.deleteConversation("1")).rejects.toMatchObject({
        message: "Failed to delete conversation",
        statusCode: 500,
      });
    });
  });

  describe("createMessage", () => {
    it("should create message successfully", async () => {
      const mockMessage = { id: "1", content: "hello", conversationId: "1" };
      (prisma.message.create as jest.Mock).mockResolvedValue(mockMessage);

      const result = await chatService.createMessage("1", "hello", true);

      expect(prisma.message.create).toHaveBeenCalledWith({
        data: { content: "hello", isFromUser: true, conversationId: "1" },
      });
      expect(result).toEqual(mockMessage);
    });

    it("should throw 404 if conversation not found", async () => {
      const error: any = new Error("FK constraint failed");
      error.code = "P2003";
      (prisma.message.create as jest.Mock).mockRejectedValue(error);

      await expect(
        chatService.createMessage("999", "hi")
      ).rejects.toMatchObject({
        message: "Conversation not found",
        statusCode: 404,
      });
    });

    it("should throw 500 on generic error", async () => {
      (prisma.message.create as jest.Mock).mockRejectedValue(new Error("Fail"));
      await expect(chatService.createMessage("1", "hi")).rejects.toMatchObject({
        statusCode: 500,
      });
    });

    it("should handle empty content", async () => {
      const mockMessage = { id: "2", content: "", conversationId: "1" };
      (prisma.message.create as jest.Mock).mockResolvedValue(mockMessage);

      await chatService.createMessage("1", "");

      expect(prisma.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ content: "" }),
        })
      );
    });
  });

  describe("getMessagesByConversation", () => {
    it("should return messages", async () => {
      const mockMessages = [{ id: "1", content: "hi" }];
      (prisma.message.findMany as jest.Mock).mockResolvedValue(mockMessages);
      (prisma.message.count as jest.Mock).mockResolvedValue(1);

      const result = await chatService.getMessagesByConversation("1");

      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: { conversationId: "1" },
        orderBy: { createdAt: "desc" },
        skip: 0,
        take: 50,
      });
      expect(result.messages).toEqual(mockMessages);
    });

    it("should handle pagination", async () => {
      (prisma.message.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.message.count as jest.Mock).mockResolvedValue(100);

      await chatService.getMessagesByConversation("1", 2, 20);

      expect(prisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
        })
      );
    });

    it("should return empty messages list", async () => {
      (prisma.message.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.message.count as jest.Mock).mockResolvedValue(0);

      const result = await chatService.getMessagesByConversation("1");
      expect(result.messages).toEqual([]);
    });
  });
});
