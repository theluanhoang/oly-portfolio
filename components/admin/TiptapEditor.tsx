'use client';

import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Highlight from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import { Extension, type CommandProps, type Editor } from '@tiptap/core';
import { Fragment, type Node as PMNode } from 'prosemirror-model';
import { TextSelection } from 'prosemirror-state';
import type { EditorView, NodeView } from 'prosemirror-view';
import { AlignLeft, AlignCenter, AlignRight, AlignJustify, Undo2, Redo2, List, ListOrdered, Highlighter, X, Type, ChevronDown, Link as LinkIcon, Menu, Search, Copy, Pencil, Unlink, Image as ImageIcon, Upload, Globe, Grid3x3, LayoutGrid, Columns } from 'lucide-react';
import { Iframe, type IframeAttributes } from './Iframe';
import { ImageGallery } from './ImageGallery';
import { ImageToolbar } from './ImageToolbar';

const COLOR_PALETTE = [
  '#000000', '#404040', '#808080', '#C0C0C0', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF',
  '#800000', '#FF0000', '#FF8000', '#FFFF00', '#80FF00', '#00FFFF', '#0080FF', '#0000FF', '#8000FF', '#FF00FF',
  '#FFE4E1', '#FFB6C1', '#FFA07A', '#FFE4B5', '#F0E68C', '#E0FFE0', '#E0FFFF', '#E0E0FF', '#E6E6FA', '#FFE4E6',
  '#D2B48C', '#DEB887', '#F4A460', '#F5DEB3', '#D3D3D3', '#D8BFD8', '#DDA0DD', '#EE82EE', '#DA70D6', '#C0C0C0',
  '#CD5C5C', '#A0522D', '#D2691E', '#B8860B', '#9ACD32', '#2E8B57', '#4682B4', '#6A5ACD', '#9370DB', '#C71585',
  '#8B4513', '#A0522D', '#8B7355', '#8B6914', '#6B8E23', '#2F4F4F', '#191970', '#4B0082', '#8B008B', '#8B0000',
  '#654321', '#5C4033', '#8B4513', '#556B2F', '#2F4F2F', '#1C1C1C', '#000080', '#4B0082', '#6A0DAD', '#800020',
  '#3D2817', '#2F1B14', '#3D2817', '#2F4F2F', '#1C3A1C', '#0F1F1F', '#000050', '#2D1B4E', '#4B0D4B', '#4B0000',
];

