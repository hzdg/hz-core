import {useState, useEffect, useRef} from 'react';
import useRefCallback, {InnerRef} from '@hzcore/hook-ref-callback';
import {ScrollPosition, getScrollPosition} from './useScrollPosition';
import {useNearestScrollNode} from './utils';

const SCROLL = 'scroll';
const LISTENER_OPTIONS: AddEventListenerOptions = {passive: true};
const INITIAL_SCROLL_DIRECTION: ScrollDirection = {
  vertical: null,
  horizontal: null,
};

export const DOWN = 'down';
export const UP = 'up';
export const LEFT = 'left';
export const RIGHT = 'right';

export type VerticalScrollDirection = typeof DOWN | typeof UP;

export type HorizontalScrollDirection = typeof LEFT | typeof RIGHT;

export interface ScrollDirection {
  /**
   * The direction the nearest scrollable container
   * most recently scrolled vertically,
   * where 'direction' is either 'up' or 'down'.
   */
  vertical: VerticalScrollDirection | null;
  /**
   * The direction the nearest scrollable container
   * most recently scrolled horizontally,
   * where 'direction' is either 'left' or 'right'.
   */
  horizontal: HorizontalScrollDirection | null;
}

export function getScrollDirection(
  position: ScrollPosition,
  lastPosition: ScrollPosition | null,
): ScrollDirection {
  if (lastPosition) {
    const vertical =
      typeof position.top === 'number' &&
      typeof lastPosition.top === 'number' &&
      lastPosition.top < position.top
        ? DOWN
        : UP;
    const horizontal =
      typeof position.left === 'number' &&
      typeof lastPosition.left === 'number' &&
      lastPosition.left < position.left
        ? RIGHT
        : LEFT;
    return {vertical, horizontal};
  } else {
    const vertical = typeof position.top === 'number' ? DOWN : UP;
    const horizontal = typeof position.left === 'number' ? RIGHT : LEFT;
    return {vertical, horizontal};
  }
}

/**
 * A React hook for components that care about
 * the nearest scrollable container's scroll direction.
 *
 * @returns {[ScrollDirection, (node: HTMLElement | null) => void]}
 */
export default function useScrollDirection(
  /**
   * An optional ref object or callback ref.
   * Useful when the component needs to handle ref forwarding.
   */
  innerRef?: InnerRef<HTMLElement> | null,
): [ScrollDirection, (node: HTMLElement | null) => void] {
  const [ref, refCallback] = useRefCallback(innerRef);
  const scrollingElement = useNearestScrollNode(ref);
  const scrollPosition = useRef<ScrollPosition | null>(null);
  const [scrollDirection, setScrollDirection] = useState(
    INITIAL_SCROLL_DIRECTION,
  );

  useEffect(() => {
    const handler = (event: Event): void => {
      const position = getScrollPosition(event);
      const direction = getScrollDirection(position, scrollPosition.current);
      scrollPosition.current = position;
      setScrollDirection(direction);
    };

    if (scrollingElement) {
      scrollingElement.addEventListener(SCROLL, handler, LISTENER_OPTIONS);
    }
    return () => {
      if (scrollingElement) {
        scrollingElement.removeEventListener(SCROLL, handler, LISTENER_OPTIONS);
      }
    };
  }, [scrollPosition, scrollingElement]);

  return [scrollDirection, refCallback];
}
