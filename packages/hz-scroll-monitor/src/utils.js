// @flow
import ZenObservable from 'zen-observable';
import $$observable from 'symbol-observable';
import type {RegistrationConfig, ScrollRect, ViewportChange} from './types';

// rxjs interopt
export class Observable extends ZenObservable {
  [$$observable]() {
    return this;
  }
}

export function hasScrollBoundEvent(config: RegistrationConfig): Boolean {
  return Object.keys(config).length > 2 || !hasIntersectionBoundEvent(config);
}

export function hasIntersectionBoundEvent(config: RegistrationConfig): Boolean {
  // eslint-disable-next-line eqeqeq
  return config.viewport !== false && config.viewport != null;
}

export function getScrollRect(element: HTMLElement): ScrollRect {
  const {scrollingElement = element} = element;
  const {
    scrollTop: top,
    scrollLeft: left,
    scrollWidth: width,
    scrollHeight: height,
  } = scrollingElement;
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