const generateImageId = (): string => {
  return `img-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

interface ColorPickerProps {
  icon: React.ReactNode;
  currentColor: string;
  onColorChange: (color: string) => void;
  onRemove?: () => void;
  isActive: boolean;
  title: string;
  defaultColor?: string;
  showColorIndicator?: boolean;
}

function ColorPicker({ 
  icon, 
  currentColor, 
  onColorChange, 
  onRemove, 
  isActive, 
  title,
  defaultColor = '#ffffff',
  showColorIndicator = false
}: ColorPickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showPicker && !target.closest('.color-picker-container')) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showPicker]);

  const getButtonStyle = () => {
    if (showColorIndicator) {
      return {
        backgroundColor: 'white',
        borderColor: isActive ? currentColor : '#e0e0e0',
      };
    }
    return {
      backgroundColor: currentColor,
      borderColor: isActive ? currentColor : '#e0e0e0',
    };
  };

  const getIconStyle = () => {
    if (showColorIndicator) {
      return {};
    }
    return {
      filter: currentColor === defaultColor ? 'none' : 'brightness(0) invert(1)',
    };
  };

  const getIconClassName = () => {
    if (showColorIndicator) {
      return 'text-[#333]';
    }
    return currentColor === defaultColor ? 'text-[#333]' : 'text-white';
  };

  return (
    <div className="relative color-picker-container">
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="px-3 py-2 h-10 border text-xs tracking-[1px] uppercase transition-colors flex items-center justify-center relative"
        title={title}
        style={getButtonStyle()}
      >
        <span className={getIconClassName()} style={getIconStyle()}>
          {icon}
        </span>
        {showColorIndicator && (
          <div 
            className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-4 h-1.5 rounded border border-gray-300"
            style={{ backgroundColor: currentColor }}
          />
        )}
      </button>
      
      {showPicker && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-[#e0e0e0] shadow-lg z-50 p-3" style={{ width: '320px' }}>
          {onRemove && (
            <button
              type="button"
              onClick={() => {
                onRemove();
                setShowPicker(false);
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded mb-2"
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                !isActive ? 'border-black' : 'border-gray-300'
              }`}>
                {!isActive && <X size={12} className="text-black" />}
              </div>
              <span className="text-sm">None</span>
            </button>
          )}
          
          <div className="grid grid-cols-10 gap-1 mb-3">
            {COLOR_PALETTE.map((color, index) => (
              <button
                type="button"
                key={index}
                onClick={() => {
                  onColorChange(color);
                  setShowPicker(false);
                }}
                className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${
                  currentColor === color ? 'border-black scale-110' : 'border-gray-200'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Font Size Extension
const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element: HTMLElement) => {
              const fontSize = element.style.fontSize;
              if (!fontSize) return null;
              return fontSize.replace('px', '').trim();
            },
            renderHTML: (attributes: { fontSize?: string }) => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}px`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }: CommandProps) => {
          return chain().setMark('textStyle', { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }: CommandProps) => {
          return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
        },
    };
  },
});

const Indent = Extension.create({
  name: 'indent',

  addOptions() {
    return {
      types: ['paragraph', 'heading'],
      minLevel: 0,
      maxLevel: 8,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element: HTMLElement) => {
              const indent = parseInt(element.style.paddingLeft || '0', 10);
              return indent / 30;
            },
            renderHTML: (attributes: { indent?: number }) => {
              if (!attributes.indent || attributes.indent === 0) {
                return {};
              }
              return {
                style: `padding-left: ${attributes.indent * 30}px`,
              };
            },
          },
        },
      },
    ];
  },

  // @ts-expect-error - Custom commands not in type definitions
  addCommands() {
    return {
      indent:
        () =>
        ({ tr, state, dispatch }: CommandProps) => {
          const { selection } = state;
          const { from, to } = selection;

          let updated = false;
          const newTr = tr;

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || 0;
              const newIndent = Math.min(currentIndent + 1, this.options.maxLevel);
              if (newIndent !== currentIndent) {
                newTr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: newIndent,
                });
                updated = true;
              }
            }
          });

          if (updated && dispatch) {
            dispatch(newTr);
            return true;
          }
          return false;
        },
      outdent:
        () =>
        ({ tr, state, dispatch }: CommandProps) => {
          const { selection } = state;
          const { from, to } = selection;

          let updated = false;
          const newTr = tr;

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || 0;
              const newIndent = Math.max(currentIndent - 1, this.options.minLevel);
              if (newIndent !== currentIndent) {
                newTr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: newIndent,
                });
                updated = true;
              }
            }
          });

          if (updated && dispatch) {
            dispatch(newTr);
            return true;
          }
          return false;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        // @ts-expect-error - Custom command not in type definitions
        return this.editor.commands.indent();
      },
      'Shift-Tab': () => {
        // @ts-expect-error - Custom command not in type definitions
        return this.editor.commands.outdent();
      },
    };
  },
});

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => element.getAttribute('width'),
        renderHTML: (attributes) => {
          if (!attributes.width) {
            return {};
          }
          return {
            width: attributes.width,
          };
        },
      },
      height: {
        default: null,
        parseHTML: (element) => element.getAttribute('height'),
        renderHTML: (attributes) => {
          if (!attributes.height) {
            return {};
          }
          return {
            height: attributes.height,
          };
        },
      },
      align: {
        default: null,
        parseHTML: (element) => {
          const parent = element.parentElement;
          if (!parent) return null;
          const textAlign = parent.style.textAlign || parent.getAttribute('data-align');
          if (textAlign) return textAlign;
          // Check for float
          const float = parent.style.float || window.getComputedStyle(parent).float;
          if (float === 'left') return 'float-left';
          if (float === 'right') return 'float-right';
          return null;
        },
        renderHTML: (attributes) => {
          if (!attributes.align) {
            return {};
          }
          return {};
        },
      },
      alt: {
        default: null,
        parseHTML: (element) => element.getAttribute('alt'),
        renderHTML: (attributes) => {
          if (!attributes.alt) {
            return {};
          }
          return {
            alt: attributes.alt,
          };
        },
      },
      caption: {
        default: null,
        parseHTML: (element) => {
          const parent = element.parentElement;
          if (parent) {
            if (parent.classList.contains('resizable-image-wrapper')) {
              const captionEl = parent.querySelector('.image-caption');
              if (captionEl) return captionEl.textContent;
            }
            const nextSibling = parent.nextElementSibling;
            if (nextSibling && nextSibling.classList.contains('image-caption')) {
              return nextSibling.textContent;
            }
          }
          return null;
        },
        renderHTML: () => {
          return {};
        },
      },
      href: {
        default: null,
        parseHTML: (element) => {
          const parent = element.parentElement;
          if (parent && parent.tagName === 'A') {
            return parent.getAttribute('href');
          }
          if (parent && parent.classList.contains('resizable-image-wrapper')) {
            const linkEl = parent.querySelector('a');
            if (linkEl) return linkEl.getAttribute('href');
          }
          return null;
        },
        renderHTML: () => {
          return {};
        },
      },
      id: {
        default: null,
        parseHTML: (element) => {
          const existingId = element.getAttribute('data-image-id') || element.getAttribute('id');
          if (existingId) {
            return existingId;
          }
          return generateImageId();
        },
        renderHTML: (attributes) => {
          if (!attributes.id) {
            return {};
          }
          return {
            'data-image-id': attributes.id,
          };
        },
      },
    };
  },

  renderHTML({ HTMLAttributes, node }) {
    const align = node.attrs.align;
    const caption = node.attrs.caption;
    const href = node.attrs.href;
    const imageId = node.attrs.id;
    
    let wrapperStyle = 'position: relative; display: inline-block; max-width: 100%;';
    let wrapperClass = 'resizable-image-wrapper';
    
    // Handle alignment
    if (align === 'full') {
      wrapperStyle += ' width: 100%; display: block;';
      wrapperClass += ' image-align-full';
    } else if (align === 'center') {
      wrapperStyle += ' display: block; margin: 0 auto;';
      wrapperClass += ' image-align-center';
    } else if (align === 'left') {
      wrapperStyle += ' display: block;';
      wrapperClass += ' image-align-left';
    } else if (align === 'right') {
      wrapperStyle += ' display: block; margin-left: auto;';
      wrapperClass += ' image-align-right';
    } else if (align === 'float-left') {
      wrapperStyle += ' float: left; margin-right: 1em;';
      wrapperClass += ' image-align-float-left';
    } else if (align === 'float-right') {
      wrapperStyle += ' float: right; margin-left: 1em;';
      wrapperClass += ' image-align-float-right';
    }
    
    // Build img attributes, ensuring id is included
    const imgAttrs: Record<string, unknown> = {
      ...HTMLAttributes,
      style: `display: block; max-width: 100%; height: auto; ${HTMLAttributes.width ? `width: ${HTMLAttributes.width}px;` : ''} ${HTMLAttributes.height ? `height: ${HTMLAttributes.height}px;` : ''}`,
    };
    
    if (imageId) {
      imgAttrs['data-image-id'] = imageId;
    }
    
    const imgElement: [string, Record<string, unknown>] = [
      'img',
      imgAttrs,
    ];
    
    // Build content array properly
    const content: unknown[] = [];
    
    // Wrap in link if href exists
    if (href) {
      content.push([
        'a',
        {
          href: href,
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        imgElement,
      ]);
    } else {
      content.push(imgElement);
    }
    
    // Add caption if exists
    if (caption) {
      content.push([
        'div',
        {
          class: 'image-caption',
          style: 'text-align: center; font-style: italic; color: #666; margin-top: 0.5em; font-size: 0.9em;',
        },
        caption,
      ]);
    }
    
    return [
      'span',
      {
        class: wrapperClass,
        style: wrapperStyle,
        'data-align': align || null,
      },
      ...content,
    ];
  },

  addNodeView() {
    return ({ node, view, getPos }: { node: PMNode; view: EditorView; getPos: () => number | undefined }): NodeView => {
      const dom = document.createElement('div');
      dom.className = 'resizable-image-wrapper';
      dom.style.position = 'relative';
      dom.style.display = 'inline-block';
      dom.style.maxWidth = '100%';
      dom.style.height = 'fit-content';
      dom.style.alignSelf = 'start';

      let imageId = node.attrs.id;
      
      if (!imageId) {
        const newId = generateImageId();
        imageId = newId;
        setTimeout(() => {
          const pos = getPos();
          if (typeof pos === 'number') {
            const { tr, doc } = view.state;
            const nodeAtPos = doc.nodeAt(pos);
            if (nodeAtPos && nodeAtPos.type.name === 'image' && !nodeAtPos.attrs.id) {
              tr.setNodeMarkup(pos, undefined, {
                ...nodeAtPos.attrs,
                id: newId,
              });
              view.dispatch(tr);
            }
          }
        }, 0);
      }
      
      const img = document.createElement('img');
      img.src = node.attrs.src;
      img.alt = node.attrs.alt || '';
      if (imageId) {
        img.setAttribute('data-image-id', imageId);
      }
      img.style.display = 'block';
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.draggable = true;
      
      const imgWrapper = document.createElement('div');
      imgWrapper.style.position = 'relative';
      imgWrapper.style.display = 'inline-block';
      imgWrapper.appendChild(img);
      
      let originalWidth = 0;
      let originalHeight = 0;
      let aspectRatio = 1;
      
      const updateImageSize = () => {
        const currentAlign = node.attrs.align;
        const shouldPreserveAlignmentWidth = currentAlign === 'left' || currentAlign === 'center' || currentAlign === 'right' || currentAlign === 'full';
        
        if (node.attrs.width) {
          const width = typeof node.attrs.width === 'number' ? node.attrs.width : parseInt(node.attrs.width);
          img.style.width = `${width}px`;
          imgWrapper.style.width = `${width}px`;
          // Only set dom width if alignment doesn't require 100% width
          if (!shouldPreserveAlignmentWidth) {
            dom.style.width = `${width}px`;
          }
          originalWidth = width;
        }
        if (node.attrs.height) {
          const height = typeof node.attrs.height === 'number' ? node.attrs.height : parseInt(node.attrs.height);
          img.style.height = `${height}px`;
          dom.style.height = 'fit-content';
          originalHeight = height;
        }
        if (originalWidth > 0 && originalHeight > 0) {
          aspectRatio = originalWidth / originalHeight;
          setTimeout(() => {
            updateHandlesPosition();
          }, 0);
        } else {
          img.onload = () => {
            originalWidth = img.naturalWidth;
            originalHeight = img.naturalHeight;
            aspectRatio = originalWidth / originalHeight;
            if (img.style.width) {
              imgWrapper.style.width = img.style.width;
              // Only set dom width if alignment doesn't require 100% width
              if (!shouldPreserveAlignmentWidth) {
                dom.style.width = img.style.width;
              }
            }
            dom.style.height = 'fit-content';
            setTimeout(() => {
              updateHandlesPosition();
            }, 0);
          };
        }
      };
      
      updateImageSize();

      // Handle alignment - initial setup will be updated by updateCaptionAndAlignment
      // But we set basic styles here for immediate display
      const align = node.attrs.align;
      if (align === 'full') {
        dom.style.width = '100%';
        dom.style.display = 'block';
      } else if (align === 'center' || align === 'left' || align === 'right') {
        dom.style.width = '100%';
        dom.style.display = 'block';
        dom.style.textAlign = align;
      } else if (align === 'float-left') {
        dom.style.float = 'left';
        dom.style.marginRight = '1em';
        dom.style.display = 'inline-block';
      } else if (align === 'float-right') {
        dom.style.float = 'right';
        dom.style.marginLeft = '1em';
        dom.style.display = 'inline-block';
      }

      // Handle link wrapper
      let imageContainer: HTMLElement = imgWrapper;
      const href = node.attrs.href;
      if (href) {
        const link = document.createElement('a');
        link.href = href as string;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.display = 'inline-block';
        link.appendChild(imgWrapper);
        imageContainer = link;
      } else {
        imageContainer = imgWrapper;
      }

      dom.appendChild(imageContainer);

      // Handle caption
      const caption = node.attrs.caption;
      if (caption) {
        const captionEl = document.createElement('div');
        captionEl.className = 'image-caption';
        captionEl.style.textAlign = 'center';
        captionEl.style.fontStyle = 'italic';
        captionEl.style.color = '#666';
        captionEl.style.marginTop = '0.5em';
        captionEl.style.fontSize = '0.9em';
        captionEl.textContent = caption as string;
        dom.appendChild(captionEl);
      }

      let isResizing = false;
      let isDragging = false;
      let resizeHandle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null = null;
      let startX = 0;
      let startY = 0;
      let startWidth = 0;
      let startHeight = 0;
      let dragStartPos: number | undefined = undefined;
      let lastMovedToPos: number | null = null; 
      let mouseDownPos: { x: number; y: number } | null = null;
      let pendingInsertPos: number | null = null;
      let dragPreviewNode: PMNode | null = null;
      let dragPreviewElement: HTMLElement | null = null;
      let lastMouseEvent: MouseEvent | null = null;
      let wasCtrlClick: boolean = false; // Track if the last click was with Ctrl/Cmd
      const DRAG_THRESHOLD = 5;

      const getCursorForPosition = (position: string): string => {
        const cursors: Record<string, string> = {
          nw: 'nw-resize',
          ne: 'ne-resize',
          sw: 'sw-resize',
          se: 'se-resize',
          n: 'n-resize',
          s: 's-resize',
          e: 'e-resize',
          w: 'w-resize',
        };
        return cursors[position] || 'default';
      };

      const createResizeHandle = (position: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w') => {
        const handle = document.createElement('div');
        handle.className = `resize-handle resize-handle-${position}`;
        handle.style.position = 'absolute';
        handle.style.backgroundColor = '#3b82f6';
        handle.style.border = '2px solid white';
        handle.style.borderRadius = '50%';
        handle.style.width = '12px';
        handle.style.height = '12px';
        handle.style.cursor = getCursorForPosition(position);
        handle.style.zIndex = '10';
        handle.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';

        const positions: Record<string, Partial<CSSStyleDeclaration>> = {
          nw: { top: '-6px', left: '-6px' },
          ne: { top: '-6px', right: '-6px' },
          sw: { bottom: '-6px', left: '-6px' },
          se: { bottom: '-6px', right: '-6px' },
          n: { top: '-6px', left: '50%', transform: 'translateX(-50%)' },
          s: { bottom: '-6px', left: '50%', transform: 'translateX(-50%)' },
          e: { top: '50%', right: '-6px', transform: 'translateY(-50%)' },
          w: { top: '50%', left: '-6px', transform: 'translateY(-50%)' },
        };

        Object.assign(handle.style, positions[position]);

        handle.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          isResizing = true;
          resizeHandle = position;
          startX = e.clientX;
          startY = e.clientY;
          const rect = img.getBoundingClientRect();
          startWidth = rect.width;
          startHeight = rect.height;
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        });

        return handle;
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing || !resizeHandle) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        let newWidth = startWidth;
        let newHeight = startHeight;

        const isCornerHandle = ['nw', 'ne', 'sw', 'se'].includes(resizeHandle);

        if (isCornerHandle) {
          if (resizeHandle.includes('e')) {
            newWidth = startWidth + deltaX;
          }
          if (resizeHandle.includes('w')) {
            newWidth = startWidth - deltaX;
          }
          if (resizeHandle.includes('s')) {
            newHeight = startHeight + deltaY;
          }
          if (resizeHandle.includes('n')) {
            newHeight = startHeight - deltaY;
          }

          const newAspectRatio = newWidth / newHeight;
          if (Math.abs(newAspectRatio - aspectRatio) > 0.01) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
              newHeight = newWidth / aspectRatio;
            } else {
              newWidth = newHeight * aspectRatio;
            }
          }
        } else {
          if (resizeHandle === 'e' || resizeHandle === 'w') {
            newWidth = resizeHandle === 'e' ? startWidth + deltaX : startWidth - deltaX;
          }
          if (resizeHandle === 's' || resizeHandle === 'n') {
            newHeight = resizeHandle === 's' ? startHeight + deltaY : startHeight - deltaY;
          }
        }

        newWidth = Math.max(50, newWidth);
        newHeight = Math.max(50, newHeight);

        img.style.width = `${newWidth}px`;
        img.style.height = `${newHeight}px`;
        imgWrapper.style.width = `${newWidth}px`;
        
        // Preserve alignment during resize - only set dom width if alignment is not left/center/right/full
        // For left/center/right/full alignment, we need dom to keep width: 100% for alignment to work
        const currentAlign = node.attrs.align;
        if (currentAlign !== 'left' && currentAlign !== 'center' && currentAlign !== 'right' && currentAlign !== 'full') {
          dom.style.width = `${newWidth}px`;
        }
        // Don't set dom.style.width for left/center/right/full to preserve alignment
        dom.style.height = 'fit-content';
        
        if (img.style.outline) {
          updateSelectionStyle();
        }
        
        updateHandlesPosition();
      };

      const handleMouseUp = () => {
        if (!isResizing || !resizeHandle) return;

        const pos = getPos();
        if (typeof pos === 'number') {
          const width = parseInt(img.style.width);
          const height = parseInt(img.style.height);

          imgWrapper.style.width = `${width}px`;
          
          // Preserve alignment - only set dom width if alignment doesn't require 100% width
          const currentAlign = node.attrs.align;
          const shouldPreserveAlignmentWidth = currentAlign === 'left' || currentAlign === 'center' || currentAlign === 'right' || currentAlign === 'full';
          if (!shouldPreserveAlignmentWidth) {
            dom.style.width = `${width}px`;
          }
          // For left/center/right/full alignment, dom width should remain 100% (set by updateCaptionAndAlignment)
          dom.style.height = 'fit-content';

          const { tr } = view.state;
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            width: width,
            height: height,
          });
          view.dispatch(tr);
          
          // After dispatch, updateCaptionAndAlignment will be called automatically via node view update()
          // But we also call it here to ensure alignment is preserved immediately
          setTimeout(() => {
            updateSelectionStyle();
            updateHandlesPosition();
            updateCaptionAndAlignment(); // Restore alignment styles after resize
          }, 10);
        }

        isResizing = false;
        resizeHandle = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      const positions: Array<'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w'> = ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'];
      const handles: HTMLElement[] = [];
      
      positions.forEach((pos) => {
        const handle = createResizeHandle(pos);
        handle.style.display = 'none';
        handles.push(handle);
        imgWrapper.appendChild(handle);
      });

      const updateHandlesPosition = () => {
        handles.forEach((handle) => {
          const position = handle.className.split('resize-handle-')[1]?.split(' ')[0];
          if (!position) return;
          
          const positions: Record<string, Partial<CSSStyleDeclaration>> = {
            nw: { top: '-6px', left: '-6px' },
            ne: { top: '-6px', right: '-6px' },
            sw: { bottom: '-6px', left: '-6px' },
            se: { bottom: '-6px', right: '-6px' },
            n: { top: '-6px', left: '50%', transform: 'translateX(-50%)' },
            s: { bottom: '-6px', left: '50%', transform: 'translateX(-50%)' },
            e: { top: '50%', right: '-6px', transform: 'translateY(-50%)' },
            w: { top: '50%', left: '-6px', transform: 'translateY(-50%)' },
          };
          
          Object.assign(handle.style, positions[position]);
        });
      };

      const showHandles = () => {
        handles.forEach((handle) => {
          handle.style.display = 'block';
        });
        updateHandlesPosition();
      };

      const hideHandles = () => {
        if (!isResizing) {
          handles.forEach((handle) => {
            handle.style.display = 'none';
          });
        }
      };

      const handleImageMouseDown = (e: MouseEvent) => {
        if (e.target === img && !isResizing) {
          const pos = getPos();
          if (typeof pos === 'number') {
            e.preventDefault();
            e.stopPropagation();
            
            const clearClickOutsideEvent = new CustomEvent('clearClickOutsideTimeout');
            document.dispatchEvent(clearClickOutsideEvent);
            
            const { tr, doc } = view.state;
            const nodeAtPos = doc.nodeAt(pos);
            
            if (nodeAtPos && nodeAtPos.type.name === 'image') {
              tr.setSelection(TextSelection.create(doc, pos, pos + nodeAtPos.nodeSize));
            } else {
              tr.setSelection(TextSelection.create(doc, pos));
            }
            view.dispatch(tr);
            showHandles();
            
            wasCtrlClick = e.ctrlKey || e.metaKey;
            
            if (wasCtrlClick) {
              // Multi-select: toggle this image in/out of selection
              const event = new CustomEvent('toggleImageSelection', { detail: { pos, mouseX: e.clientX, mouseY: e.clientY } });
              document.dispatchEvent(event);
            } else {
              // Single select: replace current selection with this image only
              const event = new CustomEvent('selectImage', { detail: { pos, mouseX: e.clientX, mouseY: e.clientY, isMultiSelect: false } });
              document.dispatchEvent(event);
            }
            
            dragStartPos = pos;
            lastMovedToPos = null;
            pendingInsertPos = null;
            mouseDownPos = { x: e.clientX, y: e.clientY };
            isDragging = false;
            // Capture the node with all its attributes at mousedown
            // This ensures we preserve alignment and other attributes during drag
            dragPreviewNode = nodeAtPos;
            
            console.log('[DragReorder] MouseDown:', {
              pos,
              imageId: nodeAtPos?.attrs?.id,
              imageSrc: nodeAtPos?.attrs?.src?.substring(0, 50),
              mousePos: { x: e.clientX, y: e.clientY },
              wasCtrlClick,
            });
          }
        }
      };

      img.addEventListener('mousedown', handleImageMouseDown);

      const handleImageDragStart = (e: DragEvent) => {
        if (!isResizing) {
          const pos = getPos();
          if (typeof pos === 'number') {
            dragStartPos = pos;
            lastMovedToPos = null; // Reset when starting new drag
            isDragging = true;
            if (e.dataTransfer) {
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/html', '');
            }
          }
        }
      };

      img.addEventListener('dragstart', handleImageDragStart);

      dom.addEventListener('click', (e) => {
        if (e.target !== img && !handles.includes(e.target as HTMLElement)) {
          e.stopPropagation();
          const { tr, doc } = view.state;
          const pos = getPos();
          if (typeof pos === 'number') {
            const nodeAtPos = doc.nodeAt(pos);
            if (nodeAtPos && nodeAtPos.type.name === 'image') {
              tr.setSelection(TextSelection.create(doc, pos, pos + nodeAtPos.nodeSize));
            } else {
              tr.setSelection(TextSelection.create(doc, pos));
            }
            view.dispatch(tr);
          }
          showHandles();
        }
      });

      const handleDocumentClick = (e: MouseEvent) => {
        if (!dom.contains(e.target as Node)) {
          hideHandles();
        }
      };

      let lastMoveTime = 0;
      const MOVE_THROTTLE = 16;

      const createDragPreview = (): HTMLElement => {
        if (dragPreviewElement) {
          dragPreviewElement.remove();
        }

        const preview = img.cloneNode(true) as HTMLImageElement;
        
        const imgWidth = img.naturalWidth || img.offsetWidth || 200;
        const imgHeight = img.naturalHeight || img.offsetHeight || 200;
        
        const maxPreviewSize = 300;
        let previewWidth = imgWidth;
        let previewHeight = imgHeight;
        
        if (previewWidth > maxPreviewSize || previewHeight > maxPreviewSize) {
          const ratio = Math.min(maxPreviewSize / previewWidth, maxPreviewSize / previewHeight);
          previewWidth = previewWidth * ratio;
          previewHeight = previewHeight * ratio;
        }
        
        preview.style.position = 'fixed';
        preview.style.pointerEvents = 'none';
        preview.style.zIndex = '10000';
        preview.style.opacity = '0.8';
        preview.style.transform = 'rotate(5deg)';
        preview.style.boxShadow = '0 8px 16px rgba(0,0,0,0.3)';
        preview.style.border = '2px dashed #3b82f6';
        preview.style.borderRadius = '4px';
        preview.style.width = `${previewWidth}px`;
        preview.style.height = `${previewHeight}px`;
        preview.style.objectFit = 'contain';
        preview.style.backgroundColor = 'white';
        preview.style.padding = '4px';
        
        document.body.appendChild(preview);
        dragPreviewElement = preview;
        return preview;
      };

      const updateDragPreviewPosition = (e: MouseEvent) => {
        if (dragPreviewElement) {
          const offsetX = 10;
          const offsetY = 10;
          dragPreviewElement.style.left = `${e.clientX + offsetX}px`;
          dragPreviewElement.style.top = `${e.clientY + offsetY}px`;
        }
      };

      const removeDragPreview = () => {
        if (dragPreviewElement) {
          dragPreviewElement.remove();
          dragPreviewElement = null;
        }
      };

      const handleDocumentMouseMove = (e: MouseEvent) => {
        if (!isDragging && dragStartPos !== undefined && mouseDownPos !== null && !isResizing) {
          const deltaX = Math.abs(e.clientX - mouseDownPos.x);
          const deltaY = Math.abs(e.clientY - mouseDownPos.y);
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          
          if (distance >= DRAG_THRESHOLD) {
            isDragging = true;
            pendingInsertPos = null;
            if (img) {
              img.style.cursor = 'grabbing';
              img.style.opacity = '0.5';
            }
            createDragPreview();
            updateDragPreviewPosition(e);
            console.log('[DragReorder] Drag started:', {
              dragStartPos,
              distance,
              threshold: DRAG_THRESHOLD,
            });
          } else {
            return;
          }
        }
        
        if (isDragging && dragStartPos !== undefined && !isResizing) {
          lastMouseEvent = e;
          updateDragPreviewPosition(e);
          
          const now = Date.now();
          if (now - lastMoveTime < MOVE_THROTTLE) {
            return;
          }
          lastMoveTime = now;

          const coords = view.posAtCoords({ left: e.clientX, top: e.clientY });
          if (!coords) return;
          
          const { doc } = view.state;
          const node = doc.nodeAt(dragStartPos);
          if (!node || node.type.name !== 'image') {
            return;
          }

          const targetPos = coords.pos;
          const nodeSize = node.nodeSize;
          const nodeStart = dragStartPos;
          const nodeEnd = dragStartPos + nodeSize;
          
          // Skip if targetPos is strictly inside the node being dragged (not at boundaries)
          // Allow drag when targetPos is exactly at nodeStart or nodeEnd (boundaries)
          if (targetPos > nodeStart && targetPos < nodeEnd) {
            console.log('[DragReorder] TargetPos inside dragged node, skipping:', {
              targetPos,
              nodeStart,
              nodeEnd,
            });
            return;
          }
          
          // If targetPos is exactly at nodeStart or nodeEnd, we still allow drag
          // This handles edge cases where mouse is at the boundary
          
          console.log('[DragReorder] MouseMove:', {
            targetPos,
            nodeStart,
            nodeEnd,
            nodeSize,
            docSize: doc.content.size,
          });
          
          /**
           * Improved logic for finding valid insert position:
           * 1. First, try to find a valid position directly from targetPos
           * 2. If targetPos is at an image, insert before/after based on direction
           * 3. Otherwise, find the nearest valid position that can contain an image
           */
          const findValidInsertPosition = (pos: number): number | null => {
            try {
              // Clamp position to valid range
              const clampedPos = Math.max(0, Math.min(pos, doc.content.size));
              
              console.log('[DragReorder] findValidInsertPosition called:', {
                pos,
                clampedPos,
                nodeStart,
                nodeEnd,
                docSize: doc.content.size,
              });
              
              // Try to resolve the position
              const $pos = doc.resolve(clampedPos);
              const nodeAtPos = doc.nodeAt(clampedPos);
              
              // If we're directly at an image node
              if (nodeAtPos && nodeAtPos.type.name === 'image') {
                // Check if this is the node being dragged (by comparing position ranges)
                const isDraggedNode = clampedPos >= nodeStart && clampedPos < nodeEnd;
                
                if (isDraggedNode) {
                  // This is the node being dragged, find the nearest valid position
                  // We need to find a position outside the dragged node
                  
                  // Try to find position before the dragged node
                  if (clampedPos > 0) {
                    // Search backward to find a valid position before this node
                    for (let p = clampedPos - 1; p >= Math.max(0, clampedPos - 50); p--) {
                      try {
                        const $testPos = doc.resolve(p);
                        const testNode = doc.nodeAt(p);
                        // If we find another image or valid position, use it
                        if (testNode && testNode.type.name === 'image') {
                          const result = p;
                          console.log('[DragReorder] At dragged node, found image before:', result);
                          return result;
                        }
                        // Check if we can insert at this position
                        const testParent = $testPos.node($testPos.depth);
                        const testIndex = $testPos.index($testPos.depth);
                        if (testParent.canReplace(testIndex, testIndex, Fragment.from(node))) {
                          const result = p;
                          console.log('[DragReorder] At dragged node, found valid position before:', result);
                          return result;
                        }
                      } catch {
                        continue;
                      }
                    }
                    // Fallback: use position before dragged node
                    const beforePos = clampedPos;
                    console.log('[DragReorder] At dragged node, using position before:', beforePos);
                    return beforePos;
                  } else {
                    // At start of document, find position after
                    const afterPos = clampedPos + nodeAtPos.nodeSize;
                    console.log('[DragReorder] At dragged node (start of doc), trying to insert after:', afterPos);
                    return afterPos;
                  }
                }
                
                // This is a different image node
                // Determine direction: are we dragging forward or backward?
                // Logic: 
                // - When dragging backward (pos > nodeStart): user wants dragged image to appear AFTER target image
                //   So we insert AFTER target image (clampedPos + nodeSize)
                // - When dragging forward (pos < nodeStart): user wants dragged image to appear BEFORE target image
                //   So we insert BEFORE target image (clampedPos)
                const direction = pos < nodeStart ? 'forward' : 'backward';
                // CORRECTED: When dragging backward, insert AFTER target image
                // When dragging forward, insert BEFORE target image
                const result = pos < nodeStart ? clampedPos : clampedPos + nodeAtPos.nodeSize;
                
                console.log('[DragReorder] Found image node at position:', {
                  clampedPos,
                  nodeType: nodeAtPos.type.name,
                  isDraggedNode: false,
                  direction,
                  result,
                  explanation: pos < nodeStart 
                    ? 'dragging forward: insert BEFORE target image (so dragged appears before target)' 
                    : 'dragging backward: insert AFTER target image (so dragged appears after target)',
                });
                
                return result;
              }
              
              // If we're inside a text node or other content, find the best insertion point
              // Try to find a position where we can insert an image node
              
              // Special case: if targetPos is at or near the end of document, find the last image
              if (clampedPos >= doc.content.size - 1) {
                // Find the last image node in the document
                for (let p = doc.content.size - 1; p >= 0; p--) {
                  const testNode = doc.nodeAt(p);
                  if (testNode && testNode.type.name === 'image') {
                    // Insert after the last image
                    const result = p + testNode.nodeSize;
                    console.log('[DragReorder] At end of document, found last image, inserting after:', {
                      lastImagePos: p,
                      result,
                    });
                    return result;
                  }
                }
                // If no image found, use document end
                console.log('[DragReorder] At end of document, no images found, using doc end');
                return doc.content.size;
              }
              
              const depth = $pos.depth;
              
              console.log('[DragReorder] Not at image node, searching for valid position:', {
                nodeAtPosType: nodeAtPos?.type?.name,
                depth,
                clampedPos,
                docSize: doc.content.size,
              });
              
              // Walk up the tree to find a container that can hold an image
              try {
                for (let d = depth; d >= 0; d--) {
                  const parent = $pos.node(d);
                  const index = $pos.index(d);
                  
                  // Check if we can insert an image at this level
                  if (parent.canReplace(index, index, Fragment.from(node))) {
                    const result = $pos.start(d) + parent.child(index).nodeSize;
                    console.log('[DragReorder] Found valid position walking up tree:', {
                      depth: d,
                      parentType: parent.type.name,
                      index,
                      result,
                    });
                    return result;
                  }
                }
                
                // Fallback: try to find position at the start of current parent
                const parentStart = $pos.start($pos.depth);
                const parent = $pos.node($pos.depth);
                const index = $pos.index($pos.depth);
                
                // Try inserting at the start of current position's parent
                if (parent.canReplace(index, index, Fragment.from(node))) {
                  console.log('[DragReorder] Found valid position at parent start:', parentStart);
                  return parentStart;
                }
              } catch (error) {
                console.warn('[DragReorder] Error walking up tree, trying fallback search:', {
                  error: error instanceof Error ? error.message : String(error),
                });
              }
              
              console.log('[DragReorder] Searching nearby positions (fallback)');
              
              // Last resort: try to find any valid position near the target
              // Search backward first
              for (let p = Math.max(0, clampedPos - 100); p < clampedPos; p++) {
                try {
                  const $testPos = doc.resolve(p);
                  const testParent = $testPos.node($testPos.depth);
                  const testIndex = $testPos.index($testPos.depth);
                  if (testParent.canReplace(testIndex, testIndex, Fragment.from(node))) {
                    console.log('[DragReorder] Found valid position searching backward:', p);
                    return p;
                  }
                } catch {
                  continue;
                }
              }
              
              // Search forward
              for (let p = clampedPos + 1; p <= Math.min(doc.content.size, clampedPos + 100); p++) {
                try {
                  const $testPos = doc.resolve(p);
                  const testParent = $testPos.node($testPos.depth);
                  const testIndex = $testPos.index($testPos.depth);
                  if (testParent.canReplace(testIndex, testIndex, Fragment.from(node))) {
                    console.log('[DragReorder] Found valid position searching forward:', p);
                    return p;
                  }
                } catch {
                  continue;
                }
              }
              
              console.warn('[DragReorder] Could not find valid insert position');
              return null;
            } catch (error) {
              console.error('[DragReorder] Error in findValidInsertPosition:', {
                error: error instanceof Error ? error.message : String(error),
                pos,
              });
              return null;
            }
          };
          
          // Find the insert position before deletion
          const insertPosBeforeDelete = findValidInsertPosition(targetPos);
          
          if (insertPosBeforeDelete === null) {
            console.warn('[DragReorder] Could not find valid insert position for targetPos:', targetPos);
            return;
          }
          
          console.log('[DragReorder] Found insert position:', {
            targetPos,
            insertPosBeforeDelete,
            nodeStart,
            nodeEnd,
          });
          
          // Calculate the final insert position after deletion
          // After deleting [nodeStart, nodeEnd), positions shift:
          // - Positions < nodeStart: unchanged
          // - Positions >= nodeEnd: subtract nodeSize
          let finalInsertPos: number;
          
          if (insertPosBeforeDelete < nodeStart) {
            // Inserting before the dragged node: position unchanged
            finalInsertPos = insertPosBeforeDelete;
          } else if (insertPosBeforeDelete > nodeEnd) {
            // Inserting after the dragged node: adjust for deletion
            finalInsertPos = insertPosBeforeDelete - nodeSize;
          } else {
            // Edge case: insertPos is at nodeStart or nodeEnd (boundaries)
            // This can happen when targetPos is at the boundary of the dragged node
            if (insertPosBeforeDelete === nodeStart) {
              // Inserting at nodeStart: this means we want to insert before the dragged node
              // After deletion, the position becomes the start position
              finalInsertPos = nodeStart;
            } else if (insertPosBeforeDelete === nodeEnd) {
              // Inserting at nodeEnd: this means we want to insert after the dragged node
              // After deletion, positions shift, so this becomes nodeStart
              finalInsertPos = nodeStart;
            } else {
              // insertPos is strictly inside the dragged node
              // This shouldn't happen with our improved logic, but handle it anyway
              console.warn('[DragReorder] insertPosBeforeDelete is inside dragged node:', {
                insertPosBeforeDelete,
                nodeStart,
                nodeEnd,
              });
              // Skip this update
              return;
            }
          }
          
          // Validate finalInsertPos is within document bounds
          if (finalInsertPos < 0) {
            finalInsertPos = 0;
          }
          
          // Skip if same as last position (avoid unnecessary updates)
          if (lastMovedToPos !== null && finalInsertPos === lastMovedToPos) {
            return;
          }
          
          console.log('[DragReorder] Calculated final insert position:', {
            insertPosBeforeDelete,
            finalInsertPos,
            nodeStart,
            nodeEnd,
            nodeSize,
            calculation: insertPosBeforeDelete < nodeStart ? 'before (unchanged)' : 
                        insertPosBeforeDelete > nodeEnd ? 'after (adjusted)' : 'edge case',
          });
          
          // Test if we can actually insert at this position after deletion
          try {
            const testTr = view.state.tr;
            testTr.delete(nodeStart, nodeEnd);
            const testDoc = testTr.doc;
            
            // Clamp to document size after deletion
            if (finalInsertPos > testDoc.content.size) {
              console.warn('[DragReorder] FinalInsertPos exceeds doc size, clamping:', {
                finalInsertPos,
                docSize: testDoc.content.size,
              });
              finalInsertPos = testDoc.content.size;
            }
            
            // Try to resolve and validate the position
            const $insertPos = testDoc.resolve(finalInsertPos);
            
            // Check if we can replace at this position
            const canReplace = $insertPos.parent.canReplace($insertPos.index(), $insertPos.index(), Fragment.from(node));
            
            console.log('[DragReorder] Validation result:', {
              finalInsertPos,
              canReplace,
              parentType: $insertPos.parent.type.name,
              index: $insertPos.index(),
            });
            
            if (canReplace) {
              pendingInsertPos = finalInsertPos;
              lastMovedToPos = finalInsertPos;
            } else {
              console.warn('[DragReorder] Cannot replace at position:', {
                finalInsertPos,
                parentType: $insertPos.parent.type.name,
                index: $insertPos.index(),
              });
            }
          } catch (error) {
            // Position is invalid, skip this update
            console.error('[DragReorder] Error validating position:', {
              finalInsertPos,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      };

      const handleDocumentScroll = () => {
        if (isDragging && dragPreviewElement && lastMouseEvent) {
          updateDragPreviewPosition(lastMouseEvent);
        }
      };

      const handleDocumentMouseUp = () => {
        removeDragPreview();
        
        lastMouseEvent = null;
        
        if (img) {
          img.style.opacity = '';
          img.style.cursor = '';
        }
        
        if (isDragging || mouseDownPos !== null) {
          if (isDragging && dragStartPos !== undefined && pendingInsertPos !== null && dragPreviewNode) {
            console.log('[DragReorder] MouseUp - Starting insert:', {
              dragStartPos,
              pendingInsertPos,
              isDragging,
              hasDragPreviewNode: !!dragPreviewNode,
            });
            
            // Use dragPreviewNode to preserve all attributes (including alignment)
            const nodeToMove = dragPreviewNode;
            
            if (!nodeToMove || nodeToMove.type.name !== 'image') {
              console.warn('[DragReorder] Invalid nodeToMove:', {
                nodeType: nodeToMove?.type?.name,
              });
              return;
            }
            
            const nodeSize = nodeToMove.nodeSize;
            const nodeStart = dragStartPos;
            const nodeEnd = dragStartPos + nodeSize;
            const nodeToMoveId = nodeToMove.attrs.id;
            
            if (!nodeToMoveId) {
              console.warn('[DragReorder] Node missing ID:', {
                attrs: nodeToMove.attrs,
              });
              return;
            }
            
            console.log('[DragReorder] Node to move:', {
              id: nodeToMoveId,
              nodeSize,
              nodeStart,
              nodeEnd,
              attrs: {
                src: nodeToMove.attrs.src?.substring(0, 50),
                align: nodeToMove.attrs.align,
                width: nodeToMove.attrs.width,
                height: nodeToMove.attrs.height,
              },
            });
            
            try {
              const newTr = view.state.tr;
              
              console.log('[DragReorder] Before delete:', {
                docSize: view.state.doc.content.size,
                nodeStart,
                nodeEnd,
              });
              
              // Delete the node at original position
              newTr.delete(nodeStart, nodeEnd);
              const newDoc = newTr.doc;
              
              console.log('[DragReorder] After delete:', {
                docSize: newDoc.content.size,
                deletedSize: nodeEnd - nodeStart,
              });
              
              // pendingInsertPos was already calculated after deletion in handleDocumentMouseMove
              // Validate and clamp it with the actual newDoc
              let finalInsertPos = Math.max(0, Math.min(pendingInsertPos, newDoc.content.size));
              
              console.log('[DragReorder] Insert position:', {
                pendingInsertPos,
                finalInsertPos,
                docSize: newDoc.content.size,
              });
              
              // Try to resolve the position and find a valid insertion point
              let $insertPos;
              try {
                $insertPos = newDoc.resolve(finalInsertPos);
              } catch {
                // If resolution fails, try to find a valid position near the target
                // Search in a small range around the target position
                const searchRange = 50;
                const startSearch = Math.max(0, finalInsertPos - searchRange);
                const endSearch = Math.min(newDoc.content.size, finalInsertPos + searchRange);
                
                for (let pos = startSearch; pos <= endSearch; pos++) {
                  try {
                    const $testPos = newDoc.resolve(pos);
                    if ($testPos.parent.canReplace($testPos.index(), $testPos.index(), Fragment.from(nodeToMove))) {
                      finalInsertPos = pos;
                      $insertPos = $testPos;
                      break;
                    }
                  } catch {
                    continue;
                  }
                }
                
                // If still not found, search entire document (fallback)
                if (!$insertPos) {
                  for (let pos = 0; pos <= newDoc.content.size; pos++) {
                    try {
                      const $testPos = newDoc.resolve(pos);
                      if ($testPos.parent.canReplace($testPos.index(), $testPos.index(), Fragment.from(nodeToMove))) {
                        finalInsertPos = pos;
                        $insertPos = $testPos;
                        break;
                      }
                    } catch {
                      continue;
                    }
                  }
                }
                
                if (!$insertPos) {
                  return;
                }
              }
              
              // Try to insert at the resolved position
              const insertIndex = $insertPos.index();
              const insertParent = $insertPos.parent;
              
              // Check if we can replace at this index
              const canReplace = insertParent.canReplace(insertIndex, insertIndex, Fragment.from(nodeToMove));
              
              console.log('[DragReorder] Can replace check:', {
                canReplace,
                insertIndex,
                parentType: insertParent.type.name,
                finalInsertPos,
              });
              
              if (canReplace) {
                // Create new node with all attributes preserved
                const newNode = nodeToMove.type.create(nodeToMove.attrs, nodeToMove.content);
                newTr.insert(finalInsertPos, newNode);
                
                console.log('[DragReorder] Inserted node at position:', finalInsertPos);
                
                if (newTr.docChanged) {
                  view.dispatch(newTr);
                  
                  console.log('[DragReorder] Transaction dispatched successfully');
                  
                  // Find and select the moved node using the known insert position
                  // The node should be at finalInsertPos after insertion
                  const newState = view.state;
                  const newDoc = newState.doc;
                  
                  // First try the exact insert position
                  let foundPos: number | null = null;
                  const nodeAtInsertPos = newDoc.nodeAt(finalInsertPos);
                  if (nodeAtInsertPos && nodeAtInsertPos.type.name === 'image' && nodeAtInsertPos.attrs.id === nodeToMoveId) {
                    foundPos = finalInsertPos;
                  } else {
                    // Search near the insert position (should be very close)
                    const searchRange = Math.min(100, newDoc.content.size);
                    const startSearch = Math.max(0, finalInsertPos - searchRange);
                    const endSearch = Math.min(newDoc.content.size, finalInsertPos + searchRange);
                    
                    for (let pos = startSearch; pos < endSearch; pos++) {
                      const nodeAtPos = newDoc.nodeAt(pos);
                      if (nodeAtPos && nodeAtPos.type.name === 'image' && nodeAtPos.attrs.id === nodeToMoveId) {
                        foundPos = pos;
                        break;
                      }
                    }
                    
                    // If still not found, search entire document (should rarely happen)
                    if (foundPos === null) {
                      for (let pos = 0; pos < newDoc.content.size; pos++) {
                        const nodeAtPos = newDoc.nodeAt(pos);
                        if (nodeAtPos && nodeAtPos.type.name === 'image' && nodeAtPos.attrs.id === nodeToMoveId) {
                          foundPos = pos;
                          break;
                        }
                      }
                    }
                  }
                  
                  // Select the moved node
                  if (foundPos !== null) {
                    console.log('[DragReorder] Found moved node at position:', foundPos);
                    const { tr: selectTr, doc: selectDoc } = view.state;
                    const movedNode = selectDoc.nodeAt(foundPos);
                    if (movedNode && movedNode.type.name === 'image') {
                      selectTr.setSelection(TextSelection.create(selectDoc, foundPos, foundPos + movedNode.nodeSize));
                      view.dispatch(selectTr);
                      
                      const event = new CustomEvent('selectImage', { 
                        detail: { pos: foundPos } 
                      });
                      document.dispatchEvent(event);
                      
                      console.log('[DragReorder] Successfully selected moved node:', {
                        foundPos,
                        expectedPos: finalInsertPos,
                        match: foundPos === finalInsertPos,
                      });
                    }
                  } else {
                    console.warn('[DragReorder] Could not find moved node after insert:', {
                      finalInsertPos,
                      docSize: newDoc.content.size,
                    });
                  }
                } else {
                  console.warn('[DragReorder] Transaction did not change document');
                }
              } else {
                console.warn('[DragReorder] Cannot replace at insert position:', {
                  insertIndex,
                  parentType: insertParent.type.name,
                });
              }
            } catch (error) {
              // Log error for debugging but don't break the UI
              console.error('[DragReorder] Error during drag to reorder:', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                dragStartPos,
                pendingInsertPos,
              });
            }
          } else if (dragStartPos !== undefined) {
            console.log('[DragReorder] MouseUp - Click only (no drag):', {
              dragStartPos,
              isDragging,
              wasCtrlClick,
            });
            
            // Only dispatch selectImage if we're not in multi-select mode
            // If the click was with Ctrl/Cmd, don't dispatch selectImage to avoid resetting multi-select
            const { doc, tr } = view.state;
            const node = doc.nodeAt(dragStartPos);
            
            if (node && node.type.name === 'image') {
              tr.setSelection(TextSelection.create(doc, dragStartPos, dragStartPos + node.nodeSize));
              view.dispatch(tr);
              
              // Only dispatch selectImage if it was a single click (not Ctrl/Cmd)
              // This prevents resetting multi-select when clicking with Ctrl/Cmd
              if (!wasCtrlClick) {
                const event = new CustomEvent('selectImage', { 
                  detail: { 
                    pos: dragStartPos
                  } 
                });
                document.dispatchEvent(event);
              }
            }
          }
          
          console.log('[DragReorder] MouseUp - Cleanup state');
          
          isDragging = false;
          dragStartPos = undefined;
          lastMovedToPos = null;
          pendingInsertPos = null;
          mouseDownPos = null;
          dragPreviewNode = null;
          wasCtrlClick = false;
        }
      };

      const updateSelectionStyle = () => {
        const pos = getPos();
        if (typeof pos === 'number') {
          const event = new CustomEvent('checkImageSelection', { detail: { pos, callback: (isSelected: boolean) => {
            if (isSelected) {
              img.style.outline = '3px solid #3b82f6';
              img.style.outlineOffset = '0px';
              img.style.borderRadius = '0';
              showHandles();
            } else {
              img.style.outline = '';
              img.style.outlineOffset = '';
              img.style.borderRadius = '';
              hideHandles();
            }
          }}});
          document.dispatchEvent(event);
        }
      };
      
      updateSelectionStyle();
      
      document.addEventListener('click', handleDocumentClick);
      document.addEventListener('mousemove', handleDocumentMouseMove);
      document.addEventListener('mouseup', handleDocumentMouseUp);
      document.addEventListener('scroll', handleDocumentScroll, true); // Use capture phase to catch all scroll events
      
      const handleSelectionUpdate = () => {
        updateSelectionStyle();
      };
      
      document.addEventListener('imageSelectionChanged', handleSelectionUpdate);
      const intervalId = setInterval(updateSelectionStyle, 100);

      // Function to update caption and alignment when node changes
      const updateCaptionAndAlignment = () => {
        console.log('[NodeView] updateCaptionAndAlignment() called');
        const currentCaption = node.attrs.caption;
        const currentAlign = node.attrs.align;
        const currentHref = node.attrs.href;
        console.log('[NodeView] currentAlign:', currentAlign);
        
        // Get the image container (either link or imgWrapper) from DOM
        // First try to find link, then imgWrapper (the div containing the img)
        const linkEl = dom.querySelector('a');
        let currentImageContainer: HTMLElement | null = null;
        if (linkEl) {
          currentImageContainer = linkEl as HTMLElement;
        } else {
          // Find the div that directly contains the img
          const img = dom.querySelector('img');
          if (img && img.parentElement) {
            currentImageContainer = img.parentElement as HTMLElement;
          }
        }

        // Update caption
        let captionEl = dom.querySelector('.image-caption') as HTMLElement;
        if (currentCaption) {
          if (!captionEl) {
            captionEl = document.createElement('div');
            captionEl.className = 'image-caption';
            captionEl.style.textAlign = 'center';
            captionEl.style.fontStyle = 'italic';
            captionEl.style.color = '#666';
            captionEl.style.marginTop = '0.5em';
            captionEl.style.fontSize = '0.9em';
            dom.appendChild(captionEl);
          }
          captionEl.textContent = currentCaption as string;
        } else if (captionEl) {
          captionEl.remove();
        }

        // Update alignment - reset all styles first
        console.log('[NodeView] Resetting alignment styles');
        // Reset alignment-related styles but keep position and maxWidth
        dom.style.width = '';
        dom.style.margin = '';
        dom.style.marginLeft = '';
        dom.style.marginRight = '';
        dom.style.float = '';
        dom.style.textAlign = '';
        dom.style.display = '';
        // Don't reset display here - let alignment logic set it

        console.log('[NodeView] Applying alignment:', currentAlign);
        if (currentAlign === 'full') {
          dom.style.width = '100%';
          dom.style.display = 'block';
          dom.style.margin = '0';
          dom.style.marginLeft = '0';
          dom.style.marginRight = '0';
          console.log('[NodeView] Applied full alignment');
        } else if (currentAlign === 'center') {
          dom.style.width = '100%';
          dom.style.display = 'block';
          dom.style.margin = '0';
          dom.style.marginLeft = '0';
          dom.style.marginRight = '0';
          dom.style.textAlign = 'center';
          // Center the image content within the wrapper using text-align
          if (currentImageContainer) {
            (currentImageContainer as HTMLElement).style.display = 'inline-block';
            (currentImageContainer as HTMLElement).style.margin = '0';
            (currentImageContainer as HTMLElement).style.maxWidth = '100%';
          }
          console.log('[NodeView] Applied center alignment');
        } else if (currentAlign === 'left') {
          dom.style.width = '100%';
          dom.style.display = 'block';
          dom.style.margin = '0';
          dom.style.marginLeft = '0';
          dom.style.marginRight = '0';
          dom.style.textAlign = 'left';
          // Align image content to the left within the wrapper using text-align
          if (currentImageContainer) {
            (currentImageContainer as HTMLElement).style.display = 'inline-block';
            (currentImageContainer as HTMLElement).style.margin = '0';
            (currentImageContainer as HTMLElement).style.maxWidth = '100%';
          }
          console.log('[NodeView] Applied left alignment');
        } else if (currentAlign === 'right') {
          dom.style.width = '100%';
          dom.style.display = 'block';
          dom.style.margin = '0';
          dom.style.marginLeft = '0';
          dom.style.marginRight = '0';
          dom.style.textAlign = 'right';
          // Align image content to the right within the wrapper using text-align
          if (currentImageContainer) {
            (currentImageContainer as HTMLElement).style.display = 'inline-block';
            (currentImageContainer as HTMLElement).style.margin = '0';
            (currentImageContainer as HTMLElement).style.maxWidth = '100%';
          }
          console.log('[NodeView] Applied right alignment');
        } else if (currentAlign === 'float-left') {
          dom.style.display = 'inline-block'; // Float needs inline-block
          dom.style.float = 'left';
          dom.style.margin = '0';
          dom.style.marginRight = '1em';
          dom.style.marginLeft = '0';
          dom.style.width = '';
          dom.style.textAlign = '';
          // Reset image container styles for float
          if (currentImageContainer) {
            (currentImageContainer as HTMLElement).style.display = '';
            (currentImageContainer as HTMLElement).style.margin = '';
            (currentImageContainer as HTMLElement).style.marginLeft = '';
            (currentImageContainer as HTMLElement).style.marginRight = '';
            (currentImageContainer as HTMLElement).style.width = '';
            (currentImageContainer as HTMLElement).style.maxWidth = '';
          }
          console.log('[NodeView] Applied float-left alignment');
        } else if (currentAlign === 'float-right') {
          dom.style.display = 'inline-block'; // Float needs inline-block
          dom.style.float = 'right';
          dom.style.margin = '0';
          dom.style.marginLeft = '1em';
          dom.style.marginRight = '0';
          dom.style.width = '';
          dom.style.textAlign = '';
          // Reset image container styles for float
          if (currentImageContainer) {
            (currentImageContainer as HTMLElement).style.display = '';
            (currentImageContainer as HTMLElement).style.margin = '';
            (currentImageContainer as HTMLElement).style.marginLeft = '';
            (currentImageContainer as HTMLElement).style.marginRight = '';
            (currentImageContainer as HTMLElement).style.width = '';
            (currentImageContainer as HTMLElement).style.maxWidth = '';
          }
          console.log('[NodeView] Applied float-right alignment');
        } else {
          // Default: no alignment, use inline-block
          dom.style.display = 'inline-block';
          dom.style.margin = '0';
          dom.style.width = '';
          dom.style.textAlign = '';
          // Reset image container styles
          if (currentImageContainer) {
            (currentImageContainer as HTMLElement).style.display = '';
            (currentImageContainer as HTMLElement).style.margin = '';
            (currentImageContainer as HTMLElement).style.marginLeft = '';
            (currentImageContainer as HTMLElement).style.marginRight = '';
            (currentImageContainer as HTMLElement).style.width = '';
            (currentImageContainer as HTMLElement).style.maxWidth = '';
          }
          console.log('[NodeView] No alignment applied (currentAlign is null or unknown)');
        }
        
        // Force a reflow to ensure styles are applied
        void dom.offsetHeight;
        
        console.log('[NodeView] Final DOM styles:', {
          width: dom.style.width,
          display: dom.style.display,
          margin: dom.style.margin,
          marginLeft: dom.style.marginLeft,
          marginRight: dom.style.marginRight,
          float: dom.style.float,
          computedDisplay: window.getComputedStyle(dom).display,
          computedMarginLeft: window.getComputedStyle(dom).marginLeft,
          computedMarginRight: window.getComputedStyle(dom).marginRight,
        });

        // Update link - img is already in dom, check if it's wrapped in link
        const existingLink = dom.querySelector('a');
        if (currentHref) {
          if (!existingLink) {
            // Wrap img in link
            const link = document.createElement('a');
            link.href = currentHref as string;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            // Replace img with link containing img
            if (img.parentNode) {
              img.parentNode.insertBefore(link, img);
              link.appendChild(img);
            }
          } else {
            existingLink.href = currentHref as string;
          }
        } else if (existingLink && existingLink.contains(img)) {
          // Remove link, keep img
          if (existingLink.parentNode) {
            existingLink.parentNode.insertBefore(img, existingLink);
            existingLink.remove();
          }
        }
      };

      // Initial update
      updateCaptionAndAlignment();

      return {
        dom,
        contentDOM: null,
        ignoreMutation: () => true,
        update: (updatedNode: PMNode) => {
          console.log('[NodeView] update() called', updatedNode.attrs);
          if (updatedNode.type.name !== 'image') {
            console.log('[NodeView] Not an image node, returning false');
            return false;
          }
          node = updatedNode;
          console.log('[NodeView] Node updated, calling updateImageSize and updateCaptionAndAlignment');
          updateImageSize();
          updateCaptionAndAlignment();
          return true;
        },
        destroy: () => {
          document.removeEventListener('click', handleDocumentClick);
          document.removeEventListener('mousemove', handleDocumentMouseMove);
          document.removeEventListener('mouseup', handleDocumentMouseUp);
          document.removeEventListener('scroll', handleDocumentScroll, true);
          document.removeEventListener('imageSelectionChanged', handleSelectionUpdate);
          clearInterval(intervalId);
          // Clean up drag preview if still exists
          removeDragPreview();
        },
      };
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setAlignImage:
        (align: 'left' | 'center' | 'right' | 'full' | null) =>
        ({ commands }: CommandProps) => {
          return commands.updateAttributes(this.name, { align });
        },
    };
  },
});

const DEFAULT_IFRAME_ATTRS: Omit<IframeAttributes, 'src' | 'title'> = {
  width: '100%',
  height: '400',
  frameborder: '0',
  allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
  allowfullscreen: true,
  referrerpolicy: 'strict-origin-when-cross-origin',
};

const toYouTubeEmbedUrl = (rawUrl: string): string => {
  if (!rawUrl) return '';

  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname.replace('www.', '');

    const copySearchParams = (source: URL, target: URL): void => {
      source.searchParams.forEach((value, key) => {
        if (key !== 'v') {
          target.searchParams.set(key, value);
        }
      });
    };

    if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      if (url.pathname === '/watch') {
        const videoId = url.searchParams.get('v');
        if (videoId) {
          const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`);
          copySearchParams(url, embedUrl);
          return embedUrl.toString();
        }
      }

      if (url.pathname.startsWith('/embed/')) {
        return url.toString();
      }

      if (url.pathname.startsWith('/shorts/')) {
        const segments = url.pathname.split('/');
        const videoId = segments[segments.length - 1];
        if (videoId) {
          const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`);
          copySearchParams(url, embedUrl);
          return embedUrl.toString();
        }
      }
    }

    if (hostname === 'youtu.be') {
      const videoId = url.pathname.replace('/', '');
      if (videoId) {
        const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`);
        url.searchParams.forEach((value, key) => {
          embedUrl.searchParams.set(key, value);
        });
        return embedUrl.toString();
      }
    }

    return url.toString();
    } catch {
      return rawUrl;
    }
};

