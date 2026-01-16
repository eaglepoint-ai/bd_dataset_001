import * as fs from 'fs';
import * as path from 'path';

const REPO_PATH = process.env.TEST_REPO_PATH || path.join(__dirname, '../repository_after');

describe('Service Tests', () => {
  let serviceContent: string;

  beforeAll(() => {
    const servicePath = path.join(REPO_PATH, 'chatService.ts');
    if (fs.existsSync(servicePath)) {
      serviceContent = fs.readFileSync(servicePath, 'utf8');
    } else {
      serviceContent = '';
    }
  });

  describe('Threading Methods Existence', () => {
    test('should have replyToMessage method', () => {
      expect(serviceContent).toContain('replyToMessage');
      expect(serviceContent).toMatch(/async\s+replyToMessage\s*\(/);
    });

    test('should have getReplies method', () => {
      expect(serviceContent).toContain('getReplies');
      expect(serviceContent).toMatch(/async\s+getReplies\s*\(/);
    });

    test('should have getReplyCount method', () => {
      expect(serviceContent).toContain('getReplyCount');
      expect(serviceContent).toMatch(/async\s+getReplyCount\s*\(/);
    });

    test('should have getMessagesWithReplyCount method', () => {
      expect(serviceContent).toContain('getMessagesWithReplyCount');
      expect(serviceContent).toMatch(/async\s+getMessagesWithReplyCount\s*\(/);
    });
  });

  describe('replyToMessage Implementation', () => {
    test('should accept parentId, content, and isFromUser parameters', () => {
      const methodMatch = serviceContent.match(/async\s+replyToMessage\s*\([^)]+\)/);
      expect(methodMatch).toBeTruthy();
      if (methodMatch) {
        expect(methodMatch[0]).toContain('parentId');
        expect(methodMatch[0]).toContain('content');
        expect(methodMatch[0]).toContain('isFromUser');
      }
    });

    test('should check if parent message exists', () => {
      expect(serviceContent).toMatch(/findUnique.*where.*id.*parentId/s);
    });

    test('should validate threading depth (cannot reply to reply)', () => {
      expect(serviceContent).toMatch(/parentId.*!==.*null/);
      expect(serviceContent).toContain('Threading depth exceeded');
    });

    test('should throw 404 if parent not found', () => {
      const replyMethod = serviceContent.match(/async\s+replyToMessage[\s\S]*?(?=async\s+\w+|$)/);
      expect(replyMethod).toBeTruthy();
      if (replyMethod) {
        expect(replyMethod[0]).toContain('404');
        expect(replyMethod[0]).toMatch(/Parent message not found/i);
      }
    });

    test('should throw 400 for threading depth violation', () => {
      const replyMethod = serviceContent.match(/async\s+replyToMessage[\s\S]*?(?=async\s+\w+|$)/);
      expect(replyMethod).toBeTruthy();
      if (replyMethod) {
        expect(replyMethod[0]).toContain('400');
      }
    });

    test('should create message with parentId', () => {
      const replyMethod = serviceContent.match(/async\s+replyToMessage[\s\S]*?(?=async\s+\w+|$)/);
      expect(replyMethod).toBeTruthy();
      if (replyMethod) {
        expect(replyMethod[0]).toMatch(/create.*parentId/s);
      }
    });
  });

  describe('getReplies Implementation', () => {
    test('should accept messageId, page, and limit parameters', () => {
      const methodMatch = serviceContent.match(/async\s+getReplies\s*\([^)]+\)/);
      expect(methodMatch).toBeTruthy();
      if (methodMatch) {
        expect(methodMatch[0]).toContain('messageId');
        expect(methodMatch[0]).toContain('page');
        expect(methodMatch[0]).toContain('limit');
      }
    });

    test('should query messages where parentId equals messageId', () => {
      const getRepliesMethod = serviceContent.match(/async\s+getReplies[\s\S]*?(?=async\s+\w+|$)/);
      expect(getRepliesMethod).toBeTruthy();
      if (getRepliesMethod) {
        expect(getRepliesMethod[0]).toMatch(/where.*parentId.*messageId/s);
      }
    });

    test('should return paginated results', () => {
      const getRepliesMethod = serviceContent.match(/async\s+getReplies[\s\S]*?(?=async\s+\w+|$)/);
      expect(getRepliesMethod).toBeTruthy();
      if (getRepliesMethod) {
        expect(getRepliesMethod[0]).toContain('pagination');
        expect(getRepliesMethod[0]).toContain('skip');
        expect(getRepliesMethod[0]).toContain('take');
      }
    });
  });

  describe('getReplyCount Implementation', () => {
    test('should accept messageId parameter', () => {
      const methodMatch = serviceContent.match(/async\s+getReplyCount\s*\([^)]+\)/);
      expect(methodMatch).toBeTruthy();
      if (methodMatch) {
        expect(methodMatch[0]).toContain('messageId');
      }
    });

    test('should return number type', () => {
      const methodMatch = serviceContent.match(/async\s+getReplyCount\s*\([^)]+\)\s*:\s*Promise<(\w+)>/);
      expect(methodMatch).toBeTruthy();
      if (methodMatch) {
        expect(methodMatch[1]).toBe('number');
      }
    });

    test('should use count query on messages', () => {
      const getReplyCountMethod = serviceContent.match(/async\s+getReplyCount[\s\S]*?(?=async\s+\w+|$)/);
      expect(getReplyCountMethod).toBeTruthy();
      if (getReplyCountMethod) {
        expect(getReplyCountMethod[0]).toMatch(/count.*where.*parentId/s);
      }
    });
  });

  describe('getMessagesWithReplyCount Implementation', () => {
    test('should accept conversationId, page, and limit parameters', () => {
      const methodMatch = serviceContent.match(/async\s+getMessagesWithReplyCount\s*\([^)]+\)/);
      expect(methodMatch).toBeTruthy();
      if (methodMatch) {
        expect(methodMatch[0]).toContain('conversationId');
        expect(methodMatch[0]).toContain('page');
        expect(methodMatch[0]).toContain('limit');
      }
    });

    test('should filter for top-level messages only (parentId: null)', () => {
      const method = serviceContent.match(/async\s+getMessagesWithReplyCount[\s\S]*?(?=async\s+\w+|$)/);
      expect(method).toBeTruthy();
      if (method) {
        expect(method[0]).toMatch(/parentId:\s*null/);
      }
    });

    test('should include reply count using _count', () => {
      const method = serviceContent.match(/async\s+getMessagesWithReplyCount[\s\S]*?(?=async\s+\w+|$)/);
      expect(method).toBeTruthy();
      if (method) {
        expect(method[0]).toMatch(/include.*_count.*replies/s);
      }
    });
  });

  describe('Bug Fixes in Existing Methods', () => {
    test('createMessage should have default value for isFromUser', () => {
      const createMessageMatch = serviceContent.match(/async\s+createMessage\s*\([^)]+\)/);
      expect(createMessageMatch).toBeTruthy();
      if (createMessageMatch) {
        expect(createMessageMatch[0]).toMatch(/isFromUser.*=.*false/);
      }
    });

    test('createMessage should validate conversation exists', () => {
      const createMessageMethod = serviceContent.match(/async\s+createMessage[\s\S]*?(?=async\s+\w+|$)/);
      expect(createMessageMethod).toBeTruthy();
      if (createMessageMethod) {
        expect(createMessageMethod[0]).toMatch(/findUnique.*conversation/is);
        expect(createMessageMethod[0]).toContain('404');
      }
    });

    test('getConversationMessages should return pagination info', () => {
      const method = serviceContent.match(/async\s+getConversationMessages[\s\S]*?(?=async\s+\w+|$)/);
      expect(method).toBeTruthy();
      if (method) {
        expect(method[0]).toContain('pagination');
        expect(method[0]).toContain('totalCount');
      }
    });

    test('deleteConversation should handle P2025 error (not found)', () => {
      const method = serviceContent.match(/async\s+deleteConversation[\s\S]*?(?=async\s+\w+|$)/);
      expect(method).toBeTruthy();
      if (method) {
        expect(method[0]).toContain('P2025');
        expect(method[0]).toContain('404');
      }
    });
  });
});
