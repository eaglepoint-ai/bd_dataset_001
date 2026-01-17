const mockDb = {
  conversations: [] as any[],
  messages: [] as any[],
};

const prisma = {
  conversation: {
    findUnique: async ({ where, include }: any) => {
      const conv = mockDb.conversations.find((c) => c.id === where.id);
      if (!conv) return null;
      if (include?.messages) {
        let messages = mockDb.messages.filter((m) => m.conversationId === conv.id);
        if (include.messages.orderBy?.createdAt === "desc") messages = messages.reverse();
        if (include.messages.take) messages = messages.slice(0, include.messages.take);
        return { ...conv, messages };
      }
      return conv;
    },
    findMany: async ({ where, take, include }: any) => {
      let convs = mockDb.conversations;
      if (where?.userId) convs = convs.filter((c) => c.userId === where.userId);
      if (take) convs = convs.slice(0, take);
      if (include?.messages) {
        convs = convs.map((c) => {
          let messages = mockDb.messages.filter((m) => m.conversationId === c.id);
          if (include.messages.orderBy?.createdAt === "desc") messages = messages.reverse();
          if (include.messages.take) messages = messages.slice(0, include.messages.take);
          return { ...c, messages };
        });
      }
      return convs;
    },
    create: async ({ data, include }: any) => {
      const conv = { id: `conv-${Date.now()}`, createdAt: new Date(), updatedAt: new Date(), ...data };
      
      // Handle nested message creation
      if (data.messages?.create) {
        const messagesToCreate = Array.isArray(data.messages.create) ? data.messages.create : [data.messages.create];
        const createdMessages = messagesToCreate.map((msgData: any) => ({
          id: `msg-${Date.now()}-${Math.random()}`,
          createdAt: new Date(),
          conversationId: conv.id,
          ...msgData
        }));
        mockDb.messages.push(...createdMessages);
        
        // If include.messages is requested, return messages as array
        if (include?.messages) {
          return { ...conv, messages: createdMessages };
        }
      }
      
      mockDb.conversations.push(conv);
      return conv;
    },
    update: async ({ where, data }: any) => {
      const conv = mockDb.conversations.find((c) => c.id === where.id);
      if (conv) Object.assign(conv, data);
      return conv;
    },
    deleteMany: async (params: any = {}) => {
      const prevCount = mockDb.conversations.length;
      mockDb.conversations = [];
      mockDb.messages = [];
      return { count: prevCount };
    },
  },
  message: {
    findMany: async ({ where, orderBy, skip, take }: any) => {
      let msgs = mockDb.messages.filter((m) => m.conversationId === where.conversationId);
      if (orderBy?.createdAt === "desc") msgs = msgs.reverse();
      // Apply skip first, then take
      const startIdx = skip || 0;
      const endIdx = take ? startIdx + take : msgs.length;
      return msgs.slice(startIdx, endIdx);
    },
    count: async ({ where }: any) => {
      return mockDb.messages.filter((m) => m.conversationId === where.conversationId).length;
    },
    create: async ({ data }: any) => {
      const msg = { id: `msg-${Date.now()}`, createdAt: new Date(), ...data };
      mockDb.messages.push(msg);
      return msg;
    },
    createMany: async ({ data }: any) => {
      const msgs = data.map((d: any) => ({ id: `msg-${Date.now()}-${Math.random()}`, createdAt: new Date(), ...d }));
      mockDb.messages.push(...msgs);
      return { count: msgs.length };
    },
    findUnique: async ({ where, include }: any) => {
      const msg = mockDb.messages.find((m) => m.id === where.id);
      if (!msg) return null;
      if (include?.conversation) {
        const conv = mockDb.conversations.find((c) => c.id === msg.conversationId);
        if (include.conversation.include?.messages) {
          const messages = mockDb.messages.filter((m) => m.conversationId === conv?.id);
          return { ...msg, conversation: { ...conv, messages } };
        }
        return { ...msg, conversation: conv };
      }
      return msg;
    },
    findFirst: async ({ where, orderBy }: any) => {
      let msgs = mockDb.messages.filter((m) => m.conversationId === where.conversationId);
      if (orderBy?.createdAt === "desc") msgs = msgs.reverse();
      return msgs[0] || null;
    },
    deleteMany: async (params: any = {}) => {
      const prevCount = mockDb.messages.length;
      mockDb.messages = [];
      return { count: prevCount };
    },
  },
  $disconnect: async () => {
    // No-op for mock
  },
  $transaction: async (callback: any) => {
    // Mock transaction - just execute the callback with prisma as tx
    return await callback(prisma);
  },
};

export default prisma;

