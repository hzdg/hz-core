import {useState, useEffect} from 'react';
import {getNearestScrollNode} from './utils';
import useRefCallback, {InnerRef} from '@hzcore/hook-ref-callback';

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
  let [scrolling, setScrolling] = useState(false);
  let [ref, refCallback] = useRefCallback(innerRef);
  const scrollingElement = getNearestScrollNode(ref.current);

  useEffect(() => {
    let scrollTimeoutPending: NodeJS.Timeout | false | null;

    const handleScrollTimeout = (): void => {
      if (scrollTimeoutPending) {
        clearTimeout(scrollTimeoutPending);
        scrollTimeoutPending = false;
      }
      setScrolling(false);
    };

    const handler = (): void => {
      if (scrollTimeoutPending) {
        clearTimeout(scrollTimeoutPending);
        scrollTimeoutPending = false;
      }
      setScrolling(true);
      scrollTimeoutPending = setTimeout(handleScrollTimeout, SCROLL_TIMEOUT);
    };

    if (scrollingElement) {
      scrollingElement.addEventListener(SCROLL, handler, LISTENER_OPTIONS);
    }
    return () => {
      if (scrollingElement) {
        scrollingElement.removeEventListener(SCROLL, handler, LISTENER_OPTIONS);
      }
      if (scrollTimeoutPending) {
        clearTimeout(scrollTimeoutPending);
        scrollTimeoutPending = false;
      }
    };
  }, [scrollingElement]);

  return [scrolling, refCallback];
}
