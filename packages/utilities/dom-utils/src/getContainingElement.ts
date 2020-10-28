import isClient from './isClient';
import isDOMInstance from './isDOMInstance';
import findAncestor from './findAncestor';

/**
 * The containing element may be the nearest ancestor element
 * that has any of the following:
 *
 * 1. A position value other than static
 *    (fixed, absolute, relative, or sticky)
 * 2. A transform value other than none
 * 3. A will-change value of transform
 */
export default function getContainingElement(
  node: Node | null,
): HTMLElement | null {
  if (!isClient) return null;
  if (!isDOMInstance<HTMLElement>(node, HTMLElement)) return null;
  const ancestor = findAncestor(node.parentElement, (node) => {
    const {position, transform, willChange} = getComputedStyle(node);
    if (position) {
      switch (position) {
        case 'static':
        case 'initial':
        case 'unset': {
          return false;
        }
        default: {
          return true;
        }
      }
    }
    if (transform) {
      switch (transform) {
        case 'none':
        case 'initial':
        case 'unset': {
          return false;
        }
        default: {
          return true;
        }
      }
    }
    if (/transform/.test(willChange)) return true;
    return false;
  });
  return ancestor ?? node.ownerDocument?.documentElement ?? null;
}
