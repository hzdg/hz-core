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
