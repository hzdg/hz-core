import {useState, useEffect, useRef, useCallback, createRef} from 'react';
import {useNearestScrollNodeRef, useScrollEffect} from './utils';

const SCROLL_TIMEOUT = 60;

/**
 * `useScrolling` is a React hook for components that care about
 * whether or not the nearest scrollable container is scrolling.
 *
 * Returns an array containing a `boolean` value indicating whether the
 * nearest scrollable container is scrolling, and a `RefObject`.
 *
 * The `RefObject` should be passed to an underlying DOM node.
 * Note that the node does not have to be scrollable itself,
 * as `useScrolling` will traverse the DOM to find a scrollable parent
 * to observe.
 */
export default function useScrolling(
  /**
   * An optional ref to use. If provided, this ref object will be
   * passed through as the returned value for `useScrolling`.
   * Useful when the component needs to handle ref forwarding.
   */
  ref: React.RefObject<HTMLElement> = createRef<HTMLElement>(),
): [boolean, React.RefObject<HTMLElement>] {
  // Keep track of whether or not the nearest scrollable container is scrolling.
  const [scrolling, setScrolling] = useState(false);

  // Keep a ref to the nearest scrollable container.
  const scrollRef = useNearestScrollNodeRef(ref);

  // Keep a ref to a timeout id.
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  /**
   * `clearScrollTimeout` will... uh... clear the scroll timeout.
   */
  const clearScrollTimeout = useCallback(function clearScrollTimeout() {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
      scrollTimeout.current = null;
    }
  }, []);

  /**
   * `stopScrolling` will clear the scroll timeout and
   * flip `scrolling` to `false`. This will be called when
   * the scroll timeout expires.
   */
  const stopScrolling = useCallback(
    function stopScrolling() {
      clearScrollTimeout();
      setScrolling(false);
    },
    [clearScrollTimeout],
  );

  /**
   * `startScrolling` will clear the scroll timeout,
   * flip `scrolling` to `true`, and start a new scroll timeout.
   */
  const startScrolling = useCallback(
    function startScrolling() {
      clearScrollTimeout();
      setScrolling(true);
      scrollTimeout.current = setTimeout(stopScrolling, SCROLL_TIMEOUT);
    },
    [clearScrollTimeout, stopScrolling],
  );

  useEffect(
    /**
     * `cleanup` will clear the scroll timeout when we unmount.
     */
    function cleanup() {
      clearScrollTimeout();
    },
    [clearScrollTimeout],
  );

  // Subscribe to scroll events on the nearest scrolling element,
  // calling the `startScrolling` callback whenever a scroll event occurs.
  useScrollEffect(scrollRef, startScrolling, [startScrolling]);

  return [scrolling, ref];
}
