/**
 * stripInlineStyles
 *
 * When the user applies a block-level style (e.g. color, fontSize), the block's
 * CSS property should "win" over any inline styles previously applied to individual
 * words via execCommand.  We achieve this by removing the conflicting inline CSS
 * property from every descendant element in the stored HTML.
 *
 * Must only be called on the client (uses DOMParser / document.createElement).
 */

// Map from ElementStyle keys → CSS property names used in inline `style` attributes
const STYLE_KEY_TO_CSS: Record<string, string[]> = {
  color:           ['color'],
  fontFamily:      ['font-family'],
  fontSize:        ['font-size'],
  fontWeight:      ['font-weight'],
  fontStyle:       ['font-style'],
  textDecoration:  ['text-decoration'],
  lineHeight:      ['line-height'],
  letterSpacing:   ['letter-spacing'],
};

/**
 * Strips the given ElementStyle keys from all inline `style` attributes (and
 * matching HTML attributes like `<font color>`) within an HTML string.
 *
 * Returns the cleaned HTML string.
 */
export function stripInlineStyles(
  html: string,
  styleKeys: string[],
): string {
  if (!html || styleKeys.length === 0) return html;
  if (typeof window === 'undefined') return html; // SSR guard

  const cssProps = styleKeys.flatMap((k) => STYLE_KEY_TO_CSS[k] ?? []);
  if (cssProps.length === 0) return html;

  const container = document.createElement('div');
  container.innerHTML = html;

  // 1. Strip matching CSS properties from every [style] element
  container.querySelectorAll<HTMLElement>('[style]').forEach((el) => {
    cssProps.forEach((prop) => el.style.removeProperty(prop));
    // Remove the attribute entirely if it became empty
    const remaining = el.getAttribute('style');
    if (!remaining || remaining.trim() === '') {
      el.removeAttribute('style');
    }
  });

  // 2. Remove <font color="..."> when we're stripping `color`
  if (styleKeys.includes('color')) {
    container.querySelectorAll('font[color]').forEach((el) => {
      el.removeAttribute('color');
      // If <font> has no remaining attributes, unwrap it
      if (el.attributes.length === 0) {
        const parent = el.parentNode;
        while (el.firstChild) parent?.insertBefore(el.firstChild, el);
        parent?.removeChild(el);
      }
    });
  }

  return container.innerHTML;
}
