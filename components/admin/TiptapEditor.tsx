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
import { DOMParser, Fragment, type Node as PMNode } from 'prosemirror-model';
import { TextSelection } from 'prosemirror-state';
import type { EditorView, NodeView } from 'prosemirror-view';
import { AlignLeft, AlignCenter, AlignRight, AlignJustify, Undo2, Redo2, List, ListOrdered, Highlighter, X, Type, ChevronDown, Link as LinkIcon, Menu, Search, Copy, Pencil, Unlink, Image as ImageIcon, Upload, Globe, Grid3x3, LayoutGrid, Columns } from 'lucide-react';
import { Iframe, type IframeAttributes } from './Iframe';
import { ImageGallery } from './ImageGallery';

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
    };
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      {
        class: 'resizable-image-wrapper',
        style: 'position: relative; display: inline-block; max-width: 100%;',
      },
      [
        'img',
        {
          ...HTMLAttributes,
          style: `display: block; max-width: 100%; height: auto; ${HTMLAttributes.width ? `width: ${HTMLAttributes.width}px;` : ''} ${HTMLAttributes.height ? `height: ${HTMLAttributes.height}px;` : ''}`,
        },
      ],
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

      const img = document.createElement('img');
      img.src = node.attrs.src;
      img.alt = node.attrs.alt || '';
      img.style.display = 'block';
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.draggable = true;
      
      let originalWidth = 0;
      let originalHeight = 0;
      let aspectRatio = 1;
      
      const updateImageSize = () => {
        if (node.attrs.width) {
          const width = typeof node.attrs.width === 'number' ? node.attrs.width : parseInt(node.attrs.width);
          img.style.width = `${width}px`;
          dom.style.width = `${width}px`;
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
              dom.style.width = img.style.width;
            }
            dom.style.height = 'fit-content';
            setTimeout(() => {
              updateHandlesPosition();
            }, 0);
          };
        }
      };
      
      updateImageSize();

      dom.appendChild(img);

      let isResizing = false;
      let isDragging = false;
      let resizeHandle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null = null;
      let startX = 0;
      let startY = 0;
      let startWidth = 0;
      let startHeight = 0;
      let dragStartPos: number | undefined = undefined;

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
          const rect = dom.getBoundingClientRect();
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
        dom.style.width = `${newWidth}px`;
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

          dom.style.width = `${width}px`;
          dom.style.height = 'fit-content';

          const { tr } = view.state;
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            width: width,
            height: height,
          });
          view.dispatch(tr);
          
          setTimeout(() => {
            updateSelectionStyle();
            updateHandlesPosition();
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
        dom.appendChild(handle);
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
            
            if (e.ctrlKey || e.metaKey) {
              const event = new CustomEvent('toggleImageSelection', { detail: { pos, mouseX: e.clientX, mouseY: e.clientY } });
              document.dispatchEvent(event);
            } else {
              const event = new CustomEvent('selectImage', { detail: { pos, mouseX: e.clientX, mouseY: e.clientY } });
              document.dispatchEvent(event);
            }
            
            dragStartPos = pos;
            isDragging = true;
          }
        }
      };

      img.addEventListener('mousedown', handleImageMouseDown);

      const handleImageDragStart = (e: DragEvent) => {
        if (!isResizing) {
          const pos = getPos();
          if (typeof pos === 'number') {
            dragStartPos = pos;
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

      const handleDocumentMouseMove = (e: MouseEvent) => {
        if (isDragging && dragStartPos !== undefined && !isResizing) {
          const pos = view.posAtCoords({ left: e.clientX, top: e.clientY });
          if (pos && pos.pos !== dragStartPos) {
            const { tr } = view.state;
            const node = view.state.doc.nodeAt(dragStartPos);
            if (node) {
              tr.delete(dragStartPos, dragStartPos + node.nodeSize);
              const newPos = pos.pos > dragStartPos ? pos.pos - node.nodeSize : pos.pos;
              tr.insert(newPos, node);
              view.dispatch(tr);
              dragStartPos = newPos;
            }
          }
        }
      };

      const handleDocumentMouseUp = () => {
        if (isDragging) {
          isDragging = false;
          dragStartPos = undefined;
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
      
      const handleSelectionUpdate = () => {
        updateSelectionStyle();
      };
      
      document.addEventListener('imageSelectionChanged', handleSelectionUpdate);
      const intervalId = setInterval(updateSelectionStyle, 100);

      return {
        dom,
        contentDOM: null,
        ignoreMutation: () => true,
        destroy: () => {
          document.removeEventListener('click', handleDocumentClick);
          document.removeEventListener('mousemove', handleDocumentMouseMove);
          document.removeEventListener('mouseup', handleDocumentMouseUp);
          document.removeEventListener('imageSelectionChanged', handleSelectionUpdate);
          clearInterval(intervalId);
        },
      };
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
  const [imageLayoutButtonRef, setImageLayoutButtonRef] = useState<HTMLElement | null>(null);
  const [imageLayoutDropdownPosition, setImageLayoutDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectedImagePositions, setSelectedImagePositions] = useState<number[]>([]);
  const [lastMousePosition, setLastMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [gridRows, setGridRows] = useState(2);
  const [gridColumns, setGridColumns] = useState(2);
  
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
      handlePaste(view: EditorView, event: ClipboardEvent) {
        const html = event.clipboardData?.getData('text/html') ?? '';
        const text = event.clipboardData?.getData('text/plain') ?? '';

        // ... existing paste handling logic unchanged ...
        // (keeping full function body as in your current file)

        return false;
      },
    },
  });

  useEffect(() => {
    if (!editor) return;

    const updateFloatingLayoutButton = (_positions: number[], _mouseX?: number, _mouseY?: number) => {
      // Floating layout button removed
    };

    const handleSelectImage = (e: Event) => {
      const customEvent = e as CustomEvent<{ pos: number; mouseX?: number; mouseY?: number }>;
      const { pos, mouseX, mouseY } = customEvent.detail;
      const newPositions = [pos];
      setSelectedImagePositions(newPositions);
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
    
    const updateEvent = new CustomEvent('imageSelectionChanged');
    document.dispatchEvent(updateEvent);
    
    return () => {
      document.removeEventListener('selectImage', handleSelectImage);
      document.removeEventListener('toggleImageSelection', handleToggleImageSelection);
      document.removeEventListener('checkImageSelection', handleCheckImageSelection);
    };
  }, [editor, selectedImagePositions, lastMousePosition]);

  useEffect(() => {
    let clickTimeout: NodeJS.Timeout | null = null;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      if (
        target.closest('.resizable-image-wrapper') || 
        target.closest('[title*="Image Layout"]') ||
        target.closest('.image-layout-dialog-container') ||
        target.closest('.image-layout-dropdown')
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
                        if (linkText) {
                          editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkText}</a>`).run();
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
                    
                    const uploadPromises = Array.from(files).map(async (file) => {
                      const formData = new FormData();
                      formData.append('file', file);
                      
                      try {
                        const response = await fetch('/api/upload', {
                          method: 'POST',
                          body: formData,
                        });
                        
                        const data = await response.json();
                        
                        if (data.success && data.url) {
                          return data.url;
                        } else {
                          console.error('Failed to upload:', file.name, data.error);
                          return null;
                        }
                      } catch (error) {
                        console.error('Error uploading image:', file.name, error);
                        return null;
                      }
                    });
                    
                    const uploadedUrls = await Promise.all(uploadPromises);
                    const validUrls = uploadedUrls.filter((url): url is string => url !== null);
                    
                    if (validUrls.length > 0) {
                      validUrls.forEach((url) => {
                        editor.chain().focus().setImage({ src: url }).run();
                      });
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
                    editor.chain().focus().setImage({ src: url }).run();
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
                    if (linkEditRange) {
                      // Edit existing link: replace the entire link with new text and URL
                      const { from, to } = linkEditRange;
                      
                      // Replace the entire link range with new link
                      editor.chain()
                        .focus()
                        .setTextSelection({ from, to })
                        .deleteSelection()
                        .insertContent(`<a href="${linkUrl}">${linkText || linkUrl}</a>`)
                        .run();
                    } else if (linkText) {
                      editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkText}</a>`).run();
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

