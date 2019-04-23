import {useState, useEffect} from 'react';
import {getNearestScrollNode, getScrollRect} from './utils';
import useRefCallback, {InnerRef} from '@hzcore/hook-ref-callback';
import useScrollPosition, {ScrollPosition} from './useScrollPosition';

const SCROLL = 'scroll';
const LISTENER_OPTIONS: AddEventListenerOptions = {passive: true};
const INITIAL_SCROLL_POSITION: ScrollDirection = {
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
  vertical: VerticalScrollDirection | null;
  horizontal: HorizontalScrollDirection | null;
}

function getScrollDirection(
  event: Event,
  position: ScrollPosition,
): ScrollDirection {
  const target = event.currentTarget;
  if (target instanceof HTMLElement || target instanceof Document) {
    const rect = getScrollRect(target);
    const vertical =
      typeof position.top === 'number' &&
      typeof rect.top === 'number' &&
      rect.top < position.top
        ? UP
        : DOWN;
    const horizontal =
      typeof position.left === 'number' &&
      typeof rect.left === 'number' &&
      rect.left < position.left
        ? LEFT
        : RIGHT;
    return {vertical, horizontal};
  }
  return {vertical: null, horizontal: null};
}

export default function useScrollDirection(
  /**
   * An optional ref object or callback ref.
   * Useful when the component needs to handle ref forwarding.
   */
  innerRef?: InnerRef<HTMLElement> | null,
  /**
   * Whether or not to actively listen for changes in scroll direction.
   */
  disabled?: boolean,
): [ScrollDirection, (node: HTMLElement | null) => void] {
  const [scrollPosition, scrollPositionRefCallback] = useScrollPosition(
    innerRef,
    disabled,
  );
  const [ref, refCallback] = useRefCallback(scrollPositionRefCallback);
  const [scrollDirection, setScrollDirection] = useState(
    INITIAL_SCROLL_POSITION,
  );
  const scrollingElement = getNearestScrollNode(ref.current);

  useEffect(() => {
    const handler = (event: Event): void => {
      const direction = getScrollDirection(event, scrollPosition);
      setScrollDirection(direction);
    };

    if (!disabled && scrollingElement) {
      scrollingElement.addEventListener(SCROLL, handler, LISTENER_OPTIONS);
    }
    return () => {
      if (scrollingElement) {
        scrollingElement.removeEventListener(SCROLL, handler, LISTENER_OPTIONS);
      }
    };
  }, [scrollPosition, scrollingElement, disabled]);

  return [scrollDirection, refCallback];
}
