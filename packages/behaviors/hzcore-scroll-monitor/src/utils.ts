import invariant from 'invariant';

export interface ScrollRect {
  top: number | null;
  left: number | null;
  width: number | null;
  height: number | null;
}

export type NodeLike = Node | {node: Node} | {element: Node};

export function getScrollRect(element: HTMLElement | Document): ScrollRect {
  let scrollingElement: Element;
  if ('scrollingElement' in element && element.scrollingElement) {
    scrollingElement = element.scrollingElement;
  } else if ('body' in element) {
    scrollingElement = element.body;
  } else {
    scrollingElement = element;
  }
  invariant(
    scrollingElement,
    `The provided element ${element} is not a scrolling element!`,
  );
  const {
    scrollTop: top,
    scrollLeft: left,
    scrollWidth: width,
    scrollHeight: height,
  } = scrollingElement;
  return {top, left, width, height};
}

export function getNode(node: NodeLike | null): Node | null {
  if (node) {
    node = 'node' in node ? node.node : node;
    node = 'element' in node ? node.element : node;
  }
  return node;
}

export function getNearestScrollNode(
  node: NodeLike | null,
): HTMLElement | Document | null {
  node = getNode(node);
  if (node instanceof Document) return node;
  if (!(node instanceof HTMLElement)) return null;

  const {overflowX, overflowY} = window.getComputedStyle(node);
  if (overflowX === 'scroll' || overflowY === 'scroll') return node;

  return getNearestScrollNode(node.parentNode) || document;
}
