import {useState, useRef} from 'react';
import {ScrollPosition, getScrollPosition} from './useScrollPosition';
import {useNearestScrollNodeRef, useScrollEffect, useSyncRef} from './utils';

const INITIAL_SCROLL_DIRECTION: ScrollDirectionState = {
  vertical: null,
  horizontal: null,
};

/**
 * `ScrollDirection` is an enum of possible scroll direction states.
 */
export enum ScrollDirection {
  /** Indicates that scrolling is moving in a downward direction. */
  DOWN = 'down',
  /** Indicates that scrolling is moving in a upward direction. */
  UP = 'up',
  /** Indicates that scrolling is moving in a leftward direction. */
  LEFT = 'left',
  /** Indicates that scrolling is moving in a righward direction. */
  RIGHT = 'right',
}
export const DOWN = ScrollDirection.DOWN;
export const UP = ScrollDirection.UP;
export const LEFT = ScrollDirection.LEFT;
export const RIGHT = ScrollDirection.RIGHT;

export type VerticalScrollDirection = ScrollDirection.DOWN | ScrollDirection.UP;
export type HorizontalScrollDirection =
  | ScrollDirection.LEFT
  | ScrollDirection.RIGHT;

/**
 * `ScrollDirectionState` is an object of `vertical` and `horizontal` values,
 * where `vertical` is either `'up'` or `'down'`, and `horizontal` is either
 * `'left'` or `'right'`.
 */
export interface ScrollDirectionState {
  /**
   * The direction the nearest scrollable container
   * most recently scrolled vertically,
   * where 'direction' is either `'up'` or `'down'`.
   */
  vertical: VerticalScrollDirection | null;
  /**
   * The direction the nearest scrollable container
   * most recently scrolled horizontally,
   * where 'direction' is either `'left'` or `'right'`.
   */
  horizontal: HorizontalScrollDirection | null;
}

/**
 * `getScrollDirection` compares two `ScrollPosition` objects
 * and returns a `ScrollDirectionState` object.
 *
 * `ScrollDirectionState.vertical` will be one of `ScrollDirection.UP`
 * or `ScrollDirection.DOWN`, while `ScrollDirectionState.horizontal`
 * will be one of `ScrollDirection.LEFT` or `ScrollDirection.RIGHT`.
 */
export function getScrollDirection(
  position: ScrollPosition,
  lastPosition: ScrollPosition | null,
): ScrollDirectionState {
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
 * `useScrollDirection` is a React hook for components that care about
 * the nearest scrollable container's scroll direction.
 *
 * If a `providedRef` is passed to `useScrollDirection`,
 * returns a `ScrollDirection` value.
 *
 * If no `providedRef` is passed, returns an array containing a
 * `ScrollDirection` object and a `ref` object. The `ref` should be passed
 * to an underlying DOM node. Note that the node does not have to be scrollable itself,
 * as `useScrollDirection` will traverse the DOM to find a scrollable parent
 * to observe.
 *
 * `ScrollDirectionState.vertical` will be one of `ScrollDirection.UP`
 *  or `ScrollDirection.DOWN`, while `ScrollDirectionState.horizontal`
 * will be one of `ScrollDirection.LEFT` or `ScrollDirection.RIGHT`.
 */
function useScrollDirection<T extends HTMLElement>(): [
  ScrollDirectionState,
  React.RefObject<T>
];
function useScrollDirection<T extends HTMLElement>(
  providedRef?: React.RefObject<T>,
): ScrollDirectionState;
function useScrollDirection<T extends HTMLElement>(
  /**
   * An optional ref to use. If provided, this ref object will be
   * passed through as the returned value for `useScrollDirection`.
   * Useful when the component needs to handle ref forwarding.
   */
  providedRef?: React.RefObject<T>,
): ScrollDirectionState | [ScrollDirectionState, React.RefObject<T>] {
  const scrollPosition = useRef<ScrollPosition | null>(null);
  const [direction, setDirection] = useState(INITIAL_SCROLL_DIRECTION);
  const ref = useSyncRef(providedRef);
  const scrollRef = useNearestScrollNodeRef(ref);
  useScrollEffect(
    scrollRef,
    (event: Event): void => {
      const position = getScrollPosition(event);
      const direction = getScrollDirection(position, scrollPosition.current);
      scrollPosition.current = position;
      setDirection(direction);
    },
    [],
  );
  return providedRef ? direction : [direction, ref];
}

export default useScrollDirection;
