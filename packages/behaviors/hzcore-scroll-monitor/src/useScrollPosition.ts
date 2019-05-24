import {useEffect, useRef, createRef} from 'react';
import {getScrollRect, useNearestScrollNodeRef, useScrollEffect} from './utils';

/**
 * `ScrollPosition` is an object of `top` and `left` values,
 * where `top` is the number of pixels the nearest scrollable container
 * is scrolled vertically, and `left` is the number of pixels the
 * nearest scrollable container is scrolled horizontally.
 */
export interface ScrollPosition {
  /**
   * The number of pixels the nearest scrollable container
   * is scrolled vertically,
   */
  top: number | null;
  /**
   * The number of pixels the nearest scrollable container
   * is scrolled horizontally,
   */
  left: number | null;
}

/**
 * `getScrollPosition` returns a `ScrollPosition` for a given `Event` target.
 *
 * `ScrollPosition` will be an object of `top` and `left` values,
 * where `top` is the number of pixels the nearest scrollable container
 * is scrolled vertically, and `left` is the number of pixels the
 * nearest scrollable container is scrolled horizontally.
 */
export function getScrollPosition(event: Event): ScrollPosition {
  const target = event.currentTarget;
  if (target instanceof HTMLElement || target instanceof Document) {
    const rect = getScrollRect(target);
    return {top: rect.top, left: rect.left};
  }
  return {top: null, left: null};
}

/**
 * `useScrollPosition` is a React hook for components
 * that care about the nearest scrollable container's scroll position.
 *
 * Expects a `handler` that will receive a `ScrollPosition` each time the
 * nearest scrollable element's scroll position changes.
 *
 * Returns a `RefObject` that should be passed to an underlying DOM node.
 * Note that the node does not have to be scrollable itself,
 * as `useScrollPosition` will traverse the DOM to find a scrollable parent
 * to observe.
 */
export default function useScrollPosition(
  /**
   * `handler` will receive a `ScrollPosition` object each time
   * the nearest scrollable container's scroll position changes.
   *
   * `ScrollPosition` will be an object of `top` and `left` values,
   * where `top` is the number of pixels the nearest scrollable container
   * is scrolled vertically, and `left` is the number of pixels the
   * nearest scrollable container is scrolled horizontally.
   */
  handler: (position: ScrollPosition) => void,
  /**
   * An optional ref to use. If provided, this ref object will be
   * passed through as the returned value for `useScrollPosition`.
   * Useful when the component needs to handle ref forwarding.
   */
  ref: React.RefObject<HTMLElement> = createRef<HTMLElement>(),
): React.RefObject<HTMLElement> {
  const scrollRef = useNearestScrollNodeRef(ref);
  const changeHandler = useRef(handler);

  useEffect(function updateHandler() {
    changeHandler.current = handler;
  });

  useScrollEffect(
    scrollRef,
    /**
     * `handleEvent` will update the current change handler
     * with a new `ScrollPosition` whenever the nearest
     * scrollable container's scroll position changes.
     */
    function handleEvent(event: Event): void {
      const cb = changeHandler.current;
      if (typeof cb === 'function') {
        const position = getScrollPosition(event);
        cb(position);
      }
    },
    [],
  );

  return ref;
}
