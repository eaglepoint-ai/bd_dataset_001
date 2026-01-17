import { MessageService } from "./services/messageService";

async function main() {
  console.log("=== Message Service Performance Test ===\n");
  
  const messageService = new MessageService();
  
  console.log("MessageService initialized successfully");
  console.log("Note: This service has performance issues:");
  console.log("  - Pagination done in memory (fetches all, then slices)");
  console.log("  - Sequential queries instead of parallel");
  console.log("  - N+1 queries in getRecentMessagesAcrossConversations");
  console.log("  - Over-fetching in getMessageById");
  console.log("\nFix these issues to improve performance.\n");
  
  console.log("=== Done ===");
}

main().catch(console.error);