interface ExtractIframesResult {
  iframes: IframeAttributes[];
  remainingHTML: string;
}

// Extract all iframes from HTML and return them along with the remaining HTML
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const extractIframesFromHTML = (html: string): ExtractIframesResult => {
  if (!html) return { iframes: [], remainingHTML: html };

  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = html;
  const iframeElements = tempContainer.querySelectorAll('iframe');
  
  const iframeAttrsList: IframeAttributes[] = [];

  iframeElements.forEach((iframeEl) => {
    const src = iframeEl.getAttribute('src');
    if (!src) {
      iframeEl.remove();
      return;
    }

    // Validate that src is a valid URL
    let validSrc;
    try {
      validSrc = new URL(src);
    } catch {
      iframeEl.remove();
      return;
    }

    const attrs: Partial<IframeAttributes> = { ...DEFAULT_IFRAME_ATTRS };

    // For YouTube URLs, convert to embed format
    // For other URLs, use as-is
    if (validSrc.hostname.includes('youtube.com') || validSrc.hostname.includes('youtu.be')) {
      attrs.src = toYouTubeEmbedUrl(src);
    } else {
      attrs.src = src;
    }

    if (!attrs.src) {
      iframeEl.remove();
      return;
    }

    attrs.width = iframeEl.getAttribute('width') || DEFAULT_IFRAME_ATTRS.width;
    attrs.height = iframeEl.getAttribute('height') || DEFAULT_IFRAME_ATTRS.height;
    attrs.frameborder = iframeEl.getAttribute('frameborder') || DEFAULT_IFRAME_ATTRS.frameborder;
    
    // Get allow attribute and remove 'web-share' if present (not supported)
    let allowAttr = iframeEl.getAttribute('allow') || DEFAULT_IFRAME_ATTRS.allow;
    if (allowAttr && allowAttr.includes('web-share')) {
      allowAttr = allowAttr.replace(/web-share;?/g, '').trim().replace(/;+/g, ';').replace(/^;|;$/g, '');
    }
    attrs.allow = allowAttr || DEFAULT_IFRAME_ATTRS.allow;
    
    attrs.referrerpolicy = iframeEl.getAttribute('referrerpolicy') || DEFAULT_IFRAME_ATTRS.referrerpolicy;
    attrs.allowfullscreen = iframeEl.hasAttribute('allowfullscreen');

    const title = iframeEl.getAttribute('title');
    if (title) {
      attrs.title = title;
    }

    // Ensure src is never undefined (convert to null if needed)
    attrs.src = attrs.src ?? null;
    iframeAttrsList.push(attrs as IframeAttributes);
    // Remove iframe from DOM
    iframeEl.remove();
  });

  // Get remaining HTML after removing iframes
  const remainingHTML = tempContainer.innerHTML;

  return { iframes: iframeAttrsList, remainingHTML };
};

