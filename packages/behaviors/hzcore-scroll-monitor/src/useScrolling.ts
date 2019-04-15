import React, {useState, useEffect} from 'react';
import {getNearestScrollNode} from './utils';
import useRefCallback from '@hzcore/hook-ref-callback';

const SCROLL_TIMEOUT = 60;
const SCROLL = 'scroll';
const LISTENER_OPTIONS: AddEventListenerOptions = {passive: true};

export interface UseScrollingConfig {
  /**
   * Whether or not to actively listen for changes in scrolling state.
   */
  disabled: boolean;
  /**
   * An optional ref object or callback ref.
   * Useful when the component needs to handle ref forwarding.
   */
  ref?:
    | ((node: HTMLElement | null) => void)
    | React.MutableRefObject<HTMLElement | null>;
}

export default function useScrolling(
  {disabled, ref: innerRef}: UseScrollingConfig = {disabled: false},
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

    if (!disabled && scrollingElement) {
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
  }, [scrollingElement, disabled]);

  return [scrolling, refCallback];
}
