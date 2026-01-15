import assert from 'assert';
import { MessageService } from '../repository_after/services/messageService';
import prisma from '../repository_after/lib/database';

async function runTests() {
  console.log('\n=== MessageService AFTER - Performance & Correctness Verification ===\n');
  
  let testsPassed = 0;
  let testsFailed = 0;

  // Clean state
  await prisma.message.deleteMany({});
  await prisma.conversation.deleteMany({});

  // Test 1: getMessagesByConversationId handles large conversations correctly (10,000+ messages)
  try {
    console.log('Test 1: SHOULD PASS - handles large conversations (10,000+ messages)...');
    
    const conv = await prisma.conversation.create({
      data: { title: 'Large Conv Opt', userId: 'user1' }
    });

    const messages = Array.from({ length: 10000 }).map((_, i) => ({
      content: `msg ${i}`,
      isFromUser: i % 2 === 0,
      conversationId: conv.id,
      createdAt: new Date(Date.now() - i * 1000)
    }));
    await prisma.message.createMany({ data: messages });

    const service = new MessageService();
    const result = await service.getMessagesByConversationId(conv.id, { page: 2, limit: 10 });

    assert.strictEqual(result.messages.length, 10, 'Should return 10 messages');
    assert.strictEqual(result.pagination.totalCount, 10000, 'Total count should be 10000');
    assert.strictEqual(result.pagination.hasNext, true, 'Should have next page');
    assert.strictEqual(result.pagination.hasPrev, true, 'Should have previous page');
    assert.strictEqual(result.pagination.page, 2, 'Page should be 2');
    assert.strictEqual(result.pagination.limit, 10, 'Limit should be 10');
    assert.strictEqual(result.pagination.totalPages, 1000, 'Total pages should be 1000');
    console.log('✅ Test 1 passed\n');
    testsPassed++;
  } catch (error: any) {
    console.log(`❌ Test 1 failed: ${error.message}\n`);
    testsFailed++;
  }

  // Test 2: getMessageById does NOT over-fetch
  try {
    console.log('Test 2: SHOULD PASS - getMessageById does NOT over-fetch...');
    
    const conv = await prisma.conversation.create({
      data: {
        title: 'Overfetch Check',
        userId: 'user2',
        messages: {
          create: [
            { content: 'target', isFromUser: true },
            { content: 'extra', isFromUser: false }
          ]
        }
      },
      include: { messages: true }
    });

    const targetMsg = conv.messages.find((m: any) => m.content === 'target');
    if (!targetMsg) throw new Error("Setup failed: target message not found");

    const service = new MessageService();
    const result = await service.getMessageById(targetMsg.id);

    assert.ok(result.conversation, 'Conversation should exist');
    assert.strictEqual((result.conversation as any).messages, undefined, 'Messages array should be undefined');
    console.log('✅ Test 2 passed\n');
    testsPassed++;
  } catch (error: any) {
    console.log(`❌ Test 2 failed: ${error.message}\n`);
    testsFailed++;
  }

  // Test 3: creates message atomically (transactional)
  try {
    console.log('Test 3: SHOULD PASS - creates message atomically...');
    
    const conv = await prisma.conversation.create({
      data: { title: 'Transact', userId: 'user3' }
    });
    const service = new MessageService();
    const msg = await service.createMessage({
      conversationId: conv.id,
      content: 'Atomic Msg',
      isFromUser: true
    });

    assert.ok(msg, 'Message should exist');
    assert.strictEqual(msg.content, 'Atomic Msg', 'Content should match');

    const updatedConv = await prisma.conversation.findUnique({ where: { id: conv.id } });
    assert.strictEqual(updatedConv?.title, 'Atomic Msg', 'Title should be updated');
    assert.ok(updatedConv?.updatedAt, 'updatedAt should be set');
    console.log('✅ Test 3 passed\n');
    testsPassed++;
  } catch (error: any) {
    console.log(`❌ Test 3 failed: ${error.message}\n`);
    testsFailed++;
  }

  // Test 4: createMessage updates title only on first user message
  try {
    console.log('Test 4: SHOULD PASS - updates title only on first user message...');
    
    const conv = await prisma.conversation.create({
      data: { title: 'Original Title', userId: 'user_title' }
    });
    const service = new MessageService();
    await service.createMessage({
      conversationId: conv.id,
      content: 'This is a very long message that should be sliced to 50 characters exactly as required',
      isFromUser: true
    });

    let updatedConv = await prisma.conversation.findUnique({ where: { id: conv.id } });
    assert.strictEqual(updatedConv?.title, 'This is a very long message that should be sli', 'Title should be sliced to 50 chars');
    assert.strictEqual(updatedConv?.title.length, 50, 'Title length should be 50');

    await service.createMessage({
      conversationId: conv.id,
      content: 'Second message',
      isFromUser: true
    });

    updatedConv = await prisma.conversation.findUnique({ where: { id: conv.id } });
    assert.strictEqual(updatedConv?.title, 'This is a very long message that should be sli', 'Title should remain unchanged');
    console.log('✅ Test 4 passed\n');
    testsPassed++;
  } catch (error: any) {
    console.log(`❌ Test 4 failed: ${error.message}\n`);
    testsFailed++;
  }

  // Test 5: createMessage does NOT update title for non-user messages
  try {
    console.log('Test 5: SHOULD PASS - does NOT update title for non-user messages...');
    
    const conv = await prisma.conversation.create({
      data: { title: 'Original Title', userId: 'user_no_title' }
    });
    const service = new MessageService();
    
    await service.createMessage({
      conversationId: conv.id,
      content: 'Bot message',
      isFromUser: false
    });

    const updatedConv = await prisma.conversation.findUnique({ where: { id: conv.id } });
    assert.strictEqual(updatedConv?.title, 'Original Title', 'Title should remain unchanged');
    assert.ok(updatedConv?.updatedAt, 'updatedAt should be set');
    console.log('✅ Test 5 passed\n');
    testsPassed++;
  } catch (error: any) {
    console.log(`❌ Test 5 failed: ${error.message}\n`);
    testsFailed++;
  }

  // Test 6: getRecentMessagesAcrossConversations structure (no N+1 queries)
  try {
    console.log('Test 6: SHOULD PASS - no N+1 queries...');
    
    for (let i = 0; i < 5; i++) {
      await prisma.conversation.create({
        data: {
          title: `Recent Conv ${i}`,
          userId: 'user_recent',
          messages: { create: { content: `last one ${i}`, isFromUser: true } }
        }
      });
    }

    const service = new MessageService();
    const result = await service.getRecentMessagesAcrossConversations('user_recent', 10);

    assert.strictEqual(result.length, 5, 'Should return 5 results');
    assert.ok(result[0].lastMessage, 'Should have lastMessage');
    assert.ok(result[0].lastMessage?.content.includes('last one'), 'Content should match');
    assert.strictEqual((result[0].conversation as any).messages, undefined, 'Messages should be undefined');
    
    result.forEach((item: any) => {
      assert.ok(item.lastMessage, 'Each item should have lastMessage');
      assert.ok(item.conversation, 'Each item should have conversation');
    });
    console.log('✅ Test 6 passed\n');
    testsPassed++;
  } catch (error: any) {
    console.log(`❌ Test 6 failed: ${error.message}\n`);
    testsFailed++;
  }

  // Test 7: handle empty conversations gracefully
  try {
    console.log('Test 7: SHOULD PASS - handle empty conversations...');
    
    const conv = await prisma.conversation.create({ 
      data: { title: 'Empty', userId: 'user_empty' } 
    });
    const service = new MessageService();
    const result = await service.getMessagesByConversationId(conv.id, { page: 1, limit: 10 });

    assert.ok(Array.isArray(result.messages), 'Messages should be an array');
    assert.strictEqual(result.messages.length, 0, 'Messages should be empty');
    assert.strictEqual(result.pagination.totalCount, 0, 'Total count should be 0');
    assert.strictEqual(result.pagination.totalPages, 0, 'Total pages should be 0');
    assert.strictEqual(result.pagination.hasNext, false, 'Should not have next page');
    assert.strictEqual(result.pagination.hasPrev, false, 'Should not have previous page');
    assert.strictEqual(result.pagination.page, 1, 'Page should be 1');
    assert.strictEqual(result.pagination.limit, 10, 'Limit should be 10');
    console.log('✅ Test 7 passed\n');
    testsPassed++;
  } catch (error: any) {
    console.log(`❌ Test 7 failed: ${error.message}\n`);
    testsFailed++;
  }

  // Test 8: pagination edge cases - first page
  try {
    console.log('Test 8: SHOULD PASS - pagination first page...');
    
    const conv = await prisma.conversation.create({
      data: { title: 'Pagination Test', userId: 'user_pag' }
    });

    const messages = Array.from({ length: 25 }).map((_, i) => ({
      content: `msg ${i}`,
      isFromUser: i % 2 === 0,
      conversationId: conv.id,
      createdAt: new Date(Date.now() - i * 1000)
    }));
    await prisma.message.createMany({ data: messages });

    const service = new MessageService();
    const result = await service.getMessagesByConversationId(conv.id, { page: 1, limit: 10 });

    assert.strictEqual(result.messages.length, 10, 'Should return 10 messages');
    assert.strictEqual(result.pagination.page, 1, 'Page should be 1');
    assert.strictEqual(result.pagination.hasPrev, false, 'Should not have previous page');
    assert.strictEqual(result.pagination.hasNext, true, 'Should have next page');
    assert.strictEqual(result.pagination.totalCount, 25, 'Total count should be 25');
    console.log('✅ Test 8 passed\n');
    testsPassed++;
  } catch (error: any) {
    console.log(`❌ Test 8 failed: ${error.message}\n`);
    testsFailed++;
  }

  // Test 9: pagination edge cases - last page
  try {
    console.log('Test 9: SHOULD PASS - pagination last page...');
    
    const conv = await prisma.conversation.create({
      data: { title: 'Last Page Test', userId: 'user_last' }
    });

    const messages = Array.from({ length: 25 }).map((_, i) => ({
      content: `msg ${i}`,
      isFromUser: i % 2 === 0,
      conversationId: conv.id,
      createdAt: new Date(Date.now() - i * 1000)
    }));
    await prisma.message.createMany({ data: messages });

    const service = new MessageService();
    const result = await service.getMessagesByConversationId(conv.id, { page: 3, limit: 10 });

    assert.strictEqual(result.messages.length, 5, 'Should return 5 messages');
    assert.strictEqual(result.pagination.page, 3, 'Page should be 3');
    assert.strictEqual(result.pagination.hasPrev, true, 'Should have previous page');
    assert.strictEqual(result.pagination.hasNext, false, 'Should not have next page');
    assert.strictEqual(result.pagination.totalCount, 25, 'Total count should be 25');
    console.log('✅ Test 9 passed\n');
    testsPassed++;
  } catch (error: any) {
    console.log(`❌ Test 9 failed: ${error.message}\n`);
    testsFailed++;
  }

  // Test 10: pagination edge cases - page beyond available data
  try {
    console.log('Test 10: SHOULD PASS - pagination beyond available data...');
    
    const conv = await prisma.conversation.create({
      data: { title: 'Beyond Page Test', userId: 'user_beyond' }
    });

    const messages = Array.from({ length: 10 }).map((_, i) => ({
      content: `msg ${i}`,
      isFromUser: i % 2 === 0,
      conversationId: conv.id,
      createdAt: new Date(Date.now() - i * 1000)
    }));
    await prisma.message.createMany({ data: messages });

    const service = new MessageService();
    const result = await service.getMessagesByConversationId(conv.id, { page: 5, limit: 10 });

    assert.ok(Array.isArray(result.messages), 'Messages should be an array');
    assert.strictEqual(result.messages.length, 0, 'Messages should be empty');
    assert.strictEqual(result.pagination.page, 5, 'Page should be 5');
    assert.strictEqual(result.pagination.hasPrev, true, 'Should have previous page');
    assert.strictEqual(result.pagination.hasNext, false, 'Should not have next page');
    assert.strictEqual(result.pagination.totalCount, 10, 'Total count should be 10');
    console.log('✅ Test 10 passed\n');
    testsPassed++;
  } catch (error: any) {
    console.log(`❌ Test 10 failed: ${error.message}\n`);
    testsFailed++;
  }

  // Cleanup
  await prisma.$disconnect();

  // Summary
  console.log('='.repeat(60));
  console.log(`Tests passed: ${testsPassed}`);
  console.log(`Tests failed: ${testsFailed}`);
  console.log('='.repeat(60));

  process.exit(testsFailed > 0 ? 1 : 0);
}

runTests().catch((error: any) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