const parseIframeInput = (input: string): IframeAttributes | null => {
  if (!input) return null;

  const trimmed = input.trim();
  const attrs: Partial<IframeAttributes> = { ...DEFAULT_IFRAME_ATTRS };

  // Check if input contains iframe tag (case-insensitive)
  const lowerInput = trimmed.toLowerCase();
  if (lowerInput.includes('<iframe')) {
    // Try to extract iframe from HTML
    let iframeEl = null;
    
    // First, try parsing as HTML
    try {
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = trimmed;
      iframeEl = tempContainer.querySelector('iframe');
    } catch {
      // If HTML parsing fails, try regex extraction as fallback
      const iframeMatch = trimmed.match(/<iframe[^>]*>/i);
      if (iframeMatch) {
        // Try to extract src using regex
        const srcMatch = trimmed.match(/src\s*=\s*["']([^"']+)["']/i);
        if (srcMatch && srcMatch[1]) {
          const src = srcMatch[1];
          try {
            const validSrc = new URL(src);
            if (validSrc.hostname.includes('youtube.com') || validSrc.hostname.includes('youtu.be')) {
              attrs.src = toYouTubeEmbedUrl(src);
            } else {
              attrs.src = src;
            }
            
            // Extract other attributes using regex
            const widthMatch = trimmed.match(/width\s*=\s*["']([^"']+)["']/i);
            const heightMatch = trimmed.match(/height\s*=\s*["']([^"']+)["']/i);
            
            if (widthMatch && widthMatch[1]) attrs.width = widthMatch[1];
            if (heightMatch && heightMatch[1]) attrs.height = heightMatch[1];
            
            if (attrs.src) {
              return attrs as IframeAttributes;
            }
          } catch {
            return null;
          }
        }
      }
      return null;
    }

    if (!iframeEl) {
      return null;
    }

    const src = iframeEl.getAttribute('src');
    if (!src) {
      return null;
    }

    // Validate that src is a valid URL
    let validSrc;
    try {
      validSrc = new URL(src);
    } catch {
      return null;
    }

    // For YouTube URLs, convert to embed format
    // For other URLs, use as-is
    if (validSrc.hostname.includes('youtube.com') || validSrc.hostname.includes('youtu.be')) {
      attrs.src = toYouTubeEmbedUrl(src);
    } else {
      attrs.src = src;
    }

    if (!attrs.src) {
      return null;
    }

    attrs.width = iframeEl.getAttribute('width') || DEFAULT_IFRAME_ATTRS.width;
    attrs.height = iframeEl.getAttribute('height') || DEFAULT_IFRAME_ATTRS.height;
    attrs.frameborder = iframeEl.getAttribute('frameborder') || attrs.frameborder;
    
    // Get allow attribute and remove 'web-share' if present (not supported)
    let allowAttr = iframeEl.getAttribute('allow') || DEFAULT_IFRAME_ATTRS.allow;
    if (allowAttr && allowAttr.includes('web-share')) {
      allowAttr = allowAttr.replace(/web-share;?/g, '').trim().replace(/;+/g, ';').replace(/^;|;$/g, '');
    }
    attrs.allow = allowAttr || DEFAULT_IFRAME_ATTRS.allow;
    
    attrs.referrerpolicy = iframeEl.getAttribute('referrerpolicy') || attrs.referrerpolicy;
    attrs.allowfullscreen = iframeEl.hasAttribute('allowfullscreen');

    const title = iframeEl.getAttribute('title');
    if (title) {
      attrs.title = title;
    }

    return attrs as IframeAttributes;
  }

  // For plain text, validate it's a URL first
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return null;
  }

  // Validate URL format
  try {
    new URL(trimmed);
  } catch {
    return null;
  }

  // For YouTube URLs, convert to embed format
  // For other URLs, only accept YouTube for now (to avoid creating iframes from random URLs)
  const embedUrl = toYouTubeEmbedUrl(trimmed);
  if (!embedUrl) {
    return null;
  }

  // Only create iframe for YouTube URLs when pasting plain text
  if (!embedUrl.includes('youtube.com') && !embedUrl.includes('youtu.be')) {
    return null;
  }

    attrs.src = embedUrl;
    attrs.width = DEFAULT_IFRAME_ATTRS.width;
    attrs.height = DEFAULT_IFRAME_ATTRS.height;
    return attrs as IframeAttributes;
};

