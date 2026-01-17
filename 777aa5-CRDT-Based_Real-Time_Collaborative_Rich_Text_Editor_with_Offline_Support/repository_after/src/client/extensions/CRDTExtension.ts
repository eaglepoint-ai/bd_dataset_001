/**
 * CRDTExtension - The "Senior Engineer" Capstone
 * 
 * This is the hardest piece: bridging ProseMirror's position-based model
 * with CRDT's ID-based model.
 * 
 * The Challenge:
 * - ProseMirror: "Insert 'x' at position 5"
 * - CRDT: "Insert 'x' after node 'UserA-101'"
 * 
 * The Solution:
 * - Use PositionMap to maintain bidirectional index↔ID mapping
 * - Listen to ProseMirror transactions via appendTransaction hook
 * - Convert position-based changes to CRDT operations
 * - Apply remote CRDT operations back to ProseMirror
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { CRDTDocument } from '../../crdt/CRDTDocument';
import { CRDTOperation } from '../../crdt/types';
import { PositionMap } from '../PositionMap';
import { WebSocketClient } from '../WebSocketClient';

export interface CRDTExtensionOptions {
  documentId: string;
  websocketUrl: string;
  siteId?: string;
}

interface CRDTPluginState {
  crdt: CRDTDocument;
  positionMap: PositionMap;
  wsClient: WebSocketClient;
  isApplyingRemote: boolean;
}

const CRDTPluginKey = new PluginKey<CRDTPluginState>('crdt');

export const CRDTExtension = Extension.create<CRDTExtensionOptions>({
  name: 'crdt',

  addOptions() {
    return {
      documentId: '',
      websocketUrl: 'ws://localhost:3000',
      siteId: undefined
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;

    return [
      new Plugin<CRDTPluginState>({
        key: CRDTPluginKey,

        state: {
          init: () => {
            const crdt = new CRDTDocument(options.siteId);
            const positionMap = new PositionMap();

            // Initialize WebSocket client
            const wsClient = new WebSocketClient({
              url: options.websocketUrl,
              documentId: options.documentId,
              onOperation: (operation: CRDTOperation) => {
                // Handle remote operations
                const state = CRDTPluginKey.getState(this.editor.state);
                if (state) {
                  state.isApplyingRemote = true;
                  state.crdt.applyOperation(operation);

                  // Rebuild position map
                  const orderedNodes = getOrderedNodes(state.crdt);
                  state.positionMap.rebuild(orderedNodes);

                  // Apply to ProseMirror
                  applyRemoteOperation(this.editor, operation, state);
                  state.isApplyingRemote = false;
                }
              },
              onSynced: (state: any) => {
                console.log('Document synced:', state);
                // TODO: Initialize CRDT from server state
              },
              onError: (error: Error) => {
                console.error('WebSocket error:', error);
              }
            });

            wsClient.connect();

            return {
              crdt,
              positionMap,
              wsClient,
              isApplyingRemote: false
            };
          },

          apply: (tr, pluginState) => {
            // Skip if applying remote operation
            if (pluginState.isApplyingRemote) {
              return pluginState;
            }

            // Process local changes
            if (tr.docChanged) {
              processLocalChanges(tr, pluginState);
            }

            return pluginState;
          }
        },

        view: () => ({
          destroy: () => {
            const state = CRDTPluginKey.getState(this.editor.state);
            if (state) {
              state.wsClient.disconnect();
            }
          }
        })
      })
    ];
  }
});

/**
 * Processes local ProseMirror changes and converts them to CRDT operations
 */
function processLocalChanges(tr: any, state: CRDTPluginState): void {
  const { crdt, positionMap, wsClient } = state;

  // Iterate through transaction steps
  tr.steps.forEach((step: any, index: number) => {
    const stepMap = tr.mapping.maps[index];

    if (step.jsonID === 'replace' || step.jsonID === 'replaceAround') {
      const from = step.from;
      const to = step.to;
      const slice = step.slice;

      // Handle deletions
      if (from < to) {
        for (let pos = from; pos < to; pos++) {
          const charId = positionMap.getIdAtIndex(pos);
          if (charId) {
            const operation = crdt.localDelete(charId);
            if (operation) {
              wsClient.sendOperation(operation);
            }
          }
        }
      }

      // Handle insertions with rich text attributes
      if (slice && slice.content && slice.content.size > 0) {
        let charIndex = 0;

        // Iterate through content nodes to extract text and marks
        slice.content.forEach((node: any) => {
          if (node.isText) {
            const text = node.text || '';
            const attributes = extractAttributes(node);

            // Insert each character with its attributes
            for (let i = 0; i < text.length; i++) {
              const char = text[i];
              const insertPos = from + charIndex;
              const afterId = positionMap.getIdBeforeIndex(insertPos);

              const operation = crdt.localInsert(char, afterId, attributes);
              wsClient.sendOperation(operation);
              charIndex++;
            }
          } else {
            // Handle block nodes (paragraphs, headings, etc.)
            const text = node.textContent || '';
            const attributes = extractNodeAttributes(node);

            for (let i = 0; i < text.length; i++) {
              const char = text[i];
              const insertPos = from + charIndex;
              const afterId = positionMap.getIdBeforeIndex(insertPos);

              const operation = crdt.localInsert(char, afterId, attributes);
              wsClient.sendOperation(operation);
              charIndex++;
            }
          }
        });
      }

      // Rebuild position map after changes
      const orderedNodes = getOrderedNodes(crdt);
      positionMap.rebuild(orderedNodes);
    }
  });
}

