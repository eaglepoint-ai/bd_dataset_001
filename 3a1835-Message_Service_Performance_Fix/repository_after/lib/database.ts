// Mock in-memory database
const prisma = {
  message: {
    findMany: async () => [],
    create: async (data: any) => ({ id: '1', ...data.data, createdAt: new Date() }),
    findUnique: async () => null,
    deleteMany: async () => ({ count: 0 }),
    createMany: async () => ({ count: 0 }),
    count: async () => 0,
  },
  conversation: {
    findUnique: async () => null,
    findMany: async () => [],
    create: async (data: any) => ({ id: '1', ...data.data, createdAt: new Date(), updatedAt: new Date() }),
    update: async () => null,
    deleteMany: async () => ({ count: 0 }),
  },
  $transaction: async (fn: any) => fn(prisma),
  $disconnect: async () => {},
};

export default prisma;
