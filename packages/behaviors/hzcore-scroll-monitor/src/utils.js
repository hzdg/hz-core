// @flow
import ZenObservable from 'zen-observable';
import $$observable from 'symbol-observable';

import type {ScrollRect, ViewportChange} from './types';

export class Observable extends ZenObservable {
  // rxjs interopt
  // $FlowFixMe: Computed property keys not supported.
  [$$observable]() {
    return this;
  }
}

export function getScrollRect(element: HTMLElement | Document): ScrollRect {
  const {scrollingElement = element} = (element: any);
  const {
    scrollTop: top,
    scrollLeft: left,
    scrollWidth: width,
    scrollHeight: height,
  } = ((scrollingElement: any): HTMLElement);
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

function random() {
  // $FlowFixMe: crypto can't be resolved
  if (typeof crypto === 'undefined') return Math.random() * 16;
  if (typeof crypto.randomBytes === 'undefined')
    return crypto.getRandomValues(new Uint8Array(1))[0] % 16;
  return crypto.randomBytes(1)[0] % 16;
}

// Adapted from https://gist.github.com/jed/982883
export function uuid(): string {
  return (([1e7]: any) + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ (random() >> (c / 4))).toString(16),
  );
}
