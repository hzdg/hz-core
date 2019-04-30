import {useState, useEffect, useRef, useCallback} from 'react';
import useRefCallback, {InnerRef} from '@hzcore/hook-ref-callback';
import {useNearestScrollNode} from './utils';

const SCROLL_TIMEOUT = 60;
const SCROLL = 'scroll';
const LISTENER_OPTIONS: AddEventListenerOptions = {passive: true};

/**
 * A React hook for components that care about whether or not
 * the nearest scrollable container is scrolling.
 *
 * @returns {[boolean, (node: HTMLElement | null) => void]}
 */
export default function useScrolling(
  /**
   * An optional ref object or callback ref.
   * Useful when the component needs to handle ref forwarding.
   */
  innerRef?: InnerRef<HTMLElement> | null,
): [boolean, (node: HTMLElement | null) => void] {
  // Keep track of whether or not the nearest scrollable container is scrolling.
  let [scrolling, setScrolling] = useState(false);

  // Keep a ref to the nearest scrollable container.
  let [ref, refCallback] = useRefCallback(innerRef);
  const scrollingElement = useNearestScrollNode(ref);
  // Keep a ref to a timeout id.
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  // A callback to clear the scroll timeout.
  const clearScrollTimeout = useCallback((): void => {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
      scrollTimeout.current = null;
    }
  }, []);

  // A callback to clear the scroll timeout and flip `scrolling` to false.
  const stopScrolling = useCallback((): void => {
    clearScrollTimeout();
    setScrolling(false);
  }, [clearScrollTimeout]);

  // A callback to start the scroll timeout and flip `scrolling` to true.
  const startScrolling = useCallback((): void => {
    clearScrollTimeout();
    setScrolling(true);
    scrollTimeout.current = setTimeout(stopScrolling, SCROLL_TIMEOUT);
  }, [clearScrollTimeout, stopScrolling]);

  // Make sure we clear the timeout when we unmount.
  useEffect(() => clearScrollTimeout(), [clearScrollTimeout]);

  // Subscribe to scroll events on the nearest scrolling element,
  // calling the `startScrolling` callback whenever a scroll event occurs.
  useEffect(() => {
    if (scrollingElement) {
      scrollingElement.addEventListener(
        SCROLL,
        startScrolling,
        LISTENER_OPTIONS,
      );
    }
    return () => {
      if (scrollingElement) {
        scrollingElement.removeEventListener(
          SCROLL,
          startScrolling,
          LISTENER_OPTIONS,
        );
      }
    };
  }, [scrollingElement, startScrolling]);

  return [scrolling, refCallback];
}
