import { Node, type CommandProps, type RawCommands } from '@tiptap/core';

export interface ImageGalleryAttributes {
  layout: 'grid' | 'masonry' | 'sidebyside' | 'stacked';
  columns?: number;
  gap?: string;
}

export const ImageGallery = Node.create({
  name: 'imageGallery',
  group: 'block',
  content: 'image*',

  addAttributes() {
    return {
      layout: {
        default: 'grid',
        parseHTML: (element) => {
          if (typeof element === 'string') return 'grid';
          const el = element as HTMLElement;
          const layout = el.getAttribute('data-layout') || el.className.match(/image-gallery-(\w+)/)?.[1];
          return layout || 'grid';
        },
        renderHTML: (attributes) => {
          return {
            'data-layout': attributes.layout,
          };
        },
      },
      columns: {
        default: 2,
        parseHTML: (element) => {
          if (typeof element === 'string') return 2;
          const el = element as HTMLElement;
          const cols = el.getAttribute('data-columns');
          return cols ? parseInt(cols, 10) : 2;
        },
        renderHTML: (attributes) => {
          if (attributes.columns) {
            return {
              'data-columns': attributes.columns.toString(),
            };
          }
          return {};
        },
      },
      gap: {
        default: '1rem',
        parseHTML: (element) => {
          if (typeof element === 'string') return '1rem';
          const el = element as HTMLElement;
          const style = el.getAttribute('style') || '';
          const gapMatch = style.match(/gap:\s*([^;]+)/);
          return gapMatch ? gapMatch[1].trim() : '1rem';
        },
        renderHTML: () => {
          return {};
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[class*="image-gallery"]',
        getAttrs: (node: string | HTMLElement): Partial<ImageGalleryAttributes> | false => {
          if (typeof node === 'string') return false;
          const element = node as HTMLElement;
          const layout = element.className.match(/image-gallery-(\w+)/)?.[1] || 'grid';
          const columns = element.getAttribute('data-columns') ? parseInt(element.getAttribute('data-columns') || '2', 10) : 2;
          const style = element.getAttribute('style') || '';
          const gapMatch = style.match(/gap:\s*([^;]+)/);
          const gap = gapMatch ? gapMatch[1].trim() : '1rem';
          
          return {
            layout: layout as 'grid' | 'masonry' | 'sidebyside' | 'stacked',
            columns,
            gap,
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const attrs = node.attrs as ImageGalleryAttributes;
    const layout = attrs.layout || HTMLAttributes?.layout || 'grid';
    const columns = attrs.columns || HTMLAttributes?.columns || 2;
    const gap = attrs.gap || HTMLAttributes?.gap || '1rem';
    
    console.log('ImageGallery renderHTML - layout:', layout, 'columns:', columns, 'gap:', gap);
    
    const layoutStyles: Record<string, string> = {
      grid: `display: grid; grid-template-columns: repeat(${columns}, auto); column-gap: 0; row-gap: ${gap}; margin: 1rem 0; justify-content: center;`,
      masonry: `display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: ${gap}; margin: 1rem 0;`,
      sidebyside: `display: flex; gap: ${gap}; margin: 1rem 0; flex-wrap: wrap;`,
      stacked: `display: flex; flex-direction: column; gap: ${gap}; margin: 1rem 0;`,
    };

    return [
      'div',
      {
        class: `image-gallery image-gallery-${layout}`,
        style: layoutStyles[layout],
        'data-layout': layout,
        'data-columns': columns.toString(),
      },
      0,
    ];
  },
});

