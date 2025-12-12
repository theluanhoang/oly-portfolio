import { Node, type CommandProps, type RawCommands } from '@tiptap/core';

export interface IframeAttributes {
  src: string | null;
  width: string;
  height: string;
  frameborder: string;
  allow: string;
  allowfullscreen: boolean;
  title: string | null;
  referrerpolicy: string;
}

export const Iframe = Node.create({
  name: 'iframe',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: '100%',
      },
      height: {
        default: '400',
      },
      frameborder: {
        default: '0',
      },
      allow: {
        default: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
      },
      allowfullscreen: {
        default: true,
      },
      title: {
        default: null,
      },
      referrerpolicy: {
        default: 'strict-origin-when-cross-origin',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'iframe',
        getAttrs: (node: string | HTMLElement): IframeAttributes | false => {
          if (typeof node === 'string') return false;
          const element = node as HTMLElement;
          return {
            src: element.getAttribute('src'),
            width: element.getAttribute('width') || '100%',
            height: element.getAttribute('height') || '400',
            frameborder: element.getAttribute('frameborder') || '0',
            allow: element.getAttribute('allow') || 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
            allowfullscreen: element.hasAttribute('allowfullscreen'),
            title: element.getAttribute('title'),
            referrerpolicy: element.getAttribute('referrerpolicy') || 'strict-origin-when-cross-origin',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Partial<IframeAttributes> }): [string, Partial<IframeAttributes>] {
    // Ensure all attributes are properly set
    const attrs: Partial<IframeAttributes> = {
      ...HTMLAttributes,
      src: HTMLAttributes.src || null,
      width: HTMLAttributes.width || '100%',
      height: HTMLAttributes.height || '400',
      frameborder: HTMLAttributes.frameborder || '0',
    };

    // Ensure src is set
    if (!attrs.src) {
      console.warn('Iframe renderHTML: src is missing!', HTMLAttributes);
    } else {
      console.log('Iframe renderHTML: rendering iframe with src:', attrs.src);
    }

    if (HTMLAttributes.allow) {
      attrs.allow = HTMLAttributes.allow;
    }

    if (HTMLAttributes.referrerpolicy) {
      attrs.referrerpolicy = HTMLAttributes.referrerpolicy;
    }

    if (HTMLAttributes.title) {
      attrs.title = HTMLAttributes.title;
    }

    if (HTMLAttributes.allowfullscreen === false) {
      delete attrs.allowfullscreen;
    } else {
      attrs.allowfullscreen = true;
    }
    
    // Remove undefined/null values (but keep src even if it's null for now to debug)
    (Object.keys(attrs) as Array<keyof IframeAttributes>).forEach(key => {
      if (attrs[key] === null || attrs[key] === undefined) {
        if (key !== 'src') {
          delete attrs[key];
        }
      }
    });
    
    console.log('Iframe renderHTML: final attrs:', attrs);
    return ['iframe', attrs];
  },

  addCommands(): Partial<RawCommands> {
    return {
      setIframe: (options: Partial<IframeAttributes>) => ({ commands }: CommandProps) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    } as Partial<RawCommands>;
  },
});

