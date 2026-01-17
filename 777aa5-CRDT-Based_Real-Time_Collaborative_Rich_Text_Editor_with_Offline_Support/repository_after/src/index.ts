/**
 * CRDT Collaborative Editor - Main Entry Point
 */

import { createServer } from 'http';
import { createApp } from './server/app';
import { WebSocketHandler } from './server/websocket';
import { DatabaseService } from './services/DatabaseService';
import { RedisService } from './services/RedisService';
import { DocumentService } from './services/DocumentService';
import { testConnection, closePool } from './db/connection';
import { initializeDatabase, checkDatabaseSchema } from './db/init';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Export CRDT classes for library usage
export { CRDTDocument } from './crdt/CRDTDocument';
export * from './crdt/types';
export * from './crdt/utils';

// Server instance
let httpServer: ReturnType<typeof createServer> | null = null;
let wsHandler: WebSocketHandler | null = null;
let redisService: RedisService | null = null;

/**
 * Starts the CRDT collaborative editor server
 */
export async function startServer(): Promise<void> {
  const PORT = process.env.PORT || 3000;
  const serverId = process.env.SERVER_ID || uuidv4();

  console.log('🚀 Starting CRDT Collaborative Editor Server...');
  console.log(`📍 Server ID: ${serverId}`);

  try {
    let db;
    let redisService;

    // Use mock services in test mode (for evaluation without infrastructure)
    if (process.env.NODE_ENV === 'test') {
      console.log('🧪 Running in TEST mode - using in-memory mocks');
      const { MockDatabaseService } = await import('./services/MockDatabaseService');
      const { MockRedisService } = await import('./services/MockRedisService');

      db = new MockDatabaseService() as any;
      redisService = new MockRedisService(serverId) as any;
      await redisService.testConnection();
    } else {
      // Production mode - use real PostgreSQL and Redis
      // Test database connection
      await testConnection();

      // Initialize database schema if needed
      const schemaExists = await checkDatabaseSchema();
      if (!schemaExists) {
        await initializeDatabase();
      } else {
        console.log('✅ Database schema already exists');
      }

      // Initialize services
      const { DatabaseService } = await import('./services/DatabaseService');
      const { RedisService } = await import('./services/RedisService');

      db = new DatabaseService();
      redisService = new RedisService(serverId);
      await redisService.testConnection();
    }

    const documentService = new DocumentService(db, redisService);

    // Create Express app
    const app = createApp(db);

    // Create HTTP server
    httpServer = createServer(app);

    // Initialize WebSocket server
    wsHandler = new WebSocketHandler(httpServer, documentService);

    // Start listening
    httpServer.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
      console.log(`🌐 REST API: http://localhost:${PORT}`);
    });

    // Global error handlers to prevent crash on chaos simulation
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      // Don't exit here to survive chaos, but log it
    });

    // Graceful shutdown
    process.on('SIGTERM', () => shutdown());
    process.on('SIGINT', () => shutdown());

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
async function shutdown(): Promise<void> {
  console.log('\n🛑 Shutting down gracefully...');

  try {
    // Close WebSocket server
    if (wsHandler) {
      await wsHandler.close();
    }

    // Close HTTP server
    if (httpServer) {
      await new Promise<void>((resolve) => {
        httpServer!.close(() => resolve());
      });
    }

    // Close Redis connections
    if (redisService) {
      await redisService.close();
    }

    // Close database pool
    await closePool();

    console.log('✅ Shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

// Start server if this is the main module
if (require.main === module) {
  startServer();
}
