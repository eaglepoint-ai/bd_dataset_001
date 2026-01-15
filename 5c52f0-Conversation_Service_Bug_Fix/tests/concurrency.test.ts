

import { getService, getPrisma } from "./helper";

const service = getService();
const prisma = getPrisma();

describe("Concurrency Logic", () => {
    beforeEach(async () => {
        try {
            await prisma.message.deleteMany();
            await prisma.conversation.deleteMany();
        } catch (e) { }
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    // --- Task 4 & 11: Title Race Condition ---
    it("REQ-4-11: should generate unique titles for concurrent creations", async () => {
        await prisma.conversation.deleteMany();

        const concurrent = 5;
        const promises = Array.from({ length: concurrent }, () =>
            service.createConversation({})
        );

        const results = await Promise.all(promises);
        const titles = results.map((r: { title: any; }) => r.title);
        const unique = new Set(titles);

        expect(unique.size).toBe(concurrent);
    });
});
