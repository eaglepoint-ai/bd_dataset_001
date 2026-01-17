/**
 * WebSocket Server
 * Handles real-time CRDT operation broadcasting with CBOR encoding
 * Messages are kept ≤1KB/update using binary format
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';
import { DocumentService } from '../services/DocumentService';
import { CRDTOperation, VectorClock } from '../crdt/types';
import { encodeMessage, decodeMessage, MessageType } from '../protocol/BinaryProtocol';
import { v4 as uuidv4 } from 'uuid';

interface WebSocketMessage {
  type: 'join' | 'sync' | 'operation' | 'leave';
  documentId?: string;
  siteId?: string;
  operation?: CRDTOperation;
  vectorClock?: Record<string, number>;
}

interface WebSocketResponse {
  type: 'joined' | 'synced' | 'operation' | 'error';
  documentId?: string;
  state?: any;
  operations?: CRDTOperation[];
  operation?: CRDTOperation;
  error?: string;
}

export class WebSocketHandler {
  private wss: WebSocketServer;
  private documentService: DocumentService;
  private clients: Map<WebSocket, string>; // ws -> clientId

  constructor(server: HTTPServer, documentService: DocumentService) {
    this.wss = new WebSocketServer({ server });
    this.documentService = documentService;
    this.clients = new Map();

    this.wss.on('connection', (ws: WebSocket) => {
      this.handleConnection(ws);
    });

    console.log('✅ WebSocket server initialized');
  }

  /**
   * Handles new WebSocket connection
   */
  private handleConnection(ws: WebSocket): void {
    const clientId = uuidv4();
    this.clients.set(ws, clientId);

    console.log(`🔌 Client connected: ${clientId}`);

    ws.on('message', async (data: Buffer) => {
      try {
        await this.handleMessage(ws, clientId, data);
      } catch (error) {
        console.error('Error handling message:', error);
        this.sendError(ws, error instanceof Error ? error.message : 'Unknown error');
      }
    });

    ws.on('close', () => {
      this.handleDisconnect(ws, clientId);
    });

    ws.on('error', (error: Error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
    });
  }

  /**
   * Handles incoming WebSocket messages (custom binary protocol)
   */
  private async handleMessage(ws: WebSocket, clientId: string, data: Buffer): Promise<void> {
    // Decode binary message
    const decoded = decodeMessage(data);
    const message = decoded.payload as WebSocketMessage;

    switch (message.type) {
      case 'join':
        await this.handleJoin(ws, clientId, message);
        break;

      case 'sync':
        await this.handleSync(ws, clientId, message);
        break;

      case 'operation':
        await this.handleOperation(ws, clientId, message);
        break;

      case 'leave':
        await this.handleLeave(ws, clientId, message);
        break;

      default:
        this.sendError(ws, `Unknown message type: ${(message as any).type}`);
    }
  }

  /**
   * Handles client joining a document
   */
  private async handleJoin(ws: WebSocket, clientId: string, message: WebSocketMessage): Promise<void> {
    if (!message.documentId || !message.siteId) {
      this.sendError(ws, 'Missing documentId or siteId');
      return;
    }

    const { document, missingOperations } = await this.documentService.joinDocument(
      message.documentId,
      clientId,
      message.siteId,
      ws
    );

    // Send joined response with current document state
    const response: WebSocketResponse = {
      type: 'joined',
      documentId: message.documentId,
      state: document.toState(),
      operations: missingOperations
    };

    this.sendMessage(ws, response);
  }

  /**
   * Handles client synchronization request
   */
  private async handleSync(ws: WebSocket, clientId: string, message: WebSocketMessage): Promise<void> {
    if (!message.documentId || !message.vectorClock) {
      this.sendError(ws, 'Missing documentId or vectorClock');
      return;
    }

    // Convert vector clock from object to Map
    const vectorClock = new Map(Object.entries(message.vectorClock));

    const missingOperations = await this.documentService.syncClient(
      message.documentId,
      clientId,
      vectorClock
    );

    // Send synced response with missing operations
    const response: WebSocketResponse = {
      type: 'synced',
      documentId: message.documentId,
      operations: missingOperations
    };

    this.sendMessage(ws, response);
  }

  /**
   * Handles CRDT operation from client
   */
  private async handleOperation(ws: WebSocket, clientId: string, message: WebSocketMessage): Promise<void> {
    if (!message.documentId || !message.operation) {
      this.sendError(ws, 'Missing documentId or operation');
      return;
    }

    await this.documentService.applyOperation(
      message.documentId,
      clientId,
      message.operation
    );

    // No response needed - operation will be broadcast to other clients
  }

  /**
   * Handles client leaving a document
   */
  private async handleLeave(ws: WebSocket, clientId: string, message: WebSocketMessage): Promise<void> {
    if (!message.documentId) {
      this.sendError(ws, 'Missing documentId');
      return;
    }

    await this.documentService.leaveDocument(message.documentId, clientId);
  }

  /**
   * Handles client disconnect
   */
  private handleDisconnect(ws: WebSocket, clientId: string): void {
    this.clients.delete(ws);
    console.log(`🔌 Client disconnected: ${clientId}`);
    
    // Note: DocumentService will handle cleanup after timeout
  }

  /**
   * Sends a binary-encoded message to client
   */
  private sendMessage(ws: WebSocket, message: WebSocketResponse): void {
    if (ws.readyState === WebSocket.OPEN) {
      // Map response type to MessageType enum
      let msgType: MessageType;
      switch (message.type) {
        case 'joined': msgType = MessageType.JOINED; break;
        case 'synced': msgType = MessageType.SYNCED; break;
        case 'operation': msgType = MessageType.OPERATION; break;
        case 'error': msgType = MessageType.ERROR; break;
        default: msgType = MessageType.ERROR;
      }
      
      const encoded = encodeMessage(msgType, message);
      ws.send(encoded);
    }
  }

  /**
   * Sends an error message to client
   */
  private sendError(ws: WebSocket, error: string): void {
    const response: WebSocketResponse = {
      type: 'error',
      error
    };
    this.sendMessage(ws, response);
  }

  /**
   * Closes the WebSocket server
   */
  async close(): Promise<void> {
    return new Promise((resolve) => {
      this.wss.close(() => {
        console.log('WebSocket server closed');
        resolve();
      });
    });
  }
}
