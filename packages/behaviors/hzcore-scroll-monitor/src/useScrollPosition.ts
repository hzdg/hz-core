import {useEffect, useRef} from 'react';
import {
  getScrollRect,
  useNearestScrollNodeRef,
  useScrollEffect,
  useSyncRef,
} from './utils';

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
 * If a `providedRef` is passed to `useScrollPosition`,
 * returns `undefined`.
 *
 * If no `providedRef` is passed, returns a `ref` object.
 * The `ref` should be passed to an underlying DOM node.
 * Note that the node does not have to be scrollable itself,
 * as `useScrollPosition` will traverse the DOM to find a scrollable parent
 * to observe.
 */
function useScrollPosition<T extends HTMLElement>(
  handler: (position: ScrollPosition) => void,
): React.RefObject<T>;
function useScrollPosition<T extends HTMLElement>(
  handler: (position: ScrollPosition) => void,
  providedRef: React.RefObject<T>,
): void;
function useScrollPosition<T extends HTMLElement>(
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
   * An optional ref to use.
   * If provided, `useScrollPosition` will not return a ref.
   * Useful when the component needs to handle ref forwarding.
   */
  providedRef?: React.RefObject<T>,
): React.RefObject<T> | void {
  const ref = useSyncRef(providedRef);
  const scrollRef = useNearestScrollNodeRef(ref);
  const changeHandler = useRef(handler);
  changeHandler.current = handler;

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

  if (!providedRef) return ref;
}

export default useScrollPosition;