/**
 * Extracts rich text attributes from ProseMirror marks
 */
function extractAttributes(node: any): Record<string, any> | undefined {
  if (!node.marks || node.marks.length === 0) {
    return undefined;
  }

  const attributes: Record<string, any> = {};

  node.marks.forEach((mark: any) => {
    if (mark.type.name === 'bold') {
      attributes.bold = true;
    } else if (mark.type.name === 'italic') {
      attributes.italic = true;
    } else if (mark.type.name === 'code') {
      attributes.code = true;
    } else if (mark.type.name === 'link') {
      attributes.link = mark.attrs.href;
    }
    // Add more mark types as needed
  });

  return Object.keys(attributes).length > 0 ? attributes : undefined;
}

/**
 * Extracts attributes from block-level nodes (headings, etc.)
 */
function extractNodeAttributes(node: any): Record<string, any> | undefined {
  const attributes: Record<string, any> = {};

  if (node.type.name === 'heading') {
    attributes.heading = { level: node.attrs.level };
  } else if (node.type.name === 'codeBlock') {
    attributes.codeBlock = true;
  }
  // Add inline marks as well
  const markAttrs = extractAttributes(node);
  if (markAttrs) {
    Object.assign(attributes, markAttrs);
  }

  return Object.keys(attributes).length > 0 ? attributes : undefined;
}

/**
 * Applies a remote CRDT operation to the ProseMirror editor
 */
function applyRemoteOperation(editor: any, operation: CRDTOperation, state: CRDTPluginState): void {
  const { positionMap } = state;

  if (operation.type === 'insert') {
    // Find position to insert
    let position: number;

    if (operation.afterId === null) {
      position = 0; // Insert at beginning
    } else {
      const afterIndex = positionMap.getIndexOfId(operation.afterId);
      position = afterIndex !== undefined ? afterIndex + 1 : 0;
    }

    // Convert CRDT attributes to ProseMirror marks
    const marks = attributesToMarks(operation.attributes);

    // Insert into ProseMirror with marks
    if (marks.length > 0) {
      editor.commands.insertContentAt(position, {
        type: 'text',
        text: operation.char,
        marks
      });
    } else {
      editor.commands.insertContentAt(position, operation.char);
    }
  } else if (operation.type === 'delete') {
    // Find position to delete
    const position = positionMap.getIndexOfId(operation.id);

    if (position !== undefined) {
      // Delete from ProseMirror
      editor.commands.deleteRange({ from: position, to: position + 1 });
    }
  }
}

/**
 * Converts CRDT attributes to ProseMirror marks
 */
function attributesToMarks(attributes?: Record<string, any>): any[] {
  if (!attributes) {
    return [];
  }

  const marks: any[] = [];

  if (attributes.bold) {
    marks.push({ type: 'bold' });
  }
  if (attributes.italic) {
    marks.push({ type: 'italic' });
  }
  if (attributes.code) {
    marks.push({ type: 'code' });
  }
  if (attributes.link) {
    marks.push({ type: 'link', attrs: { href: attributes.link } });
  }
  // Add more mark types as needed

  return marks;
}

/**
 * Gets ordered nodes from CRDT document for position map
 */
function getOrderedNodes(crdt: CRDTDocument): Array<{ id: string; value: string; deleted: boolean }> {
  const nodes: Array<{ id: string; value: string; deleted: boolean }> = [];
  const state = crdt.toState();

  // Build ordered list by following linked list
  let currentId = state.head;
  const charsMap = new Map(state.chars.map(c => [c.id, c]));

  while (currentId !== null) {
    const char = charsMap.get(currentId);
    if (!char) break;

    nodes.push({
      id: char.id,
      value: char.char,
      deleted: char.deleted
    });

    currentId = char.nextId;
  }

  return nodes;
}
