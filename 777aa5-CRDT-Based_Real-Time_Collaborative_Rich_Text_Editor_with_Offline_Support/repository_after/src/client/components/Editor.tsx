/**
 * Editor Component - Minimal Tiptap Integration
 * 
 * Demonstrates the CRDT bridge working with a real rich text editor.
 */

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { CRDTExtension } from '../extensions/CRDTExtension';

interface EditorProps {
  documentId: string;
  websocketUrl?: string;
  siteId?: string;
}

export const Editor: React.FC<EditorProps> = ({ 
  documentId, 
  websocketUrl = 'ws://localhost:3000',
  siteId 
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      CRDTExtension.configure({
        documentId,
        websocketUrl,
        siteId
      })
    ],
    content: '<p>Start typing...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
  });

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="editor-container">
      <div className="editor-toolbar">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'is-active' : ''}
        >
          Bold
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'is-active' : ''}
        >
          Italic
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
        >
          H2
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};
