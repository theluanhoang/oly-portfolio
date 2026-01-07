import {
  Bold,
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ImageUp,
  Italic,
  Link,
  List,
  ListOrdered,
  Table,
  Video,
  Strikethrough,
  Subscript,
  Superscript,
  Type,
  Underline,
  Undo2,
  Redo2,
} from 'lucide-react';
import type { SVGProps } from 'react';

// Icons adapted from @reactjs-tiptap-editor to match its toolbar visuals

export function IconColorFill(props: SVGProps<SVGSVGElement>) {
  const { fill, ...rest } = props as SVGProps<SVGSVGElement> & { fill?: string };

  return (
    <svg
      height="18px"
      width="18px"
      viewBox="0 0 240 240"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <g fill="none" fillRule="evenodd" stroke="none" strokeWidth={1}>
        <g transform="translate(0.000000, 0.500000)">
          <g transform="translate(39.000000, 17.353553)">
            <path
              d="M11,201.146447 L167,201.146447 C173.075132,201.146447 178,206.071314 178,212.146447 C178,218.221579 173.075132,223.146447 167,223.146447 L11,223.146447 C4.92486775,223.146447 7.43989126e-16,218.221579 0,212.146447 C-7.43989126e-16,206.071314 4.92486775,201.146447 11,201.146447 Z"
              fill={typeof (fill as string | undefined) === 'string' ? (fill as string) : '#000'}
              fillRule="evenodd"
            />
            <path
              d="M72.3425855,16.8295583 C75.799482,7.50883712 86.1577877,2.75526801 95.4785089,6.21216449 C100.284516,7.99463061 104.096358,11.7387855 105.968745,16.4968188 L106.112518,16.8745422 L159.385152,161.694068 C161.291848,166.877345 158.635655,172.624903 153.452378,174.531599 C148.358469,176.405421 142.719567,173.872338 140.716873,168.864661 L140.614848,168.598825 L89.211,28.86 L37.3759214,168.623816 C35.4885354,173.712715 29.8981043,176.351047 24.7909589,174.617647 L24.5226307,174.522368 C19.4337312,172.634982 16.7953993,167.044551 18.5287999,161.937406 L18.6240786,161.669077 L72.3425855,16.8295583 Z"
              fill="currentColor"
              fillRule="nonzero"
            />
            <path
              d="M121,103.146447 C126.522847,103.146447 131,107.623599 131,113.146447 C131,118.575687 126.673329,122.994378 121.279905,123.142605 L121,123.146447 L55,123.146447 C49.4771525,123.146447 45,118.669294 45,113.146447 C45,107.717207 49.3266708,103.298515 54.7200952,103.150288 L55,103.146447 L121,103.146447 Z"
              fill="currentColor"
              fillRule="nonzero"
            />
          </g>
        </g>
      </g>
    </svg>
  );
}

export function PhHighlighter(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      height="1em"
      width="1em"
      viewBox="0 0 256 256"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M253.66 106.34a8 8 0 0 0-11.32 0L192 156.69L107.31 72l50.35-50.34a8 8 0 1 0-11.32-11.32L96 60.69a16 16 0 0 0-2.82 18.81L72 100.69a16 16 0 0 0 0 22.62l4.69 4.69l-58.35 58.34a8 8 0 0 0 3.13 13.25l72 24A7.9 7.9 0 0 0 96 224a8 8 0 0 0 5.66-2.34L136 187.31l4.69 4.69a16 16 0 0 0 22.62 0l21.19-21.18a16 16 0 0 0 18.81-2.82l50.35-50.34a8 8 0 0 0 0-11.32M93.84 206.85l-55-18.35L88 139.31L124.69 176ZM152 180.69L83.31 112L104 91.31L172.69 160Z"
        fill="currentColor"
      />
    </svg>
  );
}

// Icon pack mirrored from @reactjs-tiptap-editor to keep visual parity
export const tiptapIcons = {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link,
  Image: ImageUp,
  Highlighter: PhHighlighter,
  TextColor: IconColorFill,
  Type,
  Undo2,
  Redo2,
  Table,
  Video,
};

export type TiptapIconKey = keyof typeof tiptapIcons;