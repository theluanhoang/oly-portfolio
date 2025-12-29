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
import { DOMParser, type Node } from 'prosemirror-model';
import { TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { AlignLeft, AlignCenter, AlignRight, AlignJustify, Undo2, Redo2, List, ListOrdered, Highlighter, X, Type, ChevronDown, Link as LinkIcon, Menu, Search } from 'lucide-react';
import { Iframe, type IframeAttributes } from './Iframe';

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
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
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
    ],
    content: content || '',
    onUpdate: ({ editor }: { editor: Editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
    editorProps: {
      handlePaste(view: EditorView, event: ClipboardEvent) {
        const html = event.clipboardData?.getData('text/html') ?? '';
        const text = event.clipboardData?.getData('text/plain') ?? '';

        // Check if content contains iframe (check both HTML and text)
        // const hasIframe = (html && html.toLowerCase().includes('<iframe')) || 
        //                  (text && text.toLowerCase().includes('<iframe'));

        // If HTML contains iframe, extract iframes and process remaining content
        if (html && html.toLowerCase().includes('<iframe')) {
          const { iframes, remainingHTML } = extractIframesFromHTML(html);
          
          console.log('Paste detected iframe. Extracted:', iframes.length, 'iframes');
          console.log('Iframes data:', iframes);
          console.log('Remaining HTML length:', remainingHTML?.length || 0);
          
          if (iframes.length > 0) {
            event.preventDefault();
            event.stopPropagation();
            
            const { state } = view;
            const { schema, tr } = state;
            const iframeNodeType = schema.nodes.iframe;
            
            if (!iframeNodeType) {
              console.error('Iframe node type not found in schema');
              return false;
            }
            
            try {
              let newTr = tr;
              
              // Insert all iframe nodes first
              iframes.forEach((attrs, index) => {
                try {
                  console.log('Creating iframe node with attrs:', attrs);
                  console.log('Iframe src:', attrs.src);
                  
                  if (!attrs.src) {
                    console.error('Iframe has no src attribute!', attrs);
                    return;
                  }
                  
                  // Ensure src is not null
                  const nodeAttrs = { ...attrs, src: attrs.src || null };
                  const node = iframeNodeType.create(nodeAttrs);
                  console.log('Iframe node created:', node);
                  console.log('Iframe node attrs:', node.attrs);
                  
                  // Insert iframe node
                  newTr = newTr.replaceSelectionWith(node);
                  console.log('Iframe node inserted at index', index);
                  
                  // Add paragraph break after iframe (except for the last one)
                  if (index < iframes.length - 1) {
                    const paragraph = schema.nodes.paragraph.create();
                    newTr = newTr.replaceSelectionWith(paragraph);
                  }
                } catch (nodeError) {
                  console.error('Error creating/inserting iframe node at index', index, ':', nodeError);
                  console.error('Attrs:', attrs);
                }
              });
              
              // Dispatch iframe insertion first to ensure it's rendered
              if (iframes.length > 0) {
                console.log('Dispatching iframe transaction');
                view.dispatch(newTr.scrollIntoView());
                
                // Get updated state after iframe insertion
                const updatedState = view.state;
                newTr = updatedState.tr;
                
                // Find the iframe node in the document and calculate position after it
                let afterIframePos = null;
                updatedState.doc.descendants((node: Node, pos: number) => {
                  if (node.type.name === 'iframe') {
                    afterIframePos = pos + node.nodeSize;
                    return false; // Stop traversing
                  }
                });
                
                if (afterIframePos !== null) {
                  console.log('Found iframe, position after it:', afterIframePos);
                  // Set selection to position after iframe
                  newTr = newTr.setSelection(TextSelection.create(updatedState.doc, afterIframePos));
                  console.log('Selection set to position after iframe');
                } else {
                  console.warn('Could not find iframe in document');
                }
              }
              
              // Insert remaining HTML in a new transaction
              if (remainingHTML && remainingHTML.trim()) {
                console.log('Processing remaining HTML, length:', remainingHTML.length);
                try {
                  // Check selection position before inserting remaining HTML
                  const $fromBefore = newTr.selection.$from;
                  const $toBefore = newTr.selection.$to;
                  console.log('Selection before remaining HTML - parent type:', $fromBefore.parent.type.name);
                  console.log('Selection position before:', $fromBefore.pos, 'to', $toBefore.pos);
                  
                  // Add a paragraph break before remaining content if we have iframes
                  if (iframes.length > 0) {
                    const paragraph = schema.nodes.paragraph.create();
                    newTr = newTr.replaceSelectionWith(paragraph);
                    console.log('Paragraph inserted before remaining HTML');
                    
                    // Check selection position after paragraph insertion
                    const $fromAfter = newTr.selection.$from;
                    console.log('Selection after paragraph - parent type:', $fromAfter.parent.type.name);
                  }
                  
                  const tempDiv = document.createElement('div');
                  tempDiv.innerHTML = remainingHTML;
                  
                  console.log('Temp div innerHTML length:', tempDiv.innerHTML.length);
                  console.log('Temp div has children:', tempDiv.children.length);
                  
                  // Get the DOMParser from the schema
                  const domParser = DOMParser.fromSchema(schema);
                  
                  // Parse the HTML content
                  const fragment = domParser.parse(tempDiv);
                  
                  console.log('Parsed fragment content size:', fragment.content.size);
                  console.log('Parsed fragment child count:', fragment.content.childCount);
                  
                  // Insert the parsed content
                  if (fragment.content.size > 0) {
                    // Insert the entire fragment at once
                    newTr = newTr.replaceSelectionWith(fragment);
                    console.log('Remaining HTML fragment inserted');
                  }
                } catch (parseError: unknown) {
                  console.error('Error parsing remaining HTML:', parseError);
                  const error = parseError as Error;
                  console.error('Parse error details:', error.message, error.stack);
                  // If parsing fails, try to insert as plain text
                  try {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = remainingHTML;
                    const textContent = tempDiv.textContent || tempDiv.innerText || '';
                    if (textContent.trim()) {
                      const paragraph = schema.nodes.paragraph.create(
                        null,
                        schema.text(textContent)
                      );
                      newTr = newTr.replaceSelectionWith(paragraph);
                      console.log('Inserted remaining content as plain text');
                    }
                  } catch (textError) {
                    console.error('Error inserting as plain text:', textError);
                  }
                }
                
                console.log('Dispatching remaining HTML transaction');
                view.dispatch(newTr.scrollIntoView());
              }
              
              return true;
            } catch (error) {
              console.error('Error processing paste with iframes:', error);
              // Fallback: let Tiptap handle it normally
              return false;
            }
          }
        }
        
        // Check if text contains iframe HTML code (when HTML is not available)
        if (text && text.trim() && text.toLowerCase().includes('<iframe')) {
          const attrs = parseIframeInput(text);
          if (attrs && attrs.src) {
            event.preventDefault();
            event.stopPropagation();
            
            const { state } = view;
            const { schema, tr } = state;
            const iframeNodeType = schema.nodes.iframe;
            
            if (iframeNodeType) {
              try {
                const nodeAttrs: Partial<IframeAttributes> = { ...attrs, src: attrs.src || null };
                const node = iframeNodeType.create(nodeAttrs);
                const newTr = tr.replaceSelectionWith(node).scrollIntoView();
                view.dispatch(newTr);
                return true;
              } catch (error) {
                console.error('Error creating iframe node:', error);
              }
            }
          }
        }
        
        // Check if text is a valid URL (starts with http:// or https://)
        if (text && text.trim()) {
          const trimmed = text.trim();
          if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            const attrs = parseIframeInput(trimmed);
            // Only create iframe if it's a valid YouTube URL or embed URL
            if (attrs && attrs.src && (attrs.src.includes('youtube.com') || attrs.src.includes('youtu.be'))) {
              event.preventDefault();
              event.stopPropagation();
              
              const { state } = view;
              const { schema, tr } = state;
              const iframeNodeType = schema.nodes.iframe;
              
              if (iframeNodeType) {
                try {
                  const nodeAttrs = { ...attrs, src: attrs.src || null };
                  const node = iframeNodeType.create(nodeAttrs);
                  const newTr = tr.replaceSelectionWith(node).scrollIntoView();
                  view.dispatch(newTr);
                  return true;
                } catch (error) {
                  console.error('Error creating iframe node:', error);
                }
              }
            }
          }
        }

        // Let Tiptap handle normal paste
        return false;
      },
    },
  });

  useEffect(() => {
    if (editor) {
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
      };
    }
  }, [editor]);



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
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="px-3 py-2 border border-[#e0e0e0] bg-white text-[#333] text-xs tracking-[1px] uppercase hover:bg-[#f5f5f5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          title="Undo"
        >
          <Undo2 size={16} />
        </button>
        <button
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
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-4 py-2 border border-[#e0e0e0] text-xs font-bold tracking-[1px] uppercase transition-colors ${
            editor.isActive('bold') ? 'bg-[#333] text-white border-[#333]' : 'bg-white text-[#333] hover:bg-[#f5f5f5]'
          }`}
          title="Bold"
        >
          B
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-4 py-2 border border-[#e0e0e0] text-xs italic tracking-[1px] uppercase transition-colors ${
            editor.isActive('italic') ? 'bg-[#333] text-white border-[#333]' : 'bg-white text-[#333] hover:bg-[#f5f5f5]'
          }`}
          title="Italic"
        >
          I
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`px-4 py-2 border border-[#e0e0e0] text-xs underline tracking-[1px] uppercase transition-colors ${
            editor.isActive('underline') ? 'bg-[#333] text-white border-[#333]' : 'bg-white text-[#333] hover:bg-[#f5f5f5]'
          }`}
          title="Underline"
        >
          U
        </button>
        <button
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
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          className={`px-4 py-2 border border-[#e0e0e0] text-xs tracking-[1px] uppercase transition-colors ${
            editor.isActive('subscript') ? 'bg-[#333] text-white border-[#333]' : 'bg-white text-[#333] hover:bg-[#f5f5f5]'
          }`}
          title="Subscript"
        >
          x₂
        </button>
        <button
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
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`px-3 py-2 border border-[#e0e0e0] text-xs tracking-[1px] uppercase transition-colors flex items-center justify-center ${
            editor.isActive({ textAlign: 'left' }) ? 'bg-[#333] text-white border-[#333]' : 'bg-white text-[#333] hover:bg-[#f5f5f5]'
          }`}
          title="Align Left"
        >
          <AlignLeft size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`px-3 py-2 border border-[#e0e0e0] text-xs tracking-[1px] uppercase transition-colors flex items-center justify-center ${
            editor.isActive({ textAlign: 'center' }) ? 'bg-[#333] text-white border-[#333]' : 'bg-white text-[#333] hover:bg-[#f5f5f5]'
          }`}
          title="Align Center"
        >
          <AlignCenter size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`px-3 py-2 border border-[#e0e0e0] text-xs tracking-[1px] uppercase transition-colors flex items-center justify-center ${
            editor.isActive({ textAlign: 'right' }) ? 'bg-[#333] text-white border-[#333]' : 'bg-white text-[#333] hover:bg-[#f5f5f5]'
          }`}
          title="Align Right"
        >
          <AlignRight size={16} />
        </button>
        <button
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
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-2 border border-[#e0e0e0] text-xs tracking-[1px] uppercase transition-colors flex items-center justify-center ${
            editor.isActive('bulletList') ? 'bg-[#333] text-white border-[#333]' : 'bg-white text-[#333] hover:bg-[#f5f5f5]'
          }`}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
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
          onClick={() => {
            const { from, to } = editor.state.selection;
            const selectedText = editor.state.doc.textBetween(from, to, ' ');
            setLinkText(selectedText);
            const linkAttrs = editor.getAttributes('link');
            setLinkUrl(linkAttrs.href || '');
            setShowLinkDialog(true);
          }}
          className={`px-3 py-2 h-10 border border-[#e0e0e0] text-xs tracking-[1px] uppercase transition-colors flex items-center justify-center ${
            editor.isActive('link') ? 'bg-[#333] text-white border-[#333]' : 'bg-white text-[#333] hover:bg-[#f5f5f5]'
          }`}
          title="Insert Link"
        >
          <LinkIcon size={16} />
        </button>

        {/* Link Dialog */}
        {showLinkDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-9999" onClick={() => setShowLinkDialog(false)}>
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
                  onClick={() => {
                    setShowLinkDialog(false);
                    setLinkText('');
                    setLinkUrl('');
                  }}
                  className="px-4 py-2 text-gray-600 rounded hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
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
        <button
          onClick={() => {
            const url = window.prompt('Enter image URL:');
            if (url) {
              editor.chain().focus().setImage({ src: url }).run();
            }
          }}
          className="px-4 py-2 border border-[#e0e0e0] bg-white text-[#333] text-xs tracking-[1px] uppercase hover:bg-[#f5f5f5] transition-colors"
          title="Insert Image"
        >
          Image
        </button>

        {/* YouTube */}
        <button
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
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              className="px-3 py-2 border border-[#e0e0e0] bg-white text-[#333] text-xs tracking-[1px] uppercase hover:bg-[#f5f5f5] transition-colors"
              title="Add Column Before"
            >
              +Col
            </button>
            <button
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              className="px-3 py-2 border border-[#e0e0e0] bg-white text-[#333] text-xs tracking-[1px] uppercase hover:bg-[#f5f5f5] transition-colors"
              title="Add Column After"
            >
              Col+
            </button>
            <button
              onClick={() => editor.chain().focus().deleteColumn().run()}
              className="px-3 py-2 border border-[#e0e0e0] bg-white text-[#333] text-xs tracking-[1px] uppercase hover:bg-[#f5f5f5] transition-colors"
              title="Delete Column"
            >
              -Col
            </button>
            <button
              onClick={() => editor.chain().focus().addRowBefore().run()}
              className="px-3 py-2 border border-[#e0e0e0] bg-white text-[#333] text-xs tracking-[1px] uppercase hover:bg-[#f5f5f5] transition-colors"
              title="Add Row Before"
            >
              +Row
            </button>
            <button
              onClick={() => editor.chain().focus().addRowAfter().run()}
              className="px-3 py-2 border border-[#e0e0e0] bg-white text-[#333] text-xs tracking-[1px] uppercase hover:bg-[#f5f5f5] transition-colors"
              title="Add Row After"
            >
              Row+
            </button>
            <button
              onClick={() => editor.chain().focus().deleteRow().run()}
              className="px-3 py-2 border border-[#e0e0e0] bg-white text-[#333] text-xs tracking-[1px] uppercase hover:bg-[#f5f5f5] transition-colors"
              title="Delete Row"
            >
              -Row
            </button>
            <button
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
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          className="px-4 py-2 border border-[#e0e0e0] bg-white text-[#333] text-xs tracking-[1px] uppercase hover:bg-[#f5f5f5] transition-colors"
          title="Clear Formatting"
        >
          Clear
        </button>
      </div>

      {/* Editor Content */}
      <div className="bg-white min-h-[400px] p-6">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

