/**
 * Express Application
 * REST API for document management and health checks
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { DatabaseService } from '../services/DatabaseService';
import { CRDTDocument } from '../crdt/CRDTDocument';

export function createApp(db: DatabaseService): Express {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  });

  // Create a new document
  app.post('/documents', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title } = req.body;

      if (!title) {
        res.status(400).json({ error: 'Title is required' });
        return;
      }

      // Create empty CRDT document
      const crdtDoc = new CRDTDocument();
      const initialState = crdtDoc.toState();

      // Save to database
      const document = await db.createDocument(title, initialState);

      res.status(201).json({
        id: document.id,
        title: document.title,
        created_at: document.created_at
      });
    } catch (error) {
      next(error);
    }
  });

  // Get document by ID (or create if doesn't exist)
  app.get('/documents/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      let document = await db.getDocument(id);

      // If document doesn't exist, create it
      if (!document) {
        const crdtDoc = new CRDTDocument();
        const initialState = crdtDoc.toState();
        document = await db.createDocument(id, initialState);
      }

      // Restore CRDT document to get text
      const crdtDoc = CRDTDocument.fromState(document.crdt_state);

      res.json({
        id: document.id,
        title: document.title,
        text: crdtDoc.getText(),
        created_at: document.created_at,
        updated_at: document.updated_at
      });
    } catch (error) {
      next(error);
    }
  });

  // Get document operation history
  app.get('/documents/:id/operations', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const operations = await db.getAllOperations(id);

      res.json({
        documentId: id,
        operationCount: operations.length,
        operations
      });
    } catch (error) {
      next(error);
    }
  });

  // Error handler
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  return app;
}
