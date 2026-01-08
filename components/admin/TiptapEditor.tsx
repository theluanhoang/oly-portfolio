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
import { X, ChevronDown, Menu, Search, Copy, Pencil, Unlink, Image as ImageIcon, Upload, Globe, Grid3x3, LayoutGrid, Columns } from 'lucide-react';
import { tiptapIcons } from './tiptapIcons';
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

// Global drag state to track if any image is being dragged
// This allows wheel events to check drag state even from different node view instances
const globalImageDragState: { isActive: boolean; nodeId: string | null } = {
  isActive: false,
  nodeId: null,
};

// Global wheel handler to avoid multiple registrations
let globalWheelHandler: ((e: WheelEvent) => void) | null = null;
let wheelHandlerRegistered = false;

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
    return {
      backgroundColor: 'white',
      borderColor: 'transparent',
    };
  };

  const getIconStyle = () => {
    return {};
  };

  const getIconClassName = () => {
    return isActive ? 'text-[#111]' : 'text-[#555]';
  };

  return (
    <div className="relative color-picker-container">
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="px-3 py-2 h-10 text-xs tracking-[1px] uppercase transition-colors flex items-center justify-center relative"
        title={title}
        style={getButtonStyle()}
      >
        <span className={getIconClassName()} style={getIconStyle()}>
          {icon}
        </span>
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
    
    // Handle alignment - using text-align approach like reactjs-tiptap-editor
    if (align === 'full') {
      wrapperStyle += ' width: 100%; display: block;';
      wrapperClass += ' image-align-full';
    } else if (align === 'center') {
      wrapperStyle += ' display: block; text-align: center;';
      wrapperClass += ' image-align-center';
    } else if (align === 'left') {
      wrapperStyle += ' display: block; text-align: left;';
      wrapperClass += ' image-align-left';
    } else if (align === 'right') {
      wrapperStyle += ' display: block; text-align: right;';
      wrapperClass += ' image-align-right';
    } else if (align === 'float-left') {
      wrapperStyle += ' float: left; margin-right: 1em;';
      wrapperClass += ' image-align-float-left';
    } else if (align === 'float-right') {
      wrapperStyle += ' float: right; margin-left: 1em;';
      wrapperClass += ' image-align-float-right';
    }
    
    // Build img attributes, ensuring id is included
    // Don't set display here - let CSS handle it (like reactjs-tiptap-editor)
    const imgAttrs: Record<string, unknown> = {
      ...HTMLAttributes,
      style: `max-width: 100%; height: auto; ${HTMLAttributes.width ? `width: ${HTMLAttributes.width}px;` : ''} ${HTMLAttributes.height ? `height: ${HTMLAttributes.height}px;` : ''}`,
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
      'div',
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
      // Disable native HTML5 drag behaviour – we'll implement our own drag/reorder logic
      img.draggable = false;
      // Guard: if browser still fires dragstart, prevent it to avoid native ghost preview
      const preventNativeDrag = (ev: DragEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        return false;
      };
      img.addEventListener('dragstart', preventNativeDrag);
      dom.addEventListener('dragstart', preventNativeDrag);
      
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
      let captionEl: HTMLElement | null = null;
      if (caption) {
        captionEl = document.createElement('div');
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
      let resizeHandle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null = null;
      let startX = 0;
      let startY = 0;
      let startWidth = 0;
      let startHeight = 0;
      let wasCtrlClick: boolean = false;
      // Custom drag state for image reordering (mouse-based, not HTML5 drag & drop)
      let isImageDragging = false;
      let dragStartPos: number | null = null;
      let dragLastClientX = 0;
      let dragLastClientY = 0;
      let dropIndicatorEl: HTMLElement | null = null;

      // Helpers to clean up drag preview when native drag/drop fires unexpectedly
      const handleNativeDrop = () => {
        removeDragPreview();
        if (img) {
          img.style.opacity = '';
          img.style.cursor = '';
        }
        isImageDragging = false;
        dragStartPos = null;
      };

      const handleNativeDragEnd = () => {
        removeDragPreview();
        if (img) {
          img.style.opacity = '';
          img.style.cursor = '';
        }
        isImageDragging = false;
        dragStartPos = null;
      };

      const showDropIndicator = (insertPos: number) => {
        const pmContainer = view.dom.closest('.ProseMirror')?.parentElement as HTMLElement | null;
        if (!pmContainer) return;
        const containerPosition = window.getComputedStyle(pmContainer).position;
        if (containerPosition === 'static') {
          pmContainer.style.position = 'relative';
        }
        let coords: { left: number; right: number; top: number; bottom: number };
        try {
          coords = view.coordsAtPos(insertPos);
        } catch {
          return;
        }
        const rect = pmContainer.getBoundingClientRect();
        if (!dropIndicatorEl) {
          const el = document.createElement('div');
          el.className = 'tiptap-drop-indicator';
          el.style.position = 'absolute';
          el.style.height = '2px';
          el.style.background = '#3b82f6';
          el.style.boxShadow = '0 0 8px rgba(59,130,246,0.6)';
          el.style.zIndex = '10000';
          dropIndicatorEl = el;
          pmContainer.appendChild(el);
        }
        const relativeTop = coords.top - rect.top + pmContainer.scrollTop;
        dropIndicatorEl.style.left = '0px';
        dropIndicatorEl.style.width = '100%';
        dropIndicatorEl.style.top = `${relativeTop}px`;
      };

      const hideDropIndicator = () => {
        if (dropIndicatorEl) {
          dropIndicatorEl.remove();
          dropIndicatorEl = null;
        }
      };

      // Legacy drag/drop state used by the older HTML5 drag implementation.
      // These are kept so that the remaining helper functions compile,
      // but the native drag behaviour is disabled via `img.draggable = false`.
      type DragState = {
        isActive: boolean;
        startPos: number;
        node: PMNode;
        nodeSize: number;
        nodeId: string;
        startTime: number;
        pendingInsertPos: number | null;
        lastMovedToPos: number | null;
      };

      let dragState: DragState | null = null;
      let dragPreviewElement: HTMLElement | null = null;
      let lastMouseEvent: MouseEvent | null = null;

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
        
        const currentAlign = node.attrs.align;
        if (currentAlign !== 'left' && currentAlign !== 'center' && currentAlign !== 'right' && currentAlign !== 'full') {
          dom.style.width = `${newWidth}px`;
        }
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

      // Helper to move the image node from its original position to the position
      // closest to the given client coordinates.
      const moveImageNode = (fromPos: number, clientX: number, clientY: number) => {
        const { state, dispatch } = view;
        const { doc } = state;

        const node = doc.nodeAt(fromPos);
        if (!node || node.type.name !== 'image') {
          return;
        }

        const nodeId = node.attrs.id;
        if (!nodeId) {
          return;
        }

        // Get target position from coordinates
        const coords = view.posAtCoords({ left: clientX, top: clientY });
        if (!coords) {
          return;
        }

        const targetPos = coords.pos;
        const nodeSize = node.nodeSize;
        const fromEnd = fromPos + nodeSize;

        // Create a temporary drag state for findInsertPosition
        const tempDragState: DragState = {
          isActive: true,
          startPos: fromPos,
          node: node,
          nodeSize: nodeSize,
          nodeId: nodeId,
          startTime: Date.now(),
          pendingInsertPos: null,
          lastMovedToPos: null,
        };

        // Use the sophisticated findInsertPosition logic to find the best insert position
        const insertPos = findInsertPosition(targetPos, tempDragState, doc);
        
        if (insertPos === null) {
          return; // Cannot find valid insert position
        }

        if (insertPos === fromPos) {
          return; // Same position, no need to move
        }

        const tr = state.tr;

        // Remove the node from its original position first
        tr.delete(fromPos, fromEnd);

        // After deletion, positions after the deleted range shift left
        let finalInsertPos = insertPos;
        if (finalInsertPos > fromPos) {
          finalInsertPos -= nodeSize;
        }

        // Clamp target position to valid range
        if (finalInsertPos < 0) {
          finalInsertPos = 0;
        }
        if (finalInsertPos > tr.doc.content.size) {
          finalInsertPos = tr.doc.content.size;
        }

        // Verify the position is still valid after deletion
        try {
          const $insertPos = tr.doc.resolve(finalInsertPos);
          const parent = $insertPos.parent;
          const index = $insertPos.index();
          
          if (!parent.canReplace(index, index, Fragment.from(node))) {
            return; // Cannot insert at this position
          }
        } catch {
          return; // Invalid position
        }

        // Create and insert the new node
        const newNode = node.type.create(node.attrs, node.content);
        tr.insert(finalInsertPos, newNode);

        // Try to keep selection on the moved image
        const newDoc = tr.doc;
        const movedNode = newDoc.nodeAt(finalInsertPos);
        if (movedNode && movedNode.type.name === 'image' && movedNode.attrs.id === nodeId) {
          tr.setSelection(
            TextSelection.create(newDoc, finalInsertPos, finalInsertPos + movedNode.nodeSize)
          );
        }

        dispatch(tr);
      };

      const handleImageMouseDown = (e: MouseEvent) => {
        if (e.target === img && !isResizing) {
          const pos = getPos();
          if (typeof pos === 'number') {
            let hasExceededThreshold = false;
            const startClientX = e.clientX;
            const startClientY = e.clientY;
            const DRAG_THRESHOLD = 5;

            wasCtrlClick = e.ctrlKey || e.metaKey;
            isImageDragging = false;
            dragStartPos = null;

            const handleMouseMove = (moveEvent: MouseEvent) => {
              const deltaX = Math.abs(moveEvent.clientX - startClientX);
              const deltaY = Math.abs(moveEvent.clientY - startClientY);
              if (!hasExceededThreshold && (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD)) {
                hasExceededThreshold = true;
                isImageDragging = true;
                dragStartPos = pos;
                
                // Create drag preview when drag starts
                if (!dragPreviewElement) {
                  createDragPreview();
                }
                
                // Make original image semi-transparent during drag
                img.style.opacity = '0.5';
                img.style.cursor = 'grabbing';
              }

              if (isImageDragging) {
                dragLastClientX = moveEvent.clientX;
                dragLastClientY = moveEvent.clientY;
                
                // Update drag preview position
                if (dragPreviewElement) {
                  updateDragPreviewPosition(moveEvent);
                }

                // Update drop indicator using current insert position guess
                const coords = view.posAtCoords({ left: moveEvent.clientX, top: moveEvent.clientY });
                if (!coords || dragStartPos === null) {
                  hideDropIndicator();
                } else {
                  const { doc } = view.state;
                  const node = doc.nodeAt(dragStartPos);
                  if (!node || node.type.name !== 'image') {
                    hideDropIndicator();
                  } else {
                    const tempState: DragState = {
                      isActive: true,
                      startPos: dragStartPos,
                      node,
                      nodeSize: node.nodeSize,
                      nodeId: node.attrs.id,
                      startTime: Date.now(),
                      pendingInsertPos: null,
                      lastMovedToPos: null,
                    };
                    const insertPos = findInsertPosition(coords.pos, tempState, doc);
                    if (insertPos !== null) {
                      showDropIndicator(insertPos);
                    } else {
                      hideDropIndicator();
                    }
                  }
                }
              }
            };

            const handleMouseUp = (upEvent: MouseEvent) => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
              document.removeEventListener('drop', handleNativeDrop);
              document.removeEventListener('dragend', handleNativeDragEnd);

              // Remove drag preview and restore image opacity
              removeDragPreview();
              hideDropIndicator();
              if (img) {
                img.style.opacity = '';
                img.style.cursor = '';
              }

              if (isImageDragging && dragStartPos !== null) {
                // Perform the actual move
                moveImageNode(dragStartPos, dragLastClientX || upEvent.clientX, dragLastClientY || upEvent.clientY);
                isImageDragging = false;
                dragStartPos = null;
                // Prevent default behavior after drag
                upEvent.preventDefault();
                upEvent.stopPropagation();
                return;
              }

              // Treat as a normal click/select when not dragging
              // Only prevent default if this was a click (not a drag)
              if (!hasExceededThreshold) {
                upEvent.preventDefault();
                upEvent.stopPropagation();

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

                if (wasCtrlClick) {
                  const event = new CustomEvent('toggleImageSelection', { detail: { pos, mouseX: e.clientX, mouseY: e.clientY } });
                  document.dispatchEvent(event);
                } else {
                  const event = new CustomEvent('selectImage', { detail: { pos, mouseX: e.clientX, mouseY: e.clientY, isMultiSelect: false } });
                  document.dispatchEvent(event);
                }
              }
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            // In case the browser still fires native drag/drop events, clean up preview
            document.addEventListener('drop', handleNativeDrop);
            document.addEventListener('dragend', handleNativeDragEnd);
          }
        }
      };

      img.addEventListener('mousedown', handleImageMouseDown);

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
      const MOVE_THROTTLE = 8; // Reduced for smoother updates
      let rafId: number | null = null;

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

      const updateDragPreviewPosition = (e: MouseEvent | DragEvent) => {
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

      let cachedImageNodes: Array<{ pos: number; size: number }> | null = null;
      let cachedDocSize = 0;
      let cachedNodeId: string | null = null;
      
      const findInsertPosition = (
        targetPos: number,
        dragState: DragState,
        doc: PMNode
      ): number | null => {
        try {
          const clampedPos = Math.max(0, Math.min(targetPos, doc.content.size));
          
          const { startPos, nodeSize } = dragState;
          const nodeStart = startPos;
          const nodeEnd = startPos + nodeSize;
          
          // If inside current node range, ignore
          if (clampedPos > nodeStart && clampedPos < nodeEnd) {
            return null;
          }
          
          const currentDocSize = doc.content.size;
          const needsRebuild = !cachedImageNodes || 
                               cachedDocSize !== currentDocSize || 
                               cachedNodeId !== dragState.nodeId;
          
          if (needsRebuild) {
            cachedImageNodes = [];
            // Include ALL image nodes (kể cả ảnh đang drag) để tính gap chính xác.
            // Các gap rơi trong vùng ảnh đang kéo sẽ được lọc ở bước sau.
            doc.descendants((node, pos) => {
              if (node.type.name === 'image') {
                const size = node.nodeSize;
                cachedImageNodes!.push({ pos, size });
              }
            });
            cachedImageNodes.sort((a, b) => a.pos - b.pos);
            cachedDocSize = currentDocSize;
            cachedNodeId = dragState.nodeId;
          }
          
          // Gap-based strategy: build gaps between images (and before first / after last)
          if (cachedImageNodes && cachedImageNodes.length > 0) {
            const gaps: number[] = [];
            const first = cachedImageNodes[0];
            const last = cachedImageNodes[cachedImageNodes.length - 1];

            // Before first
            gaps.push(first.pos);
            // Between
            for (let i = 0; i < cachedImageNodes.length - 1; i++) {
              const prev = cachedImageNodes[i];
              gaps.push(prev.pos + prev.size);
            }
            // After last
            gaps.push(last.pos + last.size);

            // Filter out gaps that fall inside the dragged node range
            const validGaps = gaps.filter((g) => g <= nodeStart || g >= nodeEnd);

            // Find nearest gap by absolute distance to clampedPos
            let bestGap: number | null = null;
            let bestDistance = Infinity;
            for (const g of validGaps) {
              const d = Math.abs(clampedPos - g);
              if (d < bestDistance) {
                bestDistance = d;
                bestGap = g;
              }
            }

            if (bestGap !== null) {
              // Validate that we can insert at bestGap
              try {
                const $pos = doc.resolve(bestGap);
                const parent = $pos.parent;
                const index = $pos.index();
                if (parent.canReplace(index, index, Fragment.from(dragState.node))) {
                  return bestGap;
                }
              } catch {
                // fall through to fallback
              }
            }
          }
          
          // Fallback: scan around clampedPos for any valid insertion point
          const MAX_SEARCH_RADIUS = 15;
          
          for (let offset = 0; offset <= MAX_SEARCH_RADIUS; offset++) {
            const positions = offset === 0 
              ? [clampedPos]
              : [clampedPos - offset, clampedPos + offset];
            
            for (const pos of positions) {
              if (pos < 0 || pos > doc.content.size) continue;
              if (pos > nodeStart && pos < nodeEnd) continue;
              
              try {
                const $pos = doc.resolve(pos);
                const parent = $pos.parent;
                const index = $pos.index();
                
                if (parent.canReplace(index, index, Fragment.from(dragState.node))) {
                  return pos;
                }
              } catch {
                continue;
              }
            }
          }
          
          return null;
        } catch {
          return null;
        }
      };
          
      const handleDocumentMouseMove = (e: MouseEvent) => {
        if (!dragState?.isActive || isResizing) return;
        
        lastMouseEvent = e;
        
        if (dragPreviewElement) {
          updateDragPreviewPosition(e);
        } else {
          createDragPreview();
          updateDragPreviewPosition(e);
        }
        
        // Auto-scroll when dragging near edges of editor container
        if (globalImageDragState.isActive) {
          const proseMirror = view.dom.closest('.ProseMirror');
          if (proseMirror) {
            let scrollContainer: HTMLElement | null = proseMirror.parentElement;
            while (scrollContainer) {
              const style = window.getComputedStyle(scrollContainer);
              if (style.overflowY === 'auto' || style.overflowY === 'scroll' || 
                  scrollContainer.classList.contains('overflow-y-auto')) {
                break;
              }
              scrollContainer = scrollContainer.parentElement;
            }
            
            if (!scrollContainer) {
              scrollContainer = proseMirror.parentElement;
              while (scrollContainer && scrollContainer !== document.body) {
                if (scrollContainer.scrollHeight > scrollContainer.clientHeight) {
                  break;
                }
                scrollContainer = scrollContainer.parentElement;
              }
            }
            
            if (scrollContainer) {
              const rect = scrollContainer.getBoundingClientRect();
              const SCROLL_THRESHOLD = 50; // pixels from edge
              const SCROLL_SPEED = 10; // pixels per frame
              
              let scrollDelta = 0;
              
              // Check if near top edge
              if (e.clientY < rect.top + SCROLL_THRESHOLD && scrollContainer.scrollTop > 0) {
                scrollDelta = -SCROLL_SPEED;
              }
              // Check if near bottom edge
              else if (e.clientY > rect.bottom - SCROLL_THRESHOLD && 
                       scrollContainer.scrollTop < scrollContainer.scrollHeight - scrollContainer.clientHeight) {
                scrollDelta = SCROLL_SPEED;
              }
              
              if (scrollDelta !== 0) {
                scrollContainer.scrollBy({
                  top: scrollDelta,
                  behavior: 'auto',
                });
              }
            }
          }
        }
        
        const now = Date.now();
        if (now - lastMoveTime < MOVE_THROTTLE) {
            return;
          }
        lastMoveTime = now;
        
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
        
        rafId = requestAnimationFrame(() => {
          rafId = null;
          calculateAndSetInsertPosition(e.clientX, e.clientY);
        });
      };
      
      const cleanupDrag = () => {
        console.log('[DEBUG] cleanupDrag called', {
          hasRafId: rafId !== null,
          hasDragState: !!dragState,
          dragStateActive: dragState?.isActive,
          globalDragActive: globalImageDragState.isActive,
        });
        
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        if (dragState) {
          dragState.isActive = false;
          // Only clear global state if this is the active drag
          if (globalImageDragState.nodeId === dragState.nodeId) {
            globalImageDragState.isActive = false;
            globalImageDragState.nodeId = null;
            console.log('[DEBUG] Global drag state cleaned up');
          }
          dragState = null;
          console.log('[DEBUG] Drag state cleaned up');
        }
        cachedImageNodes = null;
        cachedDocSize = 0;
        cachedNodeId = null;
        removeDragPreview();
        if (img) {
          img.style.opacity = '';
          img.style.cursor = '';
        }
      };
      
      const performDragDrop = (dragState: DragState, insertPos: number): boolean => {
        const { doc } = view.state;
        
        const currentNode = doc.nodeAt(dragState.startPos);
        if (!currentNode || 
            currentNode.type.name !== 'image' ||
            currentNode.attrs.id !== dragState.nodeId) {
          return false;
        }
        
        const nodeStart = dragState.startPos;
        const nodeEnd = nodeStart + currentNode.nodeSize;
        
        if (insertPos === nodeStart) {
          return true;
        }
        
        let finalInsertPos = insertPos;
        
          if (finalInsertPos < 0) {
            finalInsertPos = 0;
          }
        if (finalInsertPos > doc.content.size) {
          finalInsertPos = doc.content.size;
        }
        
        try {
          const finalTr = view.state.tr;
          
          finalTr.delete(nodeStart, nodeEnd);
          
          const docAfterDelete = finalTr.doc;
          
          if (finalInsertPos > docAfterDelete.content.size) {
            finalInsertPos = docAfterDelete.content.size;
          }
          if (finalInsertPos < 0) {
            finalInsertPos = 0;
          }
          
          try {
            const $insertPos = docAfterDelete.resolve(finalInsertPos);
            if (!$insertPos.parent.canReplace(
              $insertPos.index(),
              $insertPos.index(),
              Fragment.from(currentNode)
            )) {
              return false;
            }
          } catch {
            return false;
          }
          
          const newNode = currentNode.type.create(
            currentNode.attrs,
            currentNode.content
          );
          
          finalTr.insert(finalInsertPos, newNode);
          
          view.dispatch(finalTr);
          
          const newState = view.state;
          const newDoc = newState.doc;
          const movedNode = newDoc.nodeAt(finalInsertPos);
          
          if (movedNode && movedNode.attrs.id === dragState.nodeId) {
            const selectTr = newState.tr;
            selectTr.setSelection(
              TextSelection.create(newDoc, finalInsertPos, finalInsertPos + movedNode.nodeSize)
            );
            view.dispatch(selectTr);
            
            const event = new CustomEvent('selectImage', { 
              detail: { pos: finalInsertPos } 
            });
            document.dispatchEvent(event);
          }
          
          return true;
        } catch {
          return false;
        }
      };

      const handleDocumentScroll = () => {
        if (dragState?.isActive && dragPreviewElement && lastMouseEvent) {
          updateDragPreviewPosition(lastMouseEvent);
        }
      };

      const handleDocumentMouseUp = () => {
        if (!dragState?.isActive) {
          return;
        }
        
        removeDragPreview();
        lastMouseEvent = null;
        
        if (img) {
          img.style.opacity = '';
          img.style.cursor = '';
        }
        
        try {
          if (dragState.pendingInsertPos !== null) {
            performDragDrop(dragState, dragState.pendingInsertPos);
          } else if (dragState.startPos !== undefined) {
            const { doc, tr } = view.state;
            const node = doc.nodeAt(dragState.startPos);
            
            if (node && node.type.name === 'image') {
              tr.setSelection(TextSelection.create(doc, dragState.startPos, dragState.startPos + node.nodeSize));
              view.dispatch(tr);
              
              if (!wasCtrlClick) {
                const event = new CustomEvent('selectImage', { 
                  detail: { pos: dragState.startPos }
                });
                document.dispatchEvent(event);
              }
            }
          }
        } catch {
          // Silent fail
        } finally {
          cleanupDrag();
        }
      };
      
      const calculateAndSetInsertPosition = (clientX: number, clientY: number) => {
        if (!dragState?.isActive) return;
        
        const coords = view.posAtCoords({ left: clientX, top: clientY });
        if (!coords) return;
        
        const { doc } = view.state;
        
        const currentNode = doc.nodeAt(dragState.startPos);
        if (!currentNode || 
            currentNode.type.name !== 'image' ||
            currentNode.attrs.id !== dragState.nodeId) {
          cleanupDrag();
          return;
        }
        
        const targetPos = coords.pos;
        const insertPos = findInsertPosition(targetPos, dragState, doc);
        
        if (insertPos === null) {
          return;
        }
        
        const { startPos, nodeSize } = dragState;
        const nodeStart = startPos;
        const nodeEnd = startPos + nodeSize;
        
        if (insertPos === nodeStart) {
          return;
        }
        
        let finalInsertPos: number;
        if (insertPos < nodeStart) {
          finalInsertPos = insertPos;
        } else if (insertPos >= nodeEnd) {
          finalInsertPos = insertPos - nodeSize;
        } else {
          return;
        }
        
        if (finalInsertPos === nodeStart) {
                  return;
        }
        
        finalInsertPos = Math.max(0, Math.min(finalInsertPos, doc.content.size - nodeSize));
        
        if (dragState.lastMovedToPos !== null && finalInsertPos === dragState.lastMovedToPos) {
          return;
        }
        
        try {
          const testTr = view.state.tr;
          testTr.delete(nodeStart, nodeEnd);
          const testDoc = testTr.doc;
          
          if (finalInsertPos > testDoc.content.size) {
            finalInsertPos = testDoc.content.size;
          }
          
          if (finalInsertPos < 0) {
            finalInsertPos = 0;
          }
          
          const $insertPos = testDoc.resolve(finalInsertPos);
          if ($insertPos.parent.canReplace(
            $insertPos.index(),
            $insertPos.index(),
            Fragment.from(dragState.node)
          )) {
            dragState.pendingInsertPos = finalInsertPos;
            dragState.lastMovedToPos = finalInsertPos;
          }
        } catch {
          // Silent fail
        }
      };
      
      const handleDocumentDragOver = (e: DragEvent) => {
        console.log('[DEBUG] handleDocumentDragOver called', {
          dragStateActive: dragState?.isActive,
          hasDragPreview: !!dragPreviewElement,
          clientX: e.clientX,
          clientY: e.clientY,
          target: e.target,
        });

        if (!dragState?.isActive || !dragPreviewElement) {
          console.log('[DEBUG] Drag over ignored - not active or no preview');
          return;
        }

        // Always preventDefault to allow drop, but wheel events are handled separately
        // Wheel events fire independently and won't be blocked by this
        e.preventDefault();
        e.stopPropagation();

        updateDragPreviewPosition(e);
        lastMouseEvent = e;

        const now = Date.now();
        if (now - lastMoveTime >= MOVE_THROTTLE) {
          lastMoveTime = now;

          if (rafId !== null) {
            cancelAnimationFrame(rafId);
          }

          rafId = requestAnimationFrame(() => {
            rafId = null;
            calculateAndSetInsertPosition(e.clientX, e.clientY);
          });
        }
      };
      
      const handleDocumentDrop = (e: DragEvent) => {
        if (!dragState?.isActive) {
          return;
        }

        const editorContainer = view.dom.parentElement || view.dom;
        const rect = editorContainer.getBoundingClientRect();
        const isInsideEditor =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;

        if (!isInsideEditor) {
          return;
        }

        e.preventDefault();
        e.stopPropagation();

        removeDragPreview();

        try {
          if (dragState.pendingInsertPos !== null) {
            performDragDrop(dragState, dragState.pendingInsertPos);
          }
        } catch {
          // Silent fail
        } finally {
          lastMouseEvent = null;
          if (img) {
            img.style.opacity = '';
            img.style.cursor = '';
          }
          cleanupDrag();
        }
      };

      // Allow manual scroll (mouse wheel) during drag by scrolling the editor container ourselves
      // Note: Wheel events may not fire during drag, so we also use auto-scroll in mousemove
      const handleDocumentWheel = (e: WheelEvent) => {
        console.log('[DEBUG] handleDocumentWheel called', {
          dragStateActive: dragState?.isActive,
          globalDragActive: globalImageDragState.isActive,
          deltaY: e.deltaY,
          deltaX: e.deltaX,
          target: e.target,
          currentTarget: e.currentTarget,
        });

        // Use global drag state instead of local dragState to work across all node views
        if (!globalImageDragState.isActive) {
          console.log('[DEBUG] Global drag state not active, ignoring wheel event');
          return;
        }

        // Prevent default to take control of scrolling
        e.preventDefault();
        e.stopPropagation();

        // Find the scroll container - find .ProseMirror from the event target or use view.dom
        const target = e.target as HTMLElement;
        const proseMirror = target.closest('.ProseMirror') || view.dom.closest('.ProseMirror');
        console.log('[DEBUG] ProseMirror element:', proseMirror);
        
        if (!proseMirror) {
          console.log('[DEBUG] ProseMirror not found');
          return;
        }

        // Find the scrollable parent container
        let scrollContainer: HTMLElement | null = proseMirror.parentElement;
        console.log('[DEBUG] Starting scroll container search from:', scrollContainer);
        
        while (scrollContainer) {
          const style = window.getComputedStyle(scrollContainer);
          const overflowY = style.overflowY;
          const hasOverflowClass = scrollContainer.classList.contains('overflow-y-auto');
          console.log('[DEBUG] Checking container:', {
            element: scrollContainer,
            overflowY,
            hasOverflowClass,
            scrollHeight: scrollContainer.scrollHeight,
            clientHeight: scrollContainer.clientHeight,
          });
          
          if (overflowY === 'auto' || overflowY === 'scroll' || hasOverflowClass) {
            console.log('[DEBUG] Found scroll container by overflow style:', scrollContainer);
            break;
          }
          scrollContainer = scrollContainer.parentElement;
        }

        if (!scrollContainer) {
          console.log('[DEBUG] Scroll container not found by overflow, trying fallback');
          // Fallback: try to find any scrollable ancestor
          scrollContainer = proseMirror.parentElement;
          while (scrollContainer && scrollContainer !== document.body) {
            const scrollHeight = scrollContainer.scrollHeight;
            const clientHeight = scrollContainer.clientHeight;
            console.log('[DEBUG] Fallback check:', {
              element: scrollContainer,
              scrollHeight,
              clientHeight,
              isScrollable: scrollHeight > clientHeight,
            });
            
            if (scrollHeight > clientHeight) {
              console.log('[DEBUG] Found scroll container by scrollHeight:', scrollContainer);
              break;
            }
            scrollContainer = scrollContainer.parentElement;
          }
        }

        if (!scrollContainer) {
          console.error('[DEBUG] Scroll container not found! Cannot scroll during drag.');
          return;
        }

        console.log('[DEBUG] Scrolling container:', {
          container: scrollContainer,
          currentScrollTop: scrollContainer.scrollTop,
          scrollHeight: scrollContainer.scrollHeight,
          clientHeight: scrollContainer.clientHeight,
          deltaY: e.deltaY,
          deltaX: e.deltaX,
        });

        // Prevent browser default to avoid wheel being ignored during drag
        e.preventDefault();
        e.stopPropagation();

        // Manually scroll the editor container
        const beforeScroll = scrollContainer.scrollTop;
        scrollContainer.scrollBy({
          top: e.deltaY,
          left: e.deltaX,
          behavior: 'auto',
        });
        const afterScroll = scrollContainer.scrollTop;
        
        console.log('[DEBUG] Scroll executed:', {
          beforeScroll,
          afterScroll,
          delta: afterScroll - beforeScroll,
          expectedDelta: e.deltaY,
        });
      };
      
      // Event listeners
      // Register wheel handler globally only once (shared across all node views)
      if (!wheelHandlerRegistered) {
        globalWheelHandler = handleDocumentWheel;
        document.addEventListener('wheel', handleDocumentWheel, { passive: false, capture: true });
        wheelHandlerRegistered = true;
        console.log('[DEBUG] Global wheel handler registered');
      }
      document.addEventListener('click', handleDocumentClick);
      document.addEventListener('mousemove', handleDocumentMouseMove);
      document.addEventListener('mouseup', handleDocumentMouseUp);
      document.addEventListener('dragover', handleDocumentDragOver);
      document.addEventListener('drop', handleDocumentDrop);
      document.addEventListener('scroll', handleDocumentScroll, true);

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
      
      const handleSelectionUpdate = () => {
        updateSelectionStyle();
      };
      
      document.addEventListener('imageSelectionChanged', handleSelectionUpdate);
      const intervalId = setInterval(updateSelectionStyle, 100);
      
      updateSelectionStyle();

      // Function to update caption and alignment when node changes
      const updateCaptionAndAlignment = () => {
        console.log('[NodeView] updateCaptionAndAlignment() called, align:', node.attrs.align);
        const currentCaption = node.attrs.caption;
        const currentAlign = node.attrs.align || 'left';
        
        if (captionEl) {
          if (currentCaption) {
            captionEl.textContent = currentCaption as string;
            captionEl.style.display = 'block';
        } else {
            captionEl.style.display = 'none';
          }
        }
        
        if (dom) {
          // Reset all alignment styles first
          dom.style.textAlign = '';
          dom.style.marginLeft = '';
          dom.style.marginRight = '';
          dom.style.margin = '';
          dom.style.float = '';
          dom.style.width = '';
          dom.style.display = '';
          
          // Get the image container (could be link or imgWrapper)
          const imageContainer = dom.firstElementChild as HTMLElement;
          
          // Reset image container styles
          if (imageContainer) {
            imageContainer.style.marginLeft = '';
            imageContainer.style.marginRight = '';
            imageContainer.style.margin = '';
            imageContainer.style.display = '';
            imageContainer.style.width = '';
          }
          
          // Also reset imgWrapper if it exists and is different from imageContainer
          if (imgWrapper && imageContainer !== imgWrapper) {
            imgWrapper.style.marginLeft = '';
            imgWrapper.style.marginRight = '';
            imgWrapper.style.margin = '';
            imgWrapper.style.display = '';
            imgWrapper.style.width = '';
          }
          
          // Apply proper alignment styles for block images
          if (currentAlign === 'full') {
            dom.style.width = '100%';
            dom.style.display = 'block';
            if (imageContainer) {
              imageContainer.style.width = '100%';
              imageContainer.style.display = 'block';
            }
            if (imgWrapper) {
              imgWrapper.style.width = '100%';
              imgWrapper.style.display = 'block';
            }
          } else if (currentAlign === 'center') {
            dom.style.width = '100%';
            dom.style.display = 'block';
            dom.style.textAlign = 'center';
            if (imageContainer) {
              imageContainer.style.display = 'inline-block';
            }
            if (imgWrapper) {
              imgWrapper.style.display = 'inline-block';
            }
          } else if (currentAlign === 'right') {
            dom.style.width = '100%';
            dom.style.display = 'block';
            dom.style.textAlign = 'right';
            if (imageContainer) {
              imageContainer.style.display = 'inline-block';
            }
            if (imgWrapper) {
              imgWrapper.style.display = 'inline-block';
            }
          } else if (currentAlign === 'left') {
            dom.style.width = '100%';
            dom.style.display = 'block';
            dom.style.textAlign = 'left';
            if (imageContainer) {
              imageContainer.style.display = 'inline-block';
            }
            if (imgWrapper) {
              imgWrapper.style.display = 'inline-block';
            }
          } else if (currentAlign === 'float-left') {
            dom.style.float = 'left';
            dom.style.marginRight = '1em';
            dom.style.display = 'inline-block';
            if (imageContainer) {
              imageContainer.style.display = 'inline-block';
            }
            if (imgWrapper) {
              imgWrapper.style.display = 'inline-block';
            }
          } else if (currentAlign === 'float-right') {
            dom.style.float = 'right';
            dom.style.marginLeft = '1em';
            dom.style.display = 'inline-block';
            if (imageContainer) {
              imageContainer.style.display = 'inline-block';
            }
            if (imgWrapper) {
              imgWrapper.style.display = 'inline-block';
            }
          } else {
            // Default: left alignment
            dom.style.width = '100%';
            dom.style.display = 'block';
            dom.style.textAlign = 'left';
            if (imageContainer) {
              imageContainer.style.display = 'inline-block';
            }
            if (imgWrapper) {
              imgWrapper.style.display = 'inline-block';
            }
          }
          
          console.log('[NodeView] Alignment applied:', {
            align: currentAlign,
            domWidth: dom.style.width,
            domDisplay: dom.style.display,
            domTextAlign: dom.style.textAlign,
            imageContainerDisplay: imageContainer?.style.display,
          });
        }
      };

      // Initial update
      updateCaptionAndAlignment();

      // Cleanup function
      return {
        dom,
        contentDOM: null,
        ignoreMutation: () => true,
        stopEvent: (event: Event) => {
          if (event.type.startsWith('drag')) {
            return false;
          }
          if (event.type === 'mousedown' && (event.target === img || event.target === dom)) {
            return false;
          }
          return true;
        },
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
          // Only remove wheel handler if this is the last node view being destroyed
          // Note: In practice, we keep it registered as it's shared
          // The wheel handler uses global state so it's safe to keep it
          document.removeEventListener('click', handleDocumentClick);
          document.removeEventListener('mousemove', handleDocumentMouseMove);
          document.removeEventListener('mouseup', handleDocumentMouseUp);
          document.removeEventListener('dragover', handleDocumentDragOver);
          document.removeEventListener('drop', handleDocumentDrop);
          document.removeEventListener('scroll', handleDocumentScroll);
          document.removeEventListener('imageSelectionChanged', handleSelectionUpdate);
          clearInterval(intervalId);
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
        inline: false,
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
        const html = editor.getHTML();
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

  const toolbarButtonClass = (isActive = false, disabled = false) =>
    `h-9 w-9 rounded-md text-[13px] font-semibold flex items-center justify-center transition-colors border ${
      isActive
        ? 'bg-slate-900 text-white border-slate-900'
        : 'bg-transparent text-slate-700 border-transparent hover:bg-slate-100 hover:border-slate-200'
    } ${disabled ? 'opacity-40 cursor-not-allowed hover:bg-transparent hover:border-transparent' : ''}`;

  const toolbarGroupClass = 'flex items-center gap-1';
  const popoverCardClass = 'rounded-lg border border-slate-200 bg-white shadow-md shadow-slate-200/70';

  return (
    <div className="border border-[#e0e0e0] overflow-hidden rounded-2xl shadow-sm bg-white/90 backdrop-blur">
      {/* Toolbar */}
      <div className="border-b border-[#e0e0e0] bg-white p-4 flex flex-wrap gap-3 items-center">
        {/* Paragraph & Heading */}
        <div className="min-w-[200px]">
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
              className="w-full appearance-none rounded-md border border-slate-200 bg-white px-3 py-2 pr-10 text-sm text-slate-800 outline-none"
              title="Paragraph & Heading"
            >
              <option value="0" style={{ fontSize: '14px', fontWeight: 400 }}>
                Paragraph
              </option>
              <option value="1" style={{ fontSize: '24px', fontWeight: 600 }}>
                Heading 1
              </option>
              <option value="2" style={{ fontSize: '20px', fontWeight: 600 }}>
                Heading 2
              </option>
              <option value="3" style={{ fontSize: '18px', fontWeight: 600 }}>
                Heading 3
              </option>
              <option value="4" style={{ fontSize: '16px', fontWeight: 600 }}>
                Heading 4
              </option>
              <option value="5" style={{ fontSize: '14px', fontWeight: 600 }}>
                Heading 5
              </option>
              <option value="6" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
                Heading 6
              </option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        {/* Undo/Redo */}
        <div className={toolbarGroupClass} title="History">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className={toolbarButtonClass(false, !editor.can().undo())}
            aria-label="Undo"
          >
            <tiptapIcons.Undo2 size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className={toolbarButtonClass(false, !editor.can().redo())}
            aria-label="Redo"
          >
            <tiptapIcons.Redo2 size={16} />
          </button>
        </div>

        {/* Core formatting */}
        <div className={toolbarGroupClass} title="Inline formatting">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={toolbarButtonClass(editor.isActive('bold'))}
            aria-label="Bold"
          >
            <tiptapIcons.Bold size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={toolbarButtonClass(editor.isActive('italic'))}
            aria-label="Italic"
          >
            <tiptapIcons.Italic size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={toolbarButtonClass(editor.isActive('underline'))}
            aria-label="Underline"
          >
            <tiptapIcons.Underline size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={toolbarButtonClass(editor.isActive('strike'))}
            aria-label="Strikethrough"
          >
            <tiptapIcons.Strikethrough size={16} />
          </button>
        </div>

        {/* Subscript/Superscript */}
        <div className={toolbarGroupClass} title="Script">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            className={toolbarButtonClass(editor.isActive('subscript'))}
            aria-label="Subscript"
          >
            <tiptapIcons.Subscript size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            className={toolbarButtonClass(editor.isActive('superscript'))}
            aria-label="Superscript"
          >
            <tiptapIcons.Superscript size={16} />
          </button>
        </div>

        {/* Text Alignment */}
        <div className={toolbarGroupClass} title="Alignment">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={toolbarButtonClass(editor.isActive({ textAlign: 'left' }))}
            aria-label="Align Left"
          >
            <tiptapIcons.AlignLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={toolbarButtonClass(editor.isActive({ textAlign: 'center' }))}
            aria-label="Align Center"
          >
            <tiptapIcons.AlignCenter className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={toolbarButtonClass(editor.isActive({ textAlign: 'right' }))}
            aria-label="Align Right"
          >
            <tiptapIcons.AlignRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={toolbarButtonClass(editor.isActive({ textAlign: 'justify' }))}
            aria-label="Justify"
          >
            <tiptapIcons.AlignJustify className="h-5 w-5" />
          </button>
        </div>

        {/* Lists */}
        <div className={toolbarGroupClass} title="Lists">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={toolbarButtonClass(editor.isActive('bulletList'))}
            aria-label="Bullet List"
          >
            <tiptapIcons.List size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={toolbarButtonClass(editor.isActive('orderedList'))}
            aria-label="Numbered List"
          >
            <tiptapIcons.ListOrdered size={16} />
          </button>
        </div>

        {/* Insert */}
        <div className={`${toolbarGroupClass} gap-1`} title="Insert">
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
            className={toolbarButtonClass(editor.isActive('link'))}
            aria-label="Insert Link"
          >
            <tiptapIcons.Link size={16} />
          </button>

        {showLinkDialog && !linkDialogPosition && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-9999" onClick={() => {
              setShowLinkDialog(false);
              setLinkText('');
              setLinkUrl('');
              setLinkDialogPosition(null);
            }}>
              <div className={`${popoverCardClass} p-6 w-[500px] mx-4`} onClick={(e) => e.stopPropagation()}>
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


          <div className="relative image-dropdown-container">
            <button
              type="button"
              onClick={() => setShowImageDropdown(!showImageDropdown)}
              className={toolbarButtonClass(showImageDropdown)}
              aria-label="Insert Image"
            >
              <tiptapIcons.Image size={16} />
            </button>
            
            {showImageDropdown && (
              <div className={`absolute left-0 top-full z-50 mt-2 w-56 ${popoverCardClass}`}>
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

                      const uploadAndInsert = async (file: File) => {
                        const formData = new FormData();
                        formData.append('file', file);

                        const response = await fetch('/api/upload', {
                          method: 'POST',
                          body: formData,
                        });

                        const data = await response.json();
                        if (data?.success && data.url) {
                          const imageId = generateImageId();
                          editor.chain().focus().run();

                          const { state, view } = editor;
                          const { schema } = state;
                          const { tr } = state;
                          const { from } = state.selection;

                          const imageNode = schema.nodes.image.create({
                            src: data.url,
                            alt: '',
                            id: imageId,
                          });

                          tr.insert(from, imageNode);
                          view.dispatch(tr);
                        } else {
                          console.error('Failed to upload:', file.name, data?.error);
                        }
                      };

                      await Promise.allSettled(Array.from(files).map((file) => uploadAndInsert(file)));
                    };
                    input.click();
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-slate-800 hover:bg-slate-50 transition-colors flex items-center gap-2 rounded-t-lg"
                >
                  <Upload size={16} className="text-slate-500" />
                  <span className="font-medium">Upload from computer</span>
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
                  className="w-full px-4 py-3 text-left text-sm text-slate-800 hover:bg-slate-50 transition-colors flex items-center gap-2 border-t border-slate-100 rounded-b-lg"
                >
                  <Globe size={16} className="text-slate-500" />
                  <span className="font-medium">Add image link</span>
                </button>
              </div>
            )}
          </div>

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
              className={toolbarButtonClass(selectedImagePositions.length >= 2, selectedImagePositions.length < 2)}
              aria-label="Image Layout"
              title={`Image Layout - ${selectedImagePositions.length} image(s) selected. Click images to select (Ctrl/Cmd + Click for multiple)`}
            >
              <Grid3x3 size={16} />
            </button>
          </div>

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
            className={`${toolbarButtonClass()} w-auto px-3 gap-2`}
            aria-label="Insert YouTube Video"
            title="Insert YouTube Video"
          >
            <tiptapIcons.Video size={16} />
            <span className="text-xs font-semibold text-slate-800">YouTube</span>
          </button>
        </div>

        {/* Typography (font size only) */}
        <div className={`${toolbarGroupClass} gap-2`}>
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
              className="appearance-none rounded-md border border-slate-200 bg-white px-3 py-2 pr-10 text-sm text-slate-800 outline-none"
              title="Font Size"
            >
              <option value="default" style={{ fontSize: '14px' }}>
                Size
              </option>
              <option value="10" style={{ fontSize: '10px' }}>10px</option>
              <option value="12" style={{ fontSize: '12px' }}>12px</option>
              <option value="14" style={{ fontSize: '14px' }}>14px</option>
              <option value="16" style={{ fontSize: '16px' }}>16px</option>
              <option value="18" style={{ fontSize: '18px' }}>18px</option>
              <option value="20" style={{ fontSize: '20px' }}>20px</option>
              <option value="24" style={{ fontSize: '24px' }}>24px</option>
              <option value="28" style={{ fontSize: '28px' }}>28px</option>
              <option value="32" style={{ fontSize: '32px' }}>32px</option>
              <option value="36" style={{ fontSize: '36px' }}>36px</option>
              <option value="48" style={{ fontSize: '48px' }}>48px</option>
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className={`${toolbarGroupClass} gap-2`}>
          <ColorPicker
            icon={<tiptapIcons.TextColor width={16} height={16} fill={textColor} />}
            currentColor={textColor}
            onColorChange={(color) => {
              setTextColor(color);
              editor.chain().focus().setColor(color).run();
            }}
            isActive={editor.isActive('textStyle')}
            title="Text Color"
            defaultColor="#000000"
          />

          <ColorPicker
            icon={<tiptapIcons.Highlighter width={16} height={16} />}
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
          />

          <input
            type="color"
            onChange={(e) => {
              editor.chain().focus().setHighlight({ color: e.target.value }).run();
            }}
            className="h-9 w-12 rounded-lg border border-slate-200 shadow-inner cursor-pointer"
            title="Background Color"
          />
        </div>

        {/* Table */}
        <div className={`${toolbarGroupClass} gap-1`} title="Table tools">
          <button
            type="button"
            onClick={() => {
              const rows = parseInt(window.prompt('Number of rows:', '3') || '3', 10);
              const cols = parseInt(window.prompt('Number of columns:', '3') || '3', 10);
              if (rows > 0 && cols > 0) {
                editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
              }
            }}
            className={`${toolbarButtonClass()} w-auto px-3 gap-2`}
            title="Insert Table"
          >
            <tiptapIcons.Table size={16} />
            <span className="text-xs font-semibold text-slate-800">Table</span>
          </button>
          {editor.isActive('table') && (
            <>
              <button
                type="button"
                onClick={() => editor.chain().focus().addColumnBefore().run()}
                className={`${toolbarButtonClass()} w-auto px-3 text-[11px]`}
                title="Add Column Before"
              >
                +Col
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                className={`${toolbarButtonClass()} w-auto px-3 text-[11px]`}
                title="Add Column After"
              >
                Col+
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().deleteColumn().run()}
                className={`${toolbarButtonClass()} w-auto px-3 text-[11px]`}
                title="Delete Column"
              >
                -Col
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().addRowBefore().run()}
                className={`${toolbarButtonClass()} w-auto px-3 text-[11px]`}
                title="Add Row Before"
              >
                +Row
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().addRowAfter().run()}
                className={`${toolbarButtonClass()} w-auto px-3 text-[11px]`}
                title="Add Row After"
              >
                Row+
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().deleteRow().run()}
                className={`${toolbarButtonClass()} w-auto px-3 text-[11px]`}
                title="Delete Row"
              >
                -Row
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().deleteTable().run()}
                className={`${toolbarButtonClass()} w-auto px-3 text-[11px]`}
                title="Delete Table"
              >
                ×Table
              </button>
            </>
          )}
        </div>

        {/* Clear Formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          className={`${toolbarButtonClass()} w-auto px-4`}
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
            className={`absolute ${popoverCardClass} p-6 w-[500px] z-50 image-alt-dialog`}
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
            className={`absolute ${popoverCardClass} p-6 w-[500px] z-50 image-caption-dialog`}
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
            className={`absolute ${popoverCardClass} p-6 w-[500px] z-50 image-link-dialog`}
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
            className={`absolute ${popoverCardClass} p-6 w-[500px] z-50 image-replace-dialog`}
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
            className={`link-popover absolute ${popoverCardClass} z-50`}
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
            className={`absolute ${popoverCardClass} p-6 w-[500px] z-50`}
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
          className={`image-layout-dropdown fixed ${popoverCardClass} p-4 z-50 min-w-[280px]`}
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
                <tiptapIcons.List size={20} className="text-gray-600" />
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


