'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { Extension, type CommandProps, type Editor } from '@tiptap/core';
import { DOMParser, type Node } from 'prosemirror-model';
import { TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { Iframe, type IframeAttributes } from './Iframe';

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
    } catch (e) {
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
          } catch (e) {
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
    } catch (e) {
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
  } catch (e) {
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
        // Disable Link extension in StarterKit to avoid duplicate with Link extension below
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
      TextStyle,
      Color,
      FontFamily,
      FontSize,
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

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-[#e0e0e0] overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-[#e0e0e0] bg-[#f5f5f5] p-3 flex flex-wrap gap-2">
        {/* Heading */}
        <select
          onChange={(e) => {
            const level = parseInt(e.target.value);
            if (level === 0) {
              editor.chain().focus().clearNodes().run();
            } else {
              editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run();
            }
          }}
          className="px-3 py-2 border border-[#e0e0e0] bg-white text-[#333] text-xs tracking-[1px] uppercase focus:outline-none focus:border-[#333] transition-colors"
        >
          <option value="0">Paragraph</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
          <option value="4">Heading 4</option>
          <option value="5">Heading 5</option>
          <option value="6">Heading 6</option>
        </select>

        {/* Bold, Italic, Strike */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-4 py-2 border border-[#e0e0e0] text-xs font-bold tracking-[1px] uppercase transition-colors ${
            editor.isActive('bold') ? 'bg-[#333] text-white border-[#333]' : 'bg-white text-[#333] hover:bg-[#f5f5f5]'
          }`}
        >
          B
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-4 py-2 border border-[#e0e0e0] text-xs italic tracking-[1px] uppercase transition-colors ${
            editor.isActive('italic') ? 'bg-[#333] text-white border-[#333]' : 'bg-white text-[#333] hover:bg-[#f5f5f5]'
          }`}
        >
          I
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-4 py-2 border border-[#e0e0e0] text-xs line-through tracking-[1px] uppercase transition-colors ${
            editor.isActive('strike') ? 'bg-[#333] text-white border-[#333]' : 'bg-white text-[#333] hover:bg-[#f5f5f5]'
          }`}
        >
          S
        </button>

        {/* Lists */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-4 py-2 border border-[#e0e0e0] text-xs tracking-[1px] uppercase transition-colors ${
            editor.isActive('bulletList') ? 'bg-[#333] text-white border-[#333]' : 'bg-white text-[#333] hover:bg-[#f5f5f5]'
          }`}
        >
          •
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-4 py-2 border border-[#e0e0e0] text-xs tracking-[1px] uppercase transition-colors ${
            editor.isActive('orderedList') ? 'bg-[#333] text-white border-[#333]' : 'bg-white text-[#333] hover:bg-[#f5f5f5]'
          }`}
        >
          1.
        </button>

        {/* Link */}
        <button
          onClick={() => {
            const url = window.prompt('Enter URL:');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          className={`px-4 py-2 border border-[#e0e0e0] text-xs tracking-[1px] uppercase transition-colors ${
            editor.isActive('link') ? 'bg-[#333] text-white border-[#333]' : 'bg-white text-[#333] hover:bg-[#f5f5f5]'
          }`}
        >
          Link
        </button>

        {/* Image */}
        <button
          onClick={() => {
            const url = window.prompt('Enter image URL:');
            if (url) {
              editor.chain().focus().setImage({ src: url }).run();
            }
          }}
          className="px-4 py-2 border border-[#e0e0e0] bg-white text-[#333] text-xs tracking-[1px] uppercase hover:bg-[#f5f5f5] transition-colors"
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
        >
          YouTube
        </button>

        {/* Font Family */}
        <select
          onChange={(e) => {
            const fontFamily = e.target.value;
            if (fontFamily === 'default') {
              editor.chain().focus().unsetFontFamily().run();
            } else {
              editor.chain().focus().setFontFamily(fontFamily).run();
            }
          }}
          className="px-3 py-2 border border-[#e0e0e0] bg-white text-[#333] text-xs tracking-[1px] uppercase focus:outline-none focus:border-[#333] transition-colors"
        >
          <option value="default">Font</option>
          <option value="Arial">Arial</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
          <option value="Verdana">Verdana</option>
        </select>

        {/* Font Size */}
        <select
          onChange={(e) => {
            const fontSize = e.target.value;
            if (fontSize === 'default') {
              editor.chain().focus().unsetFontSize().run();
            } else {
              editor.chain().focus().setFontSize(fontSize).run();
            }
          }}
          className="px-3 py-2 border border-[#e0e0e0] bg-white text-[#333] text-xs tracking-[1px] uppercase focus:outline-none focus:border-[#333] transition-colors"
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

        {/* Text Color */}
        <input
          type="color"
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          className="w-12 h-10 border border-[#e0e0e0] cursor-pointer"
          title="Text Color"
        />
      </div>

      {/* Editor Content */}
      <div className="bg-white min-h-[400px] p-6">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

