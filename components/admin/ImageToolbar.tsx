'use client';

import React, { useState, useEffect } from 'react';
import { AlignLeft, AlignCenter, AlignRight, Maximize2, Link as LinkIcon, Trash2, MoreVertical, Type, FileImage } from 'lucide-react';
import type { Editor } from '@tiptap/core';
import { NodeSelection } from 'prosemirror-state';

interface ImageToolbarProps {
  editor: Editor;
  imagePos: number;
  imageNode: { attrs: { align?: string | null; href?: string | null; [key: string]: unknown } };
  position: { top: number; left: number };
  onClose: () => void;
  onEditAltText?: () => void;
  onEditCaption?: () => void;
  onEditLink?: () => void;
}

export function ImageToolbar({
  editor,
  imagePos,
  imageNode,
  position,
  onClose,
  onEditAltText,
  onEditCaption,
  onEditLink,
}: ImageToolbarProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [, forceUpdate] = useState(0);
  
  const getCurrentNode = () => {
    const { doc } = editor.state;
    const node = doc.nodeAt(imagePos);
    return node || imageNode;
  };
  
  const currentNode = getCurrentNode();
  const currentAlign = currentNode?.attrs?.align || null;
  const hasLink = !!currentNode?.attrs?.href;
  
  useEffect(() => {
    const updateToolbar = () => {
      forceUpdate(prev => prev + 1);
    };
    
    editor.on('update', updateToolbar);
    editor.on('transaction', updateToolbar);
    
    return () => {
      editor.off('update', updateToolbar);
      editor.off('transaction', updateToolbar);
    };
  }, [editor]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.image-toolbar-more-menu') && !target.closest('.image-toolbar-more-button')) {
        setShowMoreMenu(false);
      }
    };

    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMoreMenu]);

  const handleAlign = (align: string | null) => {
    const alignValue: 'left' | 'center' | 'right' | 'full' | null = 
      (align === 'left' || align === 'center' || align === 'right' || align === 'full') 
        ? align as 'left' | 'center' | 'right' | 'full'
        : null;
    
    
    const { state } = editor;
    const { selection } = state;
    let node = null;
    let pos = imagePos;
    
    if (selection instanceof NodeSelection && selection.node) {
      node = selection.node;
      pos = selection.from;
    } else {
      const { doc } = state;
      node = doc.nodeAt(imagePos);
      pos = imagePos;
    }
    
    if (!node || node.type.name !== 'image') {
      const { doc } = state;
      node = doc.nodeAt(imagePos);
      if (!node || node.type.name !== 'image') {
        return;
      }
      pos = imagePos;
    }
    
    const currentAlign = node.attrs.align || null;
    
    if (currentAlign === alignValue) {
      return;
    }
    
    const { doc, tr } = state;
    const actualPos = pos;
    const actualNode = doc.nodeAt(actualPos);
    
    if (!actualNode || actualNode.type.name !== 'image') {
      return;
    }
    
    tr.setSelection(NodeSelection.create(doc, actualPos));
    
    if (actualNode) {
      tr.setNodeMarkup(actualPos, undefined, {
        ...actualNode.attrs,
        align: alignValue,
      });
    }
    
    editor.view.dispatch(tr);
    
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this image?')) {
      const { doc, tr } = editor.state;
      const node = doc.nodeAt(imagePos);
      if (node) {
        tr.delete(imagePos, imagePos + node.nodeSize);
        editor.view.dispatch(tr);
        onClose();
      }
    }
  };

  return (
    <div
      className="image-toolbar absolute bg-white border border-gray-300 rounded-lg shadow-lg z-[100] flex items-center gap-1 p-1"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Alignment Buttons */}
      <div className="flex items-center gap-1 border-r border-gray-200 pr-1">
        <button
          type="button"
          onClick={(e) => {
            console.log('[ImageToolbar] Left align button clicked');
            e.stopPropagation();
            handleAlign('left');
          }}
          className={`p-2 rounded hover:bg-gray-100 transition-colors ${
            currentAlign === 'left' ? 'bg-blue-100 text-blue-600' : ''
          }`}
          title="Align Left"
        >
          <AlignLeft size={16} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleAlign('center');
          }}
          className={`p-2 rounded hover:bg-gray-100 transition-colors ${
            currentAlign === 'center' ? 'bg-blue-100 text-blue-600' : ''
          }`}
          title="Align Center"
        >
          <AlignCenter size={16} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleAlign('right');
          }}
          className={`p-2 rounded hover:bg-gray-100 transition-colors ${
            currentAlign === 'right' ? 'bg-blue-100 text-blue-600' : ''
          }`}
          title="Align Right"
        >
          <AlignRight size={16} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleAlign('full');
          }}
          className={`p-2 rounded hover:bg-gray-100 transition-colors ${
            currentAlign === 'full' ? 'bg-blue-100 text-blue-600' : ''
          }`}
          title="Full Width"
        >
          <Maximize2 size={16} />
        </button>
      </div>

      {/* Link Button */}
      <button
        type="button"
        onClick={onEditLink}
        className={`p-2 rounded hover:bg-gray-100 transition-colors ${
          hasLink ? 'bg-blue-100 text-blue-600' : ''
        }`}
        title={hasLink ? 'Edit Link' : 'Add Link'}
      >
        <LinkIcon size={16} />
      </button>

      {/* More Options */}
      <div className="relative border-l border-gray-200 pl-1 image-toolbar-more-button">
        <button
          type="button"
          className="p-2 rounded hover:bg-gray-100 transition-colors"
          title="More Options"
          onClick={(e) => {
            e.stopPropagation();
            setShowMoreMenu(!showMoreMenu);
          }}
        >
          <MoreVertical size={16} />
        </button>
        
        {showMoreMenu && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-[200] min-w-[150px] image-toolbar-more-menu">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMoreMenu(false);
                onEditAltText?.();
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <Type size={16} />
              <span>Alt Text</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMoreMenu(false);
                onEditCaption?.();
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2 border-t border-gray-200"
            >
              <FileImage size={16} />
              <span>Caption</span>
            </button>
          </div>
        )}
      </div>

      {/* Delete Button */}
      <button
        type="button"
        onClick={handleDelete}
        className="p-2 rounded hover:bg-red-100 text-red-600 transition-colors border-l border-gray-200 ml-1 pl-1"
        title="Delete Image"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

