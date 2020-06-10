import {useRef, useMemo} from 'react';

type NodeLike = Node | {node: Node} | {element: Node};

const isClient =
  typeof window !== 'undefined' &&
  typeof Document !== 'undefined' &&
  typeof HTMLElement !== 'undefined';

function getNode(node: NodeLike | null): NodeLike | null {
  if (node) {
    node = 'node' in node ? node.node : node;
    node = 'element' in node ? node.element : node;
  }
  return node;
}

function findAncestor(
  node: HTMLElement | null,
  predicate: (node: HTMLElement) => boolean,
): HTMLElement | null {
  while (node) {
    if (predicate(node)) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

function getContainingElement(node: HTMLElement | null): HTMLElement | null {
  if (!isClient) return null;
  node = getNode(node) as HTMLElement;
  if (!node) return null;
  /**
   * The containing element may be the nearest ancestor element
   * that has any of the following:
   *
   * 1. A position value other than static
   *    (fixed, absolute, relative, or sticky)
   * 2. A transform value other than none
   * 3. A will-change value of transform
   */
  const ancestor = findAncestor(node.parentElement, node => {
    const {position, transform, willChange} = getComputedStyle(node);
    if (position && position !== 'static') return true;
    if (transform && transform !== 'none') return true;
    if (/transform/.test(willChange)) return true;
    return false;
  });
  return ancestor || document.documentElement;
}

function isDescendantOf(
  maybeAncestor: HTMLElement | null,
  node: HTMLElement | null,
): boolean {
  if (!maybeAncestor || !node) return false;
  if (maybeAncestor === node) return false;
  let parent = node.parentElement;
  while (parent) {
    if (parent === maybeAncestor) return true;
    parent = parent.parentElement;
  }
  return false;
}

/**
 * `useContainingElementRef` is a React hook for finding
 * the containing block element of a DOM node.
 *
 * Returns a `RefObject` pointing the containing block element, or `null`.
 */
export default function useContainingElementRef(
  /** A ref to a DOM Element. */
  ref: React.RefObject<HTMLElement>,
  scrollNodeRef: React.RefObject<HTMLElement>,
): React.RefObject<HTMLElement> {
  const {current} = ref;
  const {current: scrollNode} = scrollNodeRef;
  const containingElementRef = useRef<HTMLElement | null>(null);
  containingElementRef.current = useMemo(() => {
    const candidate = getContainingElement(current);
    if (isDescendantOf(scrollNode, candidate)) {
      return candidate;
    }
    return null;
  }, [current, scrollNode]);
  return containingElementRef;
}
