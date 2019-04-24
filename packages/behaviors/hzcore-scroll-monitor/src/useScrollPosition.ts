import {useState, useEffect} from 'react';
import {getNearestScrollNode, getScrollRect} from './utils';
import useRefCallback, {InnerRef} from '@hzcore/hook-ref-callback';

const SCROLL = 'scroll';
const LISTENER_OPTIONS: AddEventListenerOptions = {passive: true};
const INITIAL_SCROLL_POSITION: ScrollPosition = {top: null, left: null};

export interface ScrollPosition {
  top: number | null;
  left: number | null;
}

function getScrollPosition(event: Event): ScrollPosition {
  const target = event.currentTarget;
  if (target instanceof HTMLElement || target instanceof Document) {
    const rect = getScrollRect(target);
    return {top: rect.top, left: rect.left};
  }
  return {top: null, left: null};
}

export default function useScrollPosition(
  /**
   * An optional ref object or callback ref.
   * Useful when the component needs to handle ref forwarding.
   */
  innerRef?: InnerRef<HTMLElement> | null,
): [ScrollPosition, (node: HTMLElement | null) => void] {
  let [scrollPosition, setScrollPosition] = useState(INITIAL_SCROLL_POSITION);
  let [ref, refCallback] = useRefCallback(innerRef);
  const scrollingElement = getNearestScrollNode(ref.current);

  useEffect(() => {
    const handler = (event: Event): void => {
      const position = getScrollPosition(event);
      setScrollPosition(position);
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

  return [scrollPosition, refCallback];
}
