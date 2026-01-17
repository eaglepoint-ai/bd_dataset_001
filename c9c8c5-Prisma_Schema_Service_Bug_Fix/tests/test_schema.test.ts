import * as fs from 'fs';
import * as path from 'path';

const REPO_PATH = process.env.TEST_REPO_PATH || path.join(__dirname, '../repository_after');

describe('Schema Tests', () => {
  let schemaContent: string;

  beforeAll(() => {
    const schemaPath = path.join(REPO_PATH, 'prisma/schema.prisma');
    if (fs.existsSync(schemaPath)) {
      schemaContent = fs.readFileSync(schemaPath, 'utf8');
    } else {
      schemaContent = '';
    }
  });

  describe('Message Model Threading Fields', () => {
    test('should have parentId field', () => {
      expect(schemaContent).toContain('parentId');
      expect(schemaContent).toMatch(/parentId\s+String\?/);
    });

    test('should have parent relation', () => {
      expect(schemaContent).toContain('parent');
      expect(schemaContent).toMatch(/parent\s+Message\?/);
      expect(schemaContent).toContain('@relation("MessageReplies"');
    });

    test('should have replies relation', () => {
      expect(schemaContent).toContain('replies');
      expect(schemaContent).toMatch(/replies\s+Message\[\]/);
      expect(schemaContent).toContain('@relation("MessageReplies"');
    });

    test('should have index on parentId', () => {
      expect(schemaContent).toContain('@@index([parentId])');
    });

    test('should have onDelete: Cascade on parent relation', () => {
      const parentRelationMatch = schemaContent.match(/parent\s+Message\?.*@relation\([^)]+\)/s);
      expect(parentRelationMatch).toBeTruthy();
      if (parentRelationMatch) {
        expect(parentRelationMatch[0]).toContain('onDelete: Cascade');
      }
    });
  });

  describe('Message Model Bug Fixes', () => {
    test('should have @db.Text on content field', () => {
      expect(schemaContent).toMatch(/content\s+String\s+@db\.Text/);
    });

    test('should have @default(false) on isFromUser', () => {
      expect(schemaContent).toMatch(/isFromUser\s+Boolean\s+@default\(false\)/);
    });

    test('should have onDelete: Cascade on conversation relation', () => {
      const conversationRelationMatch = schemaContent.match(/conversation\s+Conversation.*@relation\([^)]+\)/s);
      expect(conversationRelationMatch).toBeTruthy();
      if (conversationRelationMatch) {
        expect(conversationRelationMatch[0]).toContain('onDelete: Cascade');
      }
    });

    test('should have index on conversationId', () => {
      expect(schemaContent).toContain('@@index([conversationId])');
    });

    test('should have composite index on conversationId and createdAt', () => {
      expect(schemaContent).toContain('@@index([conversationId, createdAt])');
    });
  });
});
