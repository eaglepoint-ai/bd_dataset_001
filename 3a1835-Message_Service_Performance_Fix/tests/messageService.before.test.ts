import assert from 'assert';
import { MessageService } from '../repository_before/services/messageService';
import prisma from '../repository_before/lib/database';

async function runTests() {
  console.log('\n=== MessageService BEFORE - Performance & Correctness Analysis ===\n');
  
  let testsPassed = 0;
  let testsFailed = 0;

  // Clean state
  await prisma.message.deleteMany({});
  await prisma.conversation.deleteMany({});

  // Test 1: getMessagesByConversationId should handle large conversations without loading all into memory
  try {
    console.log('Test 1: SHOULD FAIL - getMessagesByConversationId handles large conversations...');
    
    const conv = await prisma.conversation.create({
      data: { title: 'Large Conv', userId: 'user1' }
    });

    const messages = Array.from({ length: 5000 }).map((_, i) => ({
      content: `msg ${i}`,
      isFromUser: i % 2 === 0,
      conversationId: conv.id,
      createdAt: new Date(Date.now() - i * 1000)
    }));
    await prisma.message.createMany({ data: messages });

    const service = new MessageService();
    
    // Check if the implementation uses database-level pagination (skip/take)
    // The buggy version loads ALL messages then slices in memory
    const messageServiceCode = (service as any).getMessagesByConversationId.toString();
    const usesSkipTake = messageServiceCode.includes('skip') && messageServiceCode.includes('take');
    
    assert.strictEqual(usesSkipTake, true, 'Should use database-level pagination (skip/take), not in-memory slicing');
    console.log('✅ Test 1 passed\n');
    testsPassed++;
  } catch (error: any) {
    console.log(`❌ Test 1 failed\n`);
    testsFailed++;
  }

  // Test 2: getMessageById should NOT over-fetch conversation history
  try {
    console.log('Test 2: SHOULD FAIL - getMessageById should NOT over-fetch...');
    
    const conv = await prisma.conversation.create({
      data: { title: 'Overfetch Conv', userId: 'user2' }
    });
    
    await prisma.message.create({ data: { content: 'target', isFromUser: true, conversationId: conv.id } });
    await prisma.message.create({ data: { content: 'extra1', isFromUser: false, conversationId: conv.id } });
    await prisma.message.create({ data: { content: 'extra2', isFromUser: true, conversationId: conv.id } });

    const targetMsg = await prisma.message.findFirst({ where: { conversationId: conv.id } });
    if (!targetMsg) throw new Error("Setup failed: target message not found");

    const service = new MessageService();
    const result = await service.getMessageById(targetMsg.id);

    assert.ok(result.conversation, 'Conversation should exist');
    assert.strictEqual((result.conversation as any).messages, undefined, 'Messages should NOT be over-fetched');
    console.log('✅ Test 2 passed\n');
    testsPassed++;
  } catch (error: any) {
    console.log(`❌ Test 2 failed\n`);
    testsFailed++;
  }

  // Test 3: n+1 query problem in getRecentMessagesAcrossConversations
  try {
    console.log('Test 3: SHOULD FAIL - n+1 query problem...');
    
    for (let i = 0; i < 5; i++) {
      const conv = await prisma.conversation.create({
        data: { title: `Batch Conv ${i}`, userId: 'user_batch' }
      });
      await prisma.message.create({ 
        data: { content: 'hi', isFromUser: true, conversationId: conv.id } 
      });
    }

    const service = new MessageService();
    
    // Check if the implementation uses a loop (N+1 problem)
    const methodCode = (service as any).getRecentMessagesAcrossConversations.toString();
    const hasLoop = methodCode.includes('for (') || methodCode.includes('for(');
    
    assert.strictEqual(hasLoop, false, 'Should NOT use a loop (N+1 problem), should use include');
    console.log('✅ Test 3 passed\n');
    testsPassed++;
  } catch (error: any) {
    console.log(`❌ Test 3 failed\n`);
    testsFailed++;
  }

  // Test 4: createMessage should be atomic (transactional)
  try {
    console.log('Test 4: SHOULD FAIL - createMessage should be atomic...');
    
    const conv = await prisma.conversation.create({
      data: { title: 'Transact Test', userId: 'user_transact' }
    });
    
    const service = new MessageService();
    
    // Check if the implementation uses transactions
    const methodCode = (service as any).createMessage.toString();
    const usesTransaction = methodCode.includes('$transaction');
    
    assert.strictEqual(usesTransaction, true, 'Should use $transaction for atomicity');
    console.log('✅ Test 4 passed\n');
    testsPassed++;
  } catch (error: any) {
    console.log(`❌ Test 4 failed\n`);
    testsFailed++;
  }

  // Test 5: handle empty conversations gracefully
  try {
    console.log('Test 5: SHOULD PASS - handle empty conversations...');
    
    const conv = await prisma.conversation.create({ data: { title: 'Empty', userId: 'user3' } });
    const service = new MessageService();
    const result = await service.getMessagesByConversationId(conv.id, { page: 1, limit: 10 });
    
    assert.ok(Array.isArray(result.messages), 'Messages should be an array');
    assert.strictEqual(result.messages.length, 0, 'Messages should be empty');
    assert.strictEqual(result.pagination.totalCount, 0, 'Total count should be 0');
    console.log('✅ Test 5 passed\n');
    testsPassed++;
  } catch (error: any) {
    console.log(`❌ Test 5 failed\n`);
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
