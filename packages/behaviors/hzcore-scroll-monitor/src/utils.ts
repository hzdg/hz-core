import ZenObservable from 'zen-observable';
import $$observable from 'symbol-observable';
import invariant from 'invariant';

import {ScrollRect, ViewportChange} from './types';

export class Observable<T> extends ZenObservable<T> {
  // rxjs interopt
  [$$observable](): Observable<T> {
    return this;
  }
}

export function getScrollRect(element: HTMLElement | Document): ScrollRect {
  const scrollingElement =
    'scrollingElement' in element ? element.scrollingElement : element;
  invariant(
    scrollingElement,
    `The provided element ${element} is not a scrolling element!`,
  );
  const {
    scrollTop: top,
    scrollLeft: left,
    scrollWidth: width,
    scrollHeight: height,
  } = scrollingElement as Element;
  return {top, left, width, height};
}

export function getViewportChanges(
  entries: IntersectionObserverEntry[],
): ViewportChange[] {
  return entries.map(({target, intersectionRatio, isIntersecting}) => ({
    target,
    ratio: intersectionRatio,
    inViewport: isIntersecting,
  }));
}

function random(): number {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto)
    return crypto.getRandomValues(new Uint8Array(1))[0] % 16;
  return Math.random() * 16;
}

// Adapted from https://gist.github.com/jed/982883
export function uuid(): string {
  return `${1e7}-${1e3}-${4e3}-${8e3}-${1e11}`.replace(/[018]/g, (c: unknown) =>
    ((c as number) ^ (random() >> ((c as number) / 4))).toString(16),
  );
}

export type NodeLike = Node | {node: Node} | {element: Node};

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
