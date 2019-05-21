import {useEffect, useRef} from 'react';
import useRefCallback, {InnerRef} from '@hzcore/hook-ref-callback';
import {getScrollRect, useNearestScrollNode} from './utils';

const SCROLL = 'scroll';
const LISTENER_OPTIONS: AddEventListenerOptions = {passive: true};

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

export function getScrollPosition(event: Event): ScrollPosition {
  const target = event.currentTarget;
  if (target instanceof HTMLElement || target instanceof Document) {
    const rect = getScrollRect(target);
    return {top: rect.top, left: rect.left};
  }
  return {top: null, left: null};
}

/**
 * A React hook for components that care about
 * the nearest scrollable container's scroll position..
 *
 * @returns {node: HTMLElement | null) => void}
 */
export default function useScrollPosition(
  /**
   * An optional scroll position handler
   * Useful when the component needs to handle ref forwarding.
   */
  handler: (position: ScrollPosition) => void,
  /**
   * An optional ref object or callback ref.
   * Useful when the component needs to handle ref forwarding.
   */
  innerRef?: InnerRef<HTMLElement> | null,
): (node: HTMLElement | null) => void {
  let [ref, refCallback] = useRefCallback(innerRef);
  const scrollingElement = useNearestScrollNode(ref);
  const changeHandler = useRef(handler);

  useEffect(() => {
    const handler = (event: Event): void => {
      const position = getScrollPosition(event);
      const cb = changeHandler.current;
      cb(position);
    };

    if (scrollingElement) {
      scrollingElement.addEventListener(SCROLL, handler, LISTENER_OPTIONS);
    }
    return () => {
      if (scrollingElement) {
        scrollingElement.removeEventListener(SCROLL, handler, LISTENER_OPTIONS);
      }
    };
  }, [scrollingElement]);

  return refCallback;
}