interface TiptapEditorProps {
  content?: string;
  onChange?: (html: string) => void;
}


export default function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const [highlightColor, setHighlightColor] = useState('#ffffff');
  const [textColor, setTextColor] = useState('#000000');
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [linkPopoverUrl, setLinkPopoverUrl] = useState('');
  const [linkPopoverPosition, setLinkPopoverPosition] = useState({ top: 0, left: 0 });
  const [linkDialogPosition, setLinkDialogPosition] = useState<{ top: number; left: number } | null>(null);
  const [linkEditRange, setLinkEditRange] = useState<{ from: number; to: number } | null>(null);
  const [showImageDropdown, setShowImageDropdown] = useState(false);
  const [showImageLayoutDialog, setShowImageLayoutDialog] = useState(false);
  const [, setImageLayoutButtonRef] = useState<HTMLElement | null>(null);
  const [imageLayoutDropdownPosition, setImageLayoutDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectedImagePositions, setSelectedImagePositions] = useState<number[]>([]);
  const [lastMousePosition, setLastMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [gridRows, setGridRows] = useState(2);
  const [gridColumns, setGridColumns] = useState(2);
  const [showImageToolbar, setShowImageToolbar] = useState(false);
  const [imageToolbarPos, setImageToolbarPos] = useState<{ top: number; left: number } | null>(null);
  const [selectedImagePos, setSelectedImagePos] = useState<number | null>(null);
  const [selectedImageNode, setSelectedImageNode] = useState<{ attrs: Record<string, unknown> } | null>(null);
  const [showImageAltDialog, setShowImageAltDialog] = useState(false);
  const [showImageCaptionDialog, setShowImageCaptionDialog] = useState(false);
  const [showImageLinkDialog, setShowImageLinkDialog] = useState(false);
  const [showImageReplaceDialog, setShowImageReplaceDialog] = useState(false);
  const [imageAltDialogPosition, setImageAltDialogPosition] = useState<{ top: number; left: number } | null>(null);
  const [imageCaptionDialogPosition, setImageCaptionDialogPosition] = useState<{ top: number; left: number } | null>(null);
  const [imageLinkDialogPosition, setImageLinkDialogPosition] = useState<{ top: number; left: number } | null>(null);
  const [imageReplaceDialogPosition, setImageReplaceDialogPosition] = useState<{ top: number; left: number } | null>(null);
  
  const editor = useEditor({
    immediatelyRender: false,
    parseOptions: {
      preserveWhitespace: 'full',
    },
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        link: false,
      }),
      ResizableImage.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        defaultAlignment: 'left',
      }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      Underline,
      Subscript,
      Superscript,
      Highlight.configure({
        multicolor: true,
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'tiptap-table',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: 'Start typing...',
      }),
      Indent,
      Iframe,
      ImageGallery,
    ],
    content: content || '',
    onUpdate: ({ editor }: { editor: Editor }) => {
      if (onChange) {
        let html = editor.getHTML();
        
        const processImageSpacing = (htmlString: string): string => {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = htmlString;
          
          const walker = document.createTreeWalker(
            tempDiv,
            NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
            null
          );
          
          const imageWrappers: HTMLElement[] = [];
          const nodes: Node[] = [];
          
          let node;
          while (node = walker.nextNode()) {
            nodes.push(node);
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement;
              if (element.classList?.contains('resizable-image-wrapper')) {
                imageWrappers.push(element);
              }
            }
          }
          
          imageWrappers.forEach((wrapper, index) => {
            if (index < imageWrappers.length - 1) {
              const nextWrapper = imageWrappers[index + 1];
              let spaceCount = 0;
              
              let currentNode = wrapper.nextSibling;
              while (currentNode && currentNode !== nextWrapper) {
                if (currentNode.nodeType === Node.TEXT_NODE) {
                  const text = currentNode.textContent || '';
                  spaceCount += (text.match(/ /g) || []).length;
                }
                currentNode = currentNode.nextSibling;
              }
              
              if (spaceCount > 0) {
                const marginRight = spaceCount * 0.25;
                const currentStyle = wrapper.getAttribute('style') || '';
                const styleWithoutMargin = currentStyle.replace(/margin-right:\s*[^;]+;?/g, '').trim();
                const newStyle = styleWithoutMargin ? `${styleWithoutMargin}; margin-right: ${marginRight}em;` : `margin-right: ${marginRight}em;`;
                wrapper.setAttribute('style', newStyle);
              }
            }
          });
          
          return tempDiv.innerHTML;
        };
        
        html = processImageSpacing(html);
        onChange(html);
      }
    },
    editorProps: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      handlePaste(_view: EditorView, _event: ClipboardEvent) {
        // Paste handling logic can be added here if needed
        return false;
      },
    },
  });

  useEffect(() => {
    if (!editor) return;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const updateFloatingLayoutButton = (_positions: number[], _mouseX?: number, _mouseY?: number) => {
      // Floating layout button removed
    };

    const handleSelectImage = (e: Event) => {
      const customEvent = e as CustomEvent<{ pos: number; mouseX?: number; mouseY?: number }>;
      const { pos, mouseX, mouseY } = customEvent.detail;
      const newPositions = [pos];
      setSelectedImagePositions(newPositions);
      
      // Show ImageToolbar
      if (editor) {
        const { doc } = editor.state;
        const node = doc.nodeAt(pos);
        if (node && node.type.name === 'image') {
          setSelectedImagePos(pos);
          setSelectedImageNode(node);
          
          // Calculate toolbar position from the clicked image element
          setTimeout(() => {
            const { view } = editor;
            const editorDom = view.dom;
            const editorContentContainer = editorDom.closest('.ProseMirror')?.parentElement;
            
            if (editorContentContainer) {
              const containerRect = editorContentContainer.getBoundingClientRect();
              
              // Try to find the image DOM element by matching id
              const imageId = node.attrs.id;
              
              // All images should have id now
              if (!imageId) {
                console.warn('Image node missing id, cannot find DOM element');
                // Fallback to coordsAtPos
                const coords = view.coordsAtPos(pos);
                if (coords) {
                  setImageToolbarPos({
                    top: coords.bottom - containerRect.top + 10,
                    left: coords.left - containerRect.left,
                  });
                  setShowImageToolbar(true);
                }
                return;
              }
              
              const imageWrappers = editorContentContainer.querySelectorAll('.resizable-image-wrapper');
              let foundWrapper: HTMLElement | null = null;
              
              // Find the wrapper that contains the image with matching id
              for (let i = 0; i < imageWrappers.length; i++) {
                const wrapper = imageWrappers[i];
                const img = wrapper.querySelector('img');
                if (img) {
                  // Use id matching exclusively for accuracy
                  const imgId = img.getAttribute('data-image-id') || img.getAttribute('id');
                  if (imgId === imageId) {
                    foundWrapper = wrapper as HTMLElement;
                    break;
                  }
                }
              }
              
              if (foundWrapper) {
                // Use the wrapper's bounding rect to position toolbar
                const wrapperRect = foundWrapper.getBoundingClientRect();
                setImageToolbarPos({
                  top: wrapperRect.bottom - containerRect.top + 10,
                  left: wrapperRect.left - containerRect.left,
                });
                setShowImageToolbar(true);
              } else if (mouseX !== undefined && mouseY !== undefined) {
                // Fallback to mouse position
                setImageToolbarPos({
                  top: mouseY - containerRect.top + 10,
                  left: mouseX - containerRect.left,
                });
                setShowImageToolbar(true);
              } else {
                // Last fallback: use coordsAtPos
                const coords = view.coordsAtPos(pos);
                if (coords) {
                  setImageToolbarPos({
                    top: coords.bottom - containerRect.top + 10,
                    left: coords.left - containerRect.left,
                  });
                  setShowImageToolbar(true);
                }
              }
            }
          }, 10);
        }
      }
      
      if (mouseX !== undefined && mouseY !== undefined) {
        setLastMousePosition({ x: mouseX, y: mouseY });
      }
      setTimeout(() => {
        updateFloatingLayoutButton(newPositions, mouseX, mouseY);
      }, 0);
    };
    
    const handleToggleImageSelection = (e: Event) => {
      const customEvent = e as CustomEvent<{ pos: number; mouseX?: number; mouseY?: number }>;
      const { pos, mouseX, mouseY } = customEvent.detail;
      setSelectedImagePositions(prev => {
        let next: number[];
        if (prev.includes(pos)) {
          next = prev.filter(p => p !== pos);
        } else {
          next = [...prev, pos];
        }
        if (mouseX !== undefined && mouseY !== undefined) {
          setLastMousePosition({ x: mouseX, y: mouseY });
        }
        setTimeout(() => {
          updateFloatingLayoutButton(next, mouseX, mouseY);
        }, 10);
        return next;
      });
    };
    
    const handleCheckImageSelection = (e: Event) => {
      const customEvent = e as CustomEvent<{ pos: number; callback: (isSelected: boolean) => void }>;
      const { pos, callback } = customEvent.detail;
      callback(selectedImagePositions.includes(pos));
    };
    
    document.addEventListener('selectImage', handleSelectImage);
    document.addEventListener('toggleImageSelection', handleToggleImageSelection);
    document.addEventListener('checkImageSelection', handleCheckImageSelection);
    
    // Update selectedImageNode when editor state changes (e.g., alignment changes)
    const updateSelectedNode = () => {
      if (selectedImagePos !== null && editor) {
        const { doc } = editor.state;
        const node = doc.nodeAt(selectedImagePos);
        if (node && node.type.name === 'image') {
          setSelectedImageNode(node);
        }
      }
    };
    
    if (editor) {
      editor.on('update', updateSelectedNode);
      editor.on('transaction', updateSelectedNode);
    }
    
    const updateEvent = new CustomEvent('imageSelectionChanged');
    document.dispatchEvent(updateEvent);
    
    return () => {
      document.removeEventListener('selectImage', handleSelectImage);
      document.removeEventListener('toggleImageSelection', handleToggleImageSelection);
      document.removeEventListener('checkImageSelection', handleCheckImageSelection);
      if (editor) {
        editor.off('update', updateSelectedNode);
        editor.off('transaction', updateSelectedNode);
      }
    };
  }, [editor, selectedImagePositions, lastMousePosition, selectedImagePos]);

  useEffect(() => {
    let clickTimeout: NodeJS.Timeout | null = null;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      if (
        target.closest('.resizable-image-wrapper') || 
        target.closest('[title*="Image Layout"]') ||
        target.closest('.image-layout-dialog-container') ||
        target.closest('.image-layout-dropdown') ||
        target.closest('.image-toolbar') ||
        target.closest('.image-alt-dialog') ||
        target.closest('.image-caption-dialog') ||
        target.closest('.image-link-dialog') ||
        target.closest('.image-replace-dialog')
      ) {
        if (clickTimeout) {
          clearTimeout(clickTimeout);
          clickTimeout = null;
        }
        return;
      }
      
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }
      
      clickTimeout = setTimeout(() => {
        setSelectedImagePositions([]);
        setShowImageToolbar(false);
        setSelectedImagePos(null);
        setSelectedImageNode(null);
        clickTimeout = null;
      }, 200);
    };
    
    const handleClearTimeout = () => {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
        clickTimeout = null;
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('clearClickOutsideTimeout', handleClearTimeout as EventListener);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('clearClickOutsideTimeout', handleClearTimeout as EventListener);
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }
    };
  }, []);


  useEffect(() => {
    if (editor) {
      const editorDom = editor.view.dom;
      const clickHandler = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        
        if (showLinkPopover && !target.closest('.link-popover') && !target.closest('a')) {
          setShowLinkPopover(false);
          return;
        }
        
        const linkElement = target.closest('a');
        
        if (linkElement) {
          event.preventDefault();
          event.stopPropagation();
          
          const { state } = editor;
          
          const linkRect = linkElement.getBoundingClientRect();
          const editorContentContainer = editorDom.closest('.ProseMirror')?.parentElement;
          
          if (editorContentContainer) {
            const containerRect = editorContentContainer.getBoundingClientRect();
            
            const { selection } = state;
            const { $from } = selection;
            const linkMark = $from.marks().find(mark => mark.type.name === 'link') ||
                            state.storedMarks?.find(mark => mark.type.name === 'link');
            
            const href = linkMark?.attrs.href || linkElement.getAttribute('href') || '';
            
            if (href) {
              setLinkPopoverUrl(href);
              
              const popoverWidth = 320;
              const spacing = 30;
              const left = linkRect.left - containerRect.left;
              const top = linkRect.bottom - containerRect.top + spacing;
              
              setLinkPopoverPosition({
                top: Math.max(10, top),
                left: Math.max(10, Math.min(left, containerRect.width - popoverWidth - 10)),
              });
              
              setShowLinkPopover(true);
            }
          }
        }
      };

      editorDom.addEventListener('click', clickHandler);
      
      const handleOutsideClick = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (showLinkPopover && !target.closest('.link-popover') && !target.closest('.ProseMirror')) {
          setShowLinkPopover(false);
        }
        if (showImageDropdown && !target.closest('.image-dropdown-container')) {
          setShowImageDropdown(false);
        }
      };
      
      document.addEventListener('click', handleOutsideClick);

      const updateHighlightColor = () => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;
        
        let foundColor = '#ffffff';
        
        const marksAtCursor = $from.marks();
        marksAtCursor.forEach((mark) => {
          if (mark.type.name === 'highlight' && mark.attrs.color) {
            foundColor = mark.attrs.color;
          }
        });
        
        if (foundColor === '#ffffff') {
          const marksInSelection = state.storedMarks || selection.$from.marks();
          marksInSelection.forEach((mark) => {
            if (mark.type.name === 'highlight' && mark.attrs.color) {
              foundColor = mark.attrs.color;
            }
          });
        }
        
        setHighlightColor(foundColor);
      };

      const updateTextColor = () => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;
        
        let foundColor = '#000000';
        
        const marksAtCursor = $from.marks();
        marksAtCursor.forEach((mark) => {
          if (mark.type.name === 'textStyle' && mark.attrs.color) {
            foundColor = mark.attrs.color;
          }
        });
        
        if (foundColor === '#000000') {
          const marksInSelection = state.storedMarks || selection.$from.marks();
          marksInSelection.forEach((mark) => {
            if (mark.type.name === 'textStyle' && mark.attrs.color) {
              foundColor = mark.attrs.color;
            }
          });
        }
        
        setTextColor(foundColor);
      };

      editor.on('selectionUpdate', updateHighlightColor);
      editor.on('update', updateHighlightColor);
      editor.on('transaction', updateHighlightColor);
      
      editor.on('selectionUpdate', updateTextColor);
      editor.on('update', updateTextColor);
      editor.on('transaction', updateTextColor);
      
      updateHighlightColor();
      updateTextColor();
      
      return () => {
        editor.off('selectionUpdate', updateHighlightColor);
        editor.off('update', updateHighlightColor);
        editor.off('transaction', updateHighlightColor);
        
        editor.off('selectionUpdate', updateTextColor);
        editor.off('update', updateTextColor);
        editor.off('transaction', updateTextColor);
        
        editorDom.removeEventListener('click', clickHandler);
        document.removeEventListener('click', handleOutsideClick);
      };
    }
  }, [editor, showLinkPopover, showImageDropdown]);



  if (!editor) {
    return null;
  }

  return (
    <div className="border border-[#e0e0e0] overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-[#e0e0e0] bg-[#f5f5f5] p-3 flex flex-wrap gap-2">
        {/* Paragraph & Heading */}
        <div className="relative">
          <select
            onChange={(e) => {
              const level = parseInt(e.target.value);
              if (level === 0) {
                editor.chain().focus().setParagraph().run();
              } else {
                editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run();
              }
            }}
            value={
              editor.isActive('heading', { level: 1 }) ? '1' :
              editor.isActive('heading', { level: 2 }) ? '2' :
              editor.isActive('heading', { level: 3 }) ? '3' :
              editor.isActive('heading', { level: 4 }) ? '4' :
              editor.isActive('heading', { level: 5 }) ? '5' :
              editor.isActive('heading', { level: 6 }) ? '6' : '0'
            }
            className="px-3 pr-10 py-2 h-10 border border-[#e0e0e0] bg-white text-[#333] text-xs tracking-[1px] uppercase focus:outline-none focus:border-[#333] transition-colors appearance-none cursor-pointer"
            title="Paragraph & Heading"
          >
            <option value="0">Paragraph</option>
            <option value="1">Heading 1</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
            <option value="4">Heading 4</option>
            <option value="5">Heading 5</option>
            <option value="6">Heading 6</option>
          </select>
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <ChevronDown size={16} className="text-[#333]" />
          </div>
        </div>

        {/* Undo/Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="px-3 py-2 border border-[#e0e0e0] bg-white text-[#333] text-xs tracking-[1px] uppercase hover:bg-[#f5f5f5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          title="Undo"
        >
          <Undo2 size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="px-3 py-2 border border-[#e0e0e0] bg-white text-[#333] text-xs tracking-[1px] uppercase hover:bg-[#f5f5f5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          title="Redo"
        >
          <Redo2 size={16} />
        </button>

        <div className="w-px h-8 bg-[#e0e0e0] mx-1" />

        {/* Bold, Italic, Strike, Underline */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-4 py-2 border border-[#e0e0e0] text-xs font-bold tracking-[1px] uppercase transition-colors ${
            editor.isActive('bold') ? 'bg-[#333] text-white border-[#333]' : 'bg-white text-[#333] hover:bg-[#f5f5f5]'
          }`}
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-4 py-2 border border-[#e0e0e0] text-xs italic tracking-[1px] uppercase transition-colors ${
            editor.isActive('italic') ? 'bg-[#333] text-white border-[#333]' : 'bg-white text-[#333] hover:bg-[#f5f5f5]'
          }`}
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`px-4 py-2 border border-[#e0e0e0] text-xs underline tracking-[1px] uppercase transition-colors ${
            editor.isActive('underline') ? 'bg-[#333] text-white border-[#333]' : 'bg-white text-[#333] hover:bg-[#f5f5f5]'
          }`}
          title="Underline"
        >
          U
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-4 py-2 border border-[#e0e0e0] text-xs line-through tracking-[1px] uppercase transition-colors ${
            editor.isActive('strike') ? 'bg-[#333] text-white border-[#333]' : 'bg-white text-[#333] hover:bg-[#f5f5f5]'
          }`}
          title="Strikethrough"
        >
          S
        </button>

        <div className="w-px h-8 bg-[#e0e0e0] mx-1" />

        {/* Subscript/Superscript */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          className={`px-4 py-2 border border-[#e0e0e0] text-xs tracking-[1px] uppercase transition-colors ${
            editor.isActive('subscript') ? 'bg-[#333] text-white border-[#333]' : 'bg-white text-[#333] hover:bg-[#f5f5f5]'
          }`}
          title="Subscript"
        >
          x₂
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          className={`px-4 py-2 border border-[#e0e0e0] text-xs tracking-[1px] uppercase transition-colors ${
            editor.isActive('superscript') ? 'bg-[#333] text-white border-[#333]' : 'bg-white text-[#333] hover:bg-[#f5f5f5]'
          }`}
          title="Superscript"
        >
          x²
        </button>

        <div className="w-px h-8 bg-[#e0e0e0] mx-1" />

        {/* Text Alignment */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`px-3 py-2 border border-[#e0e0e0] text-xs tracking-[1px] uppercase transition-colors flex items-center justify-center ${
            editor.isActive({ textAlign: 'left' }) ? 'bg-[#333] text-white border-[#333]' : 'bg-white text-[#333] hover:bg-[#f5f5f5]'
          }`}
          title="Align Left"
        >
          <AlignLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`px-3 py-2 border border-[#e0e0e0] text-xs tracking-[1px] uppercase transition-colors flex items-center justify-center ${
            editor.isActive({ textAlign: 'center' }) ? 'bg-[#333] text-white border-[#333]' : 'bg-white text-[#333] hover:bg-[#f5f5f5]'
          }`}
          title="Align Center"
        >
          <AlignCenter size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`px-3 py-2 border border-[#e0e0e0] text-xs tracking-[1px] uppercase transition-colors flex items-center justify-center ${
            editor.isActive({ textAlign: 'right' }) ? 'bg-[#333] text-white border-[#333]' : 'bg-white text-[#333] hover:bg-[#f5f5f5]'
          }`}
          title="Align Right"
        >
          <AlignRight size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`px-3 py-2 border border-[#e0e0e0] text-xs tracking-[1px] uppercase transition-colors flex items-center justify-center ${
            editor.isActive({ textAlign: 'justify' }) ? 'bg-[#333] text-white border-[#333]' : 'bg-white text-[#333] hover:bg-[#f5f5f5]'
          }`}
          title="Justify"
        >
          <AlignJustify size={16} />
        </button>

        {/* Lists */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-2 border border-[#e0e0e0] text-xs tracking-[1px] uppercase transition-colors flex items-center justify-center ${
            editor.isActive('bulletList') ? 'bg-[#333] text-white border-[#333]' : 'bg-white text-[#333] hover:bg-[#f5f5f5]'
          }`}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-2 border border-[#e0e0e0] text-xs tracking-[1px] uppercase transition-colors flex items-center justify-center ${
            editor.isActive('orderedList') ? 'bg-[#333] text-white border-[#333]' : 'bg-white text-[#333] hover:bg-[#f5f5f5]'
          }`}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>

        <div className="w-px h-8 bg-[#e0e0e0] mx-1" />

        {/* Link */}
        <button
          type="button"
          onClick={() => {
            const { from, to } = editor.state.selection;
            const selectedText = editor.state.doc.textBetween(from, to, ' ');
            const linkAttrs = editor.getAttributes('link');
            setLinkText(selectedText);
            setLinkUrl(linkAttrs.href || '');
            
            const { view } = editor;
            const startCoords = view.coordsAtPos(from);
            const endCoords = view.coordsAtPos(to);
            
            const editorDom = view.dom;
            const editorContentContainer = editorDom.closest('.ProseMirror')?.parentElement;
            
            if (editorContentContainer) {
              const containerRect = editorContentContainer.getBoundingClientRect();
              const spacing = 30;
              
              const left = startCoords.left - containerRect.left;
              const top = endCoords.bottom - containerRect.top + spacing;
              
              setLinkDialogPosition({ top, left });
            } else {
              setLinkDialogPosition(null);
            }
            
            setShowLinkDialog(true);
          }}
          className={`px-3 py-2 h-10 border border-[#e0e0e0] text-xs tracking-[1px] uppercase transition-colors flex items-center justify-center ${
            editor.isActive('link') ? 'bg-[#333] text-white border-[#333]' : 'bg-white text-[#333] hover:bg-[#f5f5f5]'
          }`}
          title="Insert Link"
        >
          <LinkIcon size={16} />
        </button>

        {showLinkDialog && !linkDialogPosition && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-9999" onClick={() => {
              setShowLinkDialog(false);
              setLinkText('');
              setLinkUrl('');
              setLinkDialogPosition(null);
            }}>
              <div className="bg-white rounded-lg shadow-xl p-6 w-[500px] mx-4" onClick={(e) => e.stopPropagation()}>
                <div className="mb-4">
                  <div className="relative">
                    <Menu size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={linkText}
                      onChange={(e) => setLinkText(e.target.value)}
                      placeholder="Text"
                      className="w-full pl-10 pr-4 py-2 border-2 border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="URL"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLinkDialog(false);
                      setLinkText('');
                      setLinkUrl('');
                      setLinkDialogPosition(null);
                      setLinkEditRange(null);
                    }}
                    className="px-4 py-2 text-gray-600 rounded hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (linkUrl) {
                        const { state } = editor;
                        const { selection } = state;
                        const { $from } = selection;
                        const node = $from.parent;
                        const currentAlign = node.attrs.textAlign || 'left';
                        
                        if (linkText) {
                          editor.chain()
                            .focus()
                            .insertContent(`<a href="${linkUrl}">${linkText}</a>`)
                            .setTextAlign(currentAlign)
                            .run();
                        } else {
                          editor.chain().focus().setLink({ href: linkUrl }).run();
                        }
                      }
                      setShowLinkDialog(false);
                      setLinkText('');
                      setLinkUrl('');
                      setLinkDialogPosition(null);
                      setLinkEditRange(null);
                    }}
                    className="px-4 py-2 text-blue-600 rounded hover:bg-blue-50 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
        )}


        {/* Image */}
        <div className="relative image-dropdown-container">
          <button
            type="button"
            onClick={() => setShowImageDropdown(!showImageDropdown)}
            className="px-3 py-2 h-10 border border-[#e0e0e0] text-xs tracking-[1px] uppercase transition-colors flex items-center justify-center bg-white text-[#333] hover:bg-[#f5f5f5]"
            title="Insert Image"
          >
            <ImageIcon size={16} />
          </button>
          
          {showImageDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-[#e0e0e0] shadow-lg z-50 min-w-[200px]">
              <button
                type="button"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/jpeg,image/jpg,image/png,image/webp,image/gif';
                  input.multiple = true;
                  input.onchange = async (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (!files || files.length === 0) return;
                    
                    setShowImageDropdown(false);
                    
                    // Upload files sequentially to avoid potential issues with concurrent uploads
                    const uploadedUrls: string[] = [];
                    for (const file of Array.from(files)) {
                      const formData = new FormData();
                      formData.append('file', file);
                      
                      try {
                        const response = await fetch('/api/upload', {
                          method: 'POST',
                          body: formData,
                        });
                        
                        const data = await response.json();
                        
                        if (data.success && data.url) {
                          uploadedUrls.push(data.url);
                        } else {
                          console.error('Failed to upload:', file.name, data.error);
                        }
                      } catch (error) {
                        console.error('Error uploading image:', file.name, error);
                      }
                    }
                    
                    if (uploadedUrls.length > 0) {
                      // Insert all images sequentially
                      // Insert each image one by one to ensure proper insertion
                      for (let i = 0; i < uploadedUrls.length; i++) {
                        const url = uploadedUrls[i];
                        const imageId = generateImageId();
                        
                        // Use transaction to insert image node directly with all attributes
                        // This ensures ID is properly set and preserved
                        editor.chain().focus().run();
                        
                        const { state, view } = editor;
                        const { schema } = state;
                        const { tr } = state;
                        const { from } = state.selection;
                        
                        // Create image node with all attributes including ID
                        const imageNode = schema.nodes.image.create({
                          src: url,
                          alt: '',
                          id: imageId,
                        });
                        
                        // Insert the node
                        tr.insert(from, imageNode);
                        view.dispatch(tr);
                        
                        // Small delay to ensure each image is processed
                        if (i < uploadedUrls.length - 1) {
                          await new Promise(resolve => setTimeout(resolve, 100));
                        }
                      }
                    } else {
                      alert('Failed to upload images');
                    }
                  };
                  input.click();
                }}
                className="w-full px-4 py-2 text-left text-sm text-[#333] hover:bg-[#f5f5f5] transition-colors flex items-center gap-2"
              >
                <Upload size={16} className="text-gray-600" />
                <span>Upload from computer</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const url = window.prompt('Enter image URL:');
                  if (url) {
                    const imageId = generateImageId();
                    
                    // Use transaction to insert image node directly with all attributes
                    // This ensures ID is properly set and preserved
                    editor.chain().focus().run();
                    
                    const { state, view } = editor;
                    const { schema } = state;
                    const { tr } = state;
                    const { from } = state.selection;
                    
                    // Create image node with all attributes including ID
                    const imageNode = schema.nodes.image.create({
                      src: url,
                      alt: '',
                      id: imageId,
                    });
                    
                    // Insert the node
                    tr.insert(from, imageNode);
                    view.dispatch(tr);
                  }
                  setShowImageDropdown(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-[#333] hover:bg-[#f5f5f5] transition-colors flex items-center gap-2 border-t border-[#e0e0e0]"
              >
                <Globe size={16} className="text-gray-600" />
                <span>Add image link</span>
              </button>
            </div>
          )}
        </div>

        {/* Image Layout */}
        <div className="relative">
          <button
            type="button"
            ref={(el) => setImageLayoutButtonRef(el)}
            onClick={(e) => {
              if (selectedImagePositions.length < 2) {
                alert(`Please select at least 2 images. Currently selected: ${selectedImagePositions.length} image(s).\n\nHow to select:\n1. Click on an image to select it\n2. Hold Ctrl/Cmd and click on more images to select multiple`);
                return;
              }
              
              if (e.currentTarget) {
                const rect = e.currentTarget.getBoundingClientRect();
                setImageLayoutDropdownPosition({
                  top: rect.bottom + 4,
                  left: rect.left,
                });
              }
              
              setShowImageLayoutDialog(!showImageLayoutDialog);
            }}
            disabled={selectedImagePositions.length < 2}
            className={`px-3 py-2 h-10 border border-[#e0e0e0] text-xs tracking-[1px] uppercase transition-colors flex items-center justify-center ${
              selectedImagePositions.length >= 2 
                ? 'bg-white text-[#333] hover:bg-[#f5f5f5] cursor-pointer' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            title={`Image Layout - ${selectedImagePositions.length} image(s) selected. Click images to select (Ctrl/Cmd + Click for multiple)`}
          >
            <Grid3x3 size={16} />
          </button>
        </div>

        {/* YouTube */}
        <button
          type="button"
          onClick={() => {
            const input = window.prompt('Enter YouTube URL or iframe embed HTML:');
            if (!input) {
              return;
            }

            const attrs = parseIframeInput(input);

            if (!attrs || !attrs.src) {
              alert('Could not parse YouTube URL or iframe embed code. Please check the input.');
              return;
            }

            // Ensure src is not null
            const nodeAttrs = { ...attrs, src: attrs.src || null };
            // @ts-expect-error - setIframe is a custom command from Iframe extension
            editor.chain().focus().setIframe(nodeAttrs).run();
          }}
          className="px-4 py-2 border border-[#e0e0e0] bg-white text-[#333] text-xs tracking-[1px] uppercase hover:bg-[#f5f5f5] transition-colors"
          title="Insert YouTube Video"
        >
          YouTube
        </button>

        {/* Font Family */}
        <div className="relative">
          <select
            onChange={(e) => {
              const fontFamily = e.target.value;
              if (fontFamily === 'default') {
                editor.chain().focus().unsetFontFamily().run();
              } else {
                editor.chain().focus().setFontFamily(fontFamily).run();
              }
            }}
            className="px-3 pr-10 py-2 h-10 border border-[#e0e0e0] bg-white text-[#333] text-xs tracking-[1px] uppercase focus:outline-none focus:border-[#333] transition-colors appearance-none cursor-pointer"
            title="Font Family"
          >
            <option value="default">Font</option>
            <option value="Arial">Arial</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
          </select>
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <ChevronDown size={16} className="text-[#333]" />
          </div>
        </div>

        {/* Font Size */}
        <div className="relative">
          <select
            onChange={(e) => {
              const fontSize = e.target.value;
              if (fontSize === 'default') {
                editor.chain().focus().unsetFontSize().run();
              } else {
                editor.chain().focus().setFontSize(fontSize).run();
              }
            }}
            className="px-3 pr-10 py-2 h-10 border border-[#e0e0e0] bg-white text-[#333] text-xs tracking-[1px] uppercase focus:outline-none focus:border-[#333] transition-colors appearance-none cursor-pointer"
            title="Font Size"
          >
            <option value="default">Size</option>
            <option value="10">10px</option>
            <option value="12">12px</option>
            <option value="14">14px</option>
            <option value="16">16px</option>
            <option value="18">18px</option>
            <option value="20">20px</option>
            <option value="24">24px</option>
            <option value="28">28px</option>
            <option value="32">32px</option>
            <option value="36">36px</option>
            <option value="48">48px</option>
          </select>
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <ChevronDown size={16} className="text-[#333]" />
          </div>
        </div>

        {/* Text Color */}
        <ColorPicker
          icon={<Type size={16} />}
          currentColor={textColor}
          onColorChange={(color) => {
            setTextColor(color);
            editor.chain().focus().setColor(color).run();
          }}
          isActive={editor.isActive('textStyle')}
          title="Text Color"
          defaultColor="#000000"
          showColorIndicator={true}
        />

        <div className="w-px h-8 bg-[#e0e0e0] mx-1" />

        {/* Highlight */}
        <ColorPicker
          icon={<Highlighter size={16} />}
          currentColor={highlightColor}
          onColorChange={(color) => {
            setHighlightColor(color);
            editor.chain().focus().toggleHighlight({ color }).run();
          }}
          onRemove={() => {
            editor.chain().focus().unsetHighlight().run();
            setHighlightColor('#ffffff');
          }}
          isActive={editor.isActive('highlight')}
          title="Highlight"
          defaultColor="#ffffff"
          showColorIndicator={true}
        />


        {/* Background Color */}
        <input
          type="color"
          onChange={(e) => {
            editor.chain().focus().setHighlight({ color: e.target.value }).run();
          }}
          className="w-12 h-10 border border-[#e0e0e0] cursor-pointer"
          title="Background Color"
        />

        <div className="w-px h-8 bg-[#e0e0e0] mx-1" />

        {/* Table */}
        <button
          type="button"
          onClick={() => {
            const rows = parseInt(window.prompt('Number of rows:', '3') || '3', 10);
            const cols = parseInt(window.prompt('Number of columns:', '3') || '3', 10);
            if (rows > 0 && cols > 0) {
              editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
            }
          }}
          className="px-4 py-2 border border-[#e0e0e0] bg-white text-[#333] text-xs tracking-[1px] uppercase hover:bg-[#f5f5f5] transition-colors"
          title="Insert Table"
        >
          Table
        </button>
        {editor.isActive('table') && (
          <>
            <button
              type="button"
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              className="px-3 py-2 border border-[#e0e0e0] bg-white text-[#333] text-xs tracking-[1px] uppercase hover:bg-[#f5f5f5] transition-colors"
              title="Add Column Before"
            >
              +Col
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              className="px-3 py-2 border border-[#e0e0e0] bg-white text-[#333] text-xs tracking-[1px] uppercase hover:bg-[#f5f5f5] transition-colors"
              title="Add Column After"
            >
              Col+
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteColumn().run()}
              className="px-3 py-2 border border-[#e0e0e0] bg-white text-[#333] text-xs tracking-[1px] uppercase hover:bg-[#f5f5f5] transition-colors"
              title="Delete Column"
            >
              -Col
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().addRowBefore().run()}
              className="px-3 py-2 border border-[#e0e0e0] bg-white text-[#333] text-xs tracking-[1px] uppercase hover:bg-[#f5f5f5] transition-colors"
              title="Add Row Before"
            >
              +Row
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().addRowAfter().run()}
              className="px-3 py-2 border border-[#e0e0e0] bg-white text-[#333] text-xs tracking-[1px] uppercase hover:bg-[#f5f5f5] transition-colors"
              title="Add Row After"
            >
              Row+
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteRow().run()}
              className="px-3 py-2 border border-[#e0e0e0] bg-white text-[#333] text-xs tracking-[1px] uppercase hover:bg-[#f5f5f5] transition-colors"
              title="Delete Row"
            >
              -Row
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteTable().run()}
              className="px-3 py-2 border border-[#e0e0e0] bg-white text-[#333] text-xs tracking-[1px] uppercase hover:bg-[#f5f5f5] transition-colors"
              title="Delete Table"
            >
              ×Table
            </button>
          </>
        )}

        <div className="w-px h-8 bg-[#e0e0e0] mx-1" />

        {/* Clear Formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          className="px-4 py-2 border border-[#e0e0e0] bg-white text-[#333] text-xs tracking-[1px] uppercase hover:bg-[#f5f5f5] transition-colors"
          title="Clear Formatting"
        >
          Clear
        </button>
      </div>

      {/* Editor Content */}
      <div className="bg-white min-h-[400px] max-h-[600px] p-6 relative overflow-y-auto">
        <EditorContent editor={editor} />
        
        {/* Image Toolbar */}
        {showImageToolbar && selectedImagePos !== null && selectedImageNode && imageToolbarPos && (
          <ImageToolbar
            editor={editor}
            imagePos={selectedImagePos}
            imageNode={selectedImageNode}
            position={imageToolbarPos}
            onClose={() => {
              setShowImageToolbar(false);
              setSelectedImagePos(null);
              setSelectedImageNode(null);
            }}
            onEditAltText={() => {
              // Calculate position based on image position
              if (selectedImagePos !== null && imageToolbarPos) {
                // Position dialog below the toolbar
                setImageAltDialogPosition({
                  top: imageToolbarPos.top + 50,
                  left: imageToolbarPos.left,
                });
              }
              setShowImageAltDialog(true);
              setShowImageToolbar(false);
            }}
            onEditCaption={() => {
              // Calculate position based on image position
              if (selectedImagePos !== null && imageToolbarPos) {
                // Position dialog below the toolbar
                setImageCaptionDialogPosition({
                  top: imageToolbarPos.top + 50,
                  left: imageToolbarPos.left,
                });
              }
              setShowImageCaptionDialog(true);
              setShowImageToolbar(false);
            }}
            onEditLink={() => {
              // Calculate position based on image position
              if (selectedImagePos !== null && imageToolbarPos) {
                // Position dialog below the toolbar
                setImageLinkDialogPosition({
                  top: imageToolbarPos.top + 50,
                  left: imageToolbarPos.left,
                });
              }
              setShowImageLinkDialog(true);
              setShowImageToolbar(false);
            }}
            onReplace={() => {
              // Calculate position based on image position
              if (selectedImagePos !== null && imageToolbarPos) {
                // Position dialog below the toolbar
                setImageReplaceDialogPosition({
                  top: imageToolbarPos.top + 50,
                  left: imageToolbarPos.left,
                });
              }
              setShowImageReplaceDialog(true);
              setShowImageToolbar(false);
            }}
          />
        )}

        {/* Image Alt Text Dialog */}
        {showImageAltDialog && selectedImagePos !== null && selectedImageNode && imageAltDialogPosition && (
          <div 
            className="absolute bg-white rounded-lg shadow-xl p-6 w-[500px] z-50 image-alt-dialog"
            style={{
              top: `${imageAltDialogPosition.top}px`,
              left: `${imageAltDialogPosition.left}px`,
            }}
          >
              <h3 className="text-lg font-semibold mb-4">Edit Alt Text</h3>
              <input
                type="text"
                defaultValue={(selectedImageNode.attrs.alt as string) || ''}
                placeholder="Enter alt text for accessibility"
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const { tr } = editor.state;
                    const attrs = { ...selectedImageNode.attrs, alt: (e.target as HTMLInputElement).value };
                    tr.setNodeMarkup(selectedImagePos, undefined, attrs);
                    editor.view.dispatch(tr);
                    setShowImageAltDialog(false);
                  } else if (e.key === 'Escape') {
                    setShowImageAltDialog(false);
                    setImageAltDialogPosition(null);
                  }
                }}
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowImageAltDialog(false);
                    setImageAltDialogPosition(null);
                  }}
                  className="px-4 py-2 text-gray-600 rounded hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const input = document.querySelector('.image-alt-dialog input') as HTMLInputElement;
                    if (input) {
                      const { tr } = editor.state;
                      const attrs = { ...selectedImageNode.attrs, alt: input.value };
                      tr.setNodeMarkup(selectedImagePos, undefined, attrs);
                      editor.view.dispatch(tr);
                    }
                    setShowImageAltDialog(false);
                    setImageAltDialogPosition(null);
                  }}
                  className="px-4 py-2 text-blue-600 rounded hover:bg-blue-50 transition-colors"
                >
                  Apply
                </button>
              </div>
          </div>
        )}

        {/* Image Caption Dialog */}
        {showImageCaptionDialog && selectedImagePos !== null && selectedImageNode && imageCaptionDialogPosition && (
          <div 
            className="absolute bg-white rounded-lg shadow-xl p-6 w-[500px] z-50 image-caption-dialog"
            style={{
              top: `${imageCaptionDialogPosition.top}px`,
              left: `${imageCaptionDialogPosition.left}px`,
            }}
          >
              <h3 className="text-lg font-semibold mb-4">Edit Caption</h3>
              <textarea
                defaultValue={(selectedImageNode.attrs.caption as string) || ''}
                placeholder="Enter caption for the image"
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
                autoFocus
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowImageCaptionDialog(false);
                    setImageCaptionDialogPosition(null);
                  }}
                  className="px-4 py-2 text-gray-600 rounded hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const textarea = document.querySelector('.image-caption-dialog textarea') as HTMLTextAreaElement;
                    if (textarea) {
                      const { tr } = editor.state;
                      const attrs = { ...selectedImageNode.attrs, caption: textarea.value };
                      tr.setNodeMarkup(selectedImagePos, undefined, attrs);
                      editor.view.dispatch(tr);
                    }
                    setShowImageCaptionDialog(false);
                    setImageCaptionDialogPosition(null);
                  }}
                  className="px-4 py-2 text-blue-600 rounded hover:bg-blue-50 transition-colors"
                >
                  Apply
                </button>
              </div>
          </div>
        )}

        {/* Image Link Dialog */}
        {showImageLinkDialog && selectedImagePos !== null && selectedImageNode && imageLinkDialogPosition && (
          <div 
            className="absolute bg-white rounded-lg shadow-xl p-6 w-[500px] z-50 image-link-dialog"
            style={{
              top: `${imageLinkDialogPosition.top}px`,
              left: `${imageLinkDialogPosition.left}px`,
            }}
          >
              <h3 className="text-lg font-semibold mb-4">Edit Image Link</h3>
              <input
                type="text"
                defaultValue={(selectedImageNode.attrs.href as string) || ''}
                placeholder="Enter URL (leave empty to remove link)"
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const { tr } = editor.state;
                    const href = (e.target as HTMLInputElement).value.trim() || null;
                    const attrs = { ...selectedImageNode.attrs, href };
                    tr.setNodeMarkup(selectedImagePos, undefined, attrs);
                    editor.view.dispatch(tr);
                    setShowImageLinkDialog(false);
                  } else if (e.key === 'Escape') {
                    setShowImageLinkDialog(false);
                    setImageLinkDialogPosition(null);
                  }
                }}
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowImageLinkDialog(false);
                    setImageLinkDialogPosition(null);
                  }}
                  className="px-4 py-2 text-gray-600 rounded hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const input = document.querySelector('.image-link-dialog input') as HTMLInputElement;
                    if (input) {
                      const { tr } = editor.state;
                      const href = input.value.trim() || null;
                      const attrs = { ...selectedImageNode.attrs, href };
                      tr.setNodeMarkup(selectedImagePos, undefined, attrs);
                      editor.view.dispatch(tr);
                    }
                    setShowImageLinkDialog(false);
                    setImageLinkDialogPosition(null);
                  }}
                  className="px-4 py-2 text-blue-600 rounded hover:bg-blue-50 transition-colors"
                >
                  Apply
                </button>
              </div>
          </div>
        )}

        {/* Image Replace Dialog */}
        {showImageReplaceDialog && selectedImagePos !== null && selectedImageNode && imageReplaceDialogPosition && (
          <div 
            className="absolute bg-white rounded-lg shadow-xl p-6 w-[500px] z-50 image-replace-dialog"
            style={{
              top: `${imageReplaceDialogPosition.top}px`,
              left: `${imageReplaceDialogPosition.left}px`,
            }}
          >
              <h3 className="text-lg font-semibold mb-4">Replace Image</h3>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/jpeg,image/jpg,image/png,image/webp,image/gif';
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (!file) return;
                      
                      const formData = new FormData();
                      formData.append('file', file);
                      
                      try {
                        const response = await fetch('/api/upload', {
                          method: 'POST',
                          body: formData,
                        });
                        
                        const data = await response.json();
                        
                        if (data.success && data.url) {
                          const { tr } = editor.state;
                          const attrs = { ...selectedImageNode.attrs, src: data.url };
                          tr.setNodeMarkup(selectedImagePos, undefined, attrs);
                          editor.view.dispatch(tr);
                          setShowImageReplaceDialog(false);
                          setImageReplaceDialogPosition(null);
                        } else {
                          alert('Failed to upload image');
                        }
                      } catch (error) {
                        console.error('Error uploading image:', error);
                        alert('Error uploading image');
                      }
                    };
                    input.click();
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Upload size={16} />
                  <span>Upload from computer</span>
                </button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">OR</span>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Enter image URL"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const url = (e.target as HTMLInputElement).value.trim();
                      if (url) {
                        const { tr } = editor.state;
                        const attrs = { ...selectedImageNode.attrs, src: url };
                        tr.setNodeMarkup(selectedImagePos, undefined, attrs);
                        editor.view.dispatch(tr);
                        setShowImageReplaceDialog(false);
                        setImageReplaceDialogPosition(null);
                      }
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowImageReplaceDialog(false);
                    setImageReplaceDialogPosition(null);
                  }}
                  className="px-4 py-2 text-gray-600 rounded hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
          </div>
        )}
        
        {/* Link Popover */}
        {showLinkPopover && linkPopoverUrl && (
          <div 
            className="link-popover absolute bg-white rounded-lg shadow-lg z-50"
            style={{
              top: `${linkPopoverPosition.top}px`,
              left: `${linkPopoverPosition.left}px`,
              minWidth: '320px',
            }}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <div className="w-5 h-5 rounded-full bg-gray-200 shrink-0"></div>
              <div className="flex-1 min-w-0">
                <a
                  href={linkPopoverUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 truncate hover:underline cursor-pointer block"
                  title={linkPopoverUrl}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  {linkPopoverUrl.length > 35 ? `${linkPopoverUrl.substring(0, 35)}...` : linkPopoverUrl}
                </a>
              </div>
            </div>
            <div className="flex items-center gap-1 px-2 py-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(linkPopoverUrl);
                  setShowLinkPopover(false);
                }}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Copy link"
              >
                <Copy size={18} className="text-gray-600" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const { state } = editor;
                  const { selection } = state;
                  
                  const linkMark = selection.$from.marks().find(mark => mark.type.name === 'link') ||
                                  state.storedMarks?.find(mark => mark.type.name === 'link');
                  
                  if (linkMark) {
                    let linkFrom = selection.from;
                    let linkTo = selection.to;
                    
                    let $pos = state.doc.resolve(selection.from);
                    while ($pos.pos > 0) {
                      const prevPos = $pos.pos - 1;
                      const $prevPos = state.doc.resolve(prevPos);
                      const prevMarks = $prevPos.marks();
                      const hasSameLink = prevMarks.find(m => 
                        m.type.name === 'link' && m.attrs.href === linkMark.attrs.href
                      );
                      if (!hasSameLink) break;
                      linkFrom = prevPos;
                      $pos = $prevPos;
                    }
                    
                    $pos = state.doc.resolve(selection.to);
                    while ($pos.pos < state.doc.content.size) {
                      const nextPos = $pos.pos + 1;
                      if (nextPos > state.doc.content.size) break;
                      const $nextPos = state.doc.resolve(nextPos);
                      const nextMarks = $nextPos.marks();
                      const hasSameLink = nextMarks.find(m => 
                        m.type.name === 'link' && m.attrs.href === linkMark.attrs.href
                      );
                      if (!hasSameLink) break;
                      linkTo = nextPos;
                      $pos = $nextPos;
                    }
                    
                    const selectedText = editor.state.doc.textBetween(linkFrom, linkTo, ' ');
                    setLinkText(selectedText);
                    setLinkUrl(linkPopoverUrl);
                    setLinkDialogPosition(linkPopoverPosition);
                    setLinkEditRange({ from: linkFrom, to: linkTo });
                    setShowLinkPopover(false);
                    setShowLinkDialog(true);
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Edit link"
              >
                <Pencil size={18} className="text-gray-600" />
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetLink().run();
                  setShowLinkPopover(false);
                }}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Remove link"
              >
                <Unlink size={18} className="text-gray-600" />
              </button>
            </div>
          </div>
        )}

        
        {showLinkDialog && linkDialogPosition && (
          <div 
            className="absolute bg-white rounded-lg shadow-xl p-6 w-[500px] z-50"
            style={{
              top: `${linkDialogPosition.top}px`,
              left: `${linkDialogPosition.left}px`,
            }}
          >
            <div className="mb-4">
              <div className="relative">
                <Menu size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Text"
                  className="w-full pl-10 pr-4 py-2 border-2 border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>
            <div className="mb-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="URL"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowLinkDialog(false);
                  setLinkText('');
                  setLinkUrl('');
                  setLinkDialogPosition(null);
                }}
                className="px-4 py-2 text-gray-600 rounded hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (linkUrl) {
                    // Preserve text alignment before inserting link
                    const { state } = editor;
                    const { selection } = state;
                    const { $from } = selection;
                    const node = $from.parent;
                    const currentAlign = node.attrs.textAlign || 'left';
                    
                    if (linkEditRange) {
                      // Edit existing link: replace the entire link with new text and URL
                      const { from, to } = linkEditRange;
                      
                      // Get alignment from the node at the selection
                      const nodeAtPos = state.doc.nodeAt(from);
                      const alignFromNode = nodeAtPos?.attrs?.textAlign || 
                                          state.doc.resolve(from).parent.attrs.textAlign || 
                                          'left';
                      
                      // Replace the entire link range with new link
                      editor.chain()
                        .focus()
                        .setTextSelection({ from, to })
                        .deleteSelection()
                        .insertContent(`<a href="${linkUrl}">${linkText || linkUrl}</a>`)
                        .setTextAlign(alignFromNode)
                        .run();
                    } else if (linkText) {
                      editor.chain()
                        .focus()
                        .insertContent(`<a href="${linkUrl}">${linkText}</a>`)
                        .setTextAlign(currentAlign)
                        .run();
                    } else {
                      editor.chain().focus().setLink({ href: linkUrl }).run();
                    }
                  }
                  setShowLinkDialog(false);
                  setLinkText('');
                  setLinkUrl('');
                  setLinkDialogPosition(null);
                  setLinkEditRange(null);
                }}
                className="px-4 py-2 text-blue-600 rounded hover:bg-blue-50 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Image Layout Dropdown */}
      {showImageLayoutDialog && selectedImagePositions.length >= 2 && imageLayoutDropdownPosition && (
        <div 
          className="image-layout-dropdown fixed bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 min-w-[280px]"
          style={{
            top: `${imageLayoutDropdownPosition.top}px`,
            left: `${imageLayoutDropdownPosition.left}px`,
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-sm font-semibold mb-3">Choose Image Layout</h3>
          <div className="space-y-2">
            <div className="border border-gray-200 rounded p-3 hover:border-blue-500 transition-colors">
              <button
                type="button"
                onClick={() => {
                  const { doc, tr, schema } = editor.state;
                  
                  const images: Array<{ pos: number; node: PMNode }> = [];
                  selectedImagePositions.forEach(pos => {
                    const node = doc.nodeAt(pos);
                    if (node && node.type.name === 'image') {
                      images.push({ pos, node });
                    }
                  });
                  
                  if (images.length >= 2) {
                    images.sort((a, b) => a.pos - b.pos);
                    const imageNodes = images.map(img => img.node);
                    const firstPos = images[0].pos;
                    
                    images.reverse().forEach((img) => {
                      tr.delete(img.pos, img.pos + img.node.nodeSize);
                    });
                    
                    const fragment = Fragment.from(imageNodes);
                    const columnsValue = gridColumns || 2;
                    console.log('Creating grid layout with columns:', columnsValue, 'images:', images.length);
                    const galleryNode = schema.nodes.imageGallery.create(
                      {
                        layout: 'grid',
                        columns: columnsValue,
                        gap: '1rem',
                      },
                      fragment
                    );
                    
                    tr.insert(firstPos, galleryNode);
                    editor.view.dispatch(tr);
                    
                    setSelectedImagePositions([]);
                    setShowImageLayoutDialog(false);
                  } else {
                    alert(`Error: Only found ${images.length} image(s). Please try selecting again.`);
                  }
                }}
                className="w-full text-left"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Grid3x3 size={20} className="text-gray-600" />
                  <div className="font-semibold text-sm">Grid Layout</div>
                </div>
                <div className="text-xs text-gray-500 mb-2">Arrange images in a grid</div>
                <div className="flex items-center gap-3 mt-2">
                  <label className="text-xs text-gray-600 flex items-center gap-1">
                    Rows:
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={gridRows}
                      onChange={(e) => {
                        e.stopPropagation();
                        setGridRows(parseInt(e.target.value) || 1);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      className="w-12 px-1 py-0.5 border border-gray-300 rounded text-xs"
                    />
                  </label>
                  <label className="text-xs text-gray-600 flex items-center gap-1">
                    Columns:
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={gridColumns}
                      onChange={(e) => {
                        e.stopPropagation();
                        setGridColumns(parseInt(e.target.value) || 1);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      className="w-12 px-1 py-0.5 border border-gray-300 rounded text-xs"
                    />
                  </label>
                </div>
              </button>
            </div>
            
            <button
              type="button"
              onClick={() => {
                const { doc, tr, schema } = editor.state;
                
                const images: Array<{ pos: number; node: PMNode }> = [];
                selectedImagePositions.forEach(pos => {
                  const node = doc.nodeAt(pos);
                  if (node && node.type.name === 'image') {
                    images.push({ pos, node });
                  }
                });
                
                if (images.length >= 2) {
                  images.sort((a, b) => a.pos - b.pos);
                  const imageNodes = images.map(img => img.node);
                  const firstPos = images[0].pos;
                  
                  images.reverse().forEach((img) => {
                    tr.delete(img.pos, img.pos + img.node.nodeSize);
                  });
                  
                  const fragment = Fragment.from(imageNodes);
                  const galleryNode = schema.nodes.imageGallery.create(
                    {
                      layout: 'masonry',
                      gap: '1rem',
                    },
                    fragment
                  );
                  
                  tr.insert(firstPos, galleryNode);
                  editor.view.dispatch(tr);
                  
                  setSelectedImagePositions([]);
                  setShowImageLayoutDialog(false);
                } else {
                  alert(`Error: Only found ${images.length} image(s). Please try selecting again.`);
                }
              }}
              className="w-full text-left p-3 border border-gray-200 rounded hover:border-blue-500 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <LayoutGrid size={20} className="text-gray-600" />
                <div className="font-semibold text-sm">Masonry Layout</div>
              </div>
              <div className="text-xs text-gray-500">Pinterest-style layout</div>
            </button>
            
            <button
              type="button"
              onClick={() => {
                const { doc, tr, schema } = editor.state;
                
                const images: Array<{ pos: number; node: PMNode }> = [];
                selectedImagePositions.forEach(pos => {
                  const node = doc.nodeAt(pos);
                  if (node && node.type.name === 'image') {
                    images.push({ pos, node });
                  }
                });
                
                if (images.length >= 2) {
                  images.sort((a, b) => a.pos - b.pos);
                  const imageNodes = images.map(img => img.node);
                  const firstPos = images[0].pos;
                  
                  images.reverse().forEach((img) => {
                    tr.delete(img.pos, img.pos + img.node.nodeSize);
                  });
                  
                  const fragment = Fragment.from(imageNodes);
                  const galleryNode = schema.nodes.imageGallery.create(
                    {
                      layout: 'sidebyside',
                      gap: '1rem',
                    },
                    fragment
                  );
                  
                  tr.insert(firstPos, galleryNode);
                  editor.view.dispatch(tr);
                  
                  setSelectedImagePositions([]);
                  setShowImageLayoutDialog(false);
                } else {
                  alert(`Error: Only found ${images.length} image(s). Please try selecting again.`);
                }
              }}
              className="w-full text-left p-3 border border-gray-200 rounded hover:border-blue-500 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <Columns size={20} className="text-gray-600" />
                <div className="font-semibold text-sm">Side by Side</div>
              </div>
              <div className="text-xs text-gray-500">Images in a row</div>
            </button>
            
            <button
              type="button"
              onClick={() => {
                const { doc, tr, schema } = editor.state;
                
                const images: Array<{ pos: number; node: PMNode }> = [];
                selectedImagePositions.forEach(pos => {
                  const node = doc.nodeAt(pos);
                  if (node && node.type.name === 'image') {
                    images.push({ pos, node });
                  }
                });
                
                if (images.length >= 2) {
                  images.sort((a, b) => a.pos - b.pos);
                  const imageNodes = images.map(img => img.node);
                  const firstPos = images[0].pos;
                  
                  images.reverse().forEach((img) => {
                    tr.delete(img.pos, img.pos + img.node.nodeSize);
                  });
                  
                  const fragment = Fragment.from(imageNodes);
                  const galleryNode = schema.nodes.imageGallery.create(
                    {
                      layout: 'stacked',
                      gap: '1rem',
                    },
                    fragment
                  );
                  
                  tr.insert(firstPos, galleryNode);
                  editor.view.dispatch(tr);
                  
                  setSelectedImagePositions([]);
                  setShowImageLayoutDialog(false);
                } else {
                  alert(`Error: Only found ${images.length} image(s). Please try selecting again.`);
                }
              }}
              className="w-full text-left p-3 border border-gray-200 rounded hover:border-blue-500 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <List size={20} className="text-gray-600" />
                <div className="font-semibold text-sm">Stacked</div>
              </div>
              <div className="text-xs text-gray-500">Images stacked vertically</div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

