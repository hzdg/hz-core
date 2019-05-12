import {useCallback, useRef, useMemo} from 'react';

const GESTURE_THRESHOLD = 50;
const UNKNOWN = 'UNKNOWN';
const LEFT = 'LEFT';
const RIGHT = 'RIGHT';
const UP = 'UP';
const DOWN = 'DOWN';

type GestureDirection = typeof LEFT | typeof RIGHT | typeof UP | typeof DOWN;

export const SPACE = 'Space';
export const PAGE_UP = 'PageUp';
export const PAGE_DOWN = 'PageDown';
export const END = 'End';
export const HOME = 'Home';
export const ARROW_LEFT = 'ArrowLeft';
export const ARROW_UP = 'ArrowUp';
export const ARROW_RIGHT = 'ArrowRight';
export const ARROW_DOWN = 'ArrowDown';

export type GestureKey =
  | typeof SPACE
  | typeof PAGE_UP
  | typeof PAGE_DOWN
  | typeof END
  | typeof HOME
  | typeof ARROW_LEFT
  | typeof ARROW_UP
  | typeof ARROW_RIGHT
  | typeof ARROW_DOWN;

// Orientations
export const HORIZONTAL = 'horizontal';
export const VERTICAL = 'vertical';

// Pagination actions
export const NEXT = 'next';
export const PREVIOUS = 'previous';
export const FIRST = 'first';
export const LAST = 'last';
export const CANCELED = 'canceled';

export type PaginationAction =
  | typeof NEXT
  | typeof PREVIOUS
  | typeof FIRST
  | typeof LAST
  | typeof CANCELED;

type GestureIntent =
  | GestureKey
  | GestureDirection
  | typeof UNKNOWN
  | typeof CANCELED;

function getAction(
  orientation: typeof HORIZONTAL | typeof VERTICAL,
  gestureState: GestureIntent | null,
): PaginationAction {
  switch (orientation) {
    case HORIZONTAL: {
      switch (gestureState) {
        case LEFT:
        case ARROW_RIGHT:
          return NEXT;
        case RIGHT:
        case ARROW_LEFT:
          return PREVIOUS;
        case END:
          return LAST;
        case HOME:
          return FIRST;
      }
      break;
    }
    case VERTICAL: {
      switch (gestureState) {
        case UP:
        case ARROW_DOWN:
        case PAGE_DOWN:
        case SPACE:
          return NEXT;
        case DOWN:
        case ARROW_UP:
        case PAGE_UP:
          return PREVIOUS;
        case END:
          return LAST;
        case HOME:
          return FIRST;
      }
      break;
    }
  }
  return CANCELED;
}

export type Orientation = typeof VERTICAL | typeof HORIZONTAL;

export interface PageGestureConfig {
  orientation?: typeof VERTICAL | typeof HORIZONTAL;
  threshold?: number;
}

export type PaginationChangeHandler = (action: PaginationAction) => void;

export interface PaginationHandlers {
  onNext?: () => void;
  onPrevious?: () => void;
  onFirst?: () => void;
  onLast?: () => void;
}

export interface KeyGestureLike {
  key: GestureKey;
  gesturing: boolean;
}

export interface HorizontalGestureLike {
  xDelta: number;
  gesturing: boolean;
}

export interface VerticalGestureLike {
  yDelta: number;
  gesturing: boolean;
}

export type GestureLike =
  | KeyGestureLike
  | HorizontalGestureLike
  | VerticalGestureLike;

export interface FromInputState {
  (state: GestureLike): void;
}

/**
 * A React hook for components that want to handle pagination via gestures.
 *
 * @returns {(inputState: GestureLike) => void} - A callback that expects
 * to receive some input state, i.e. from a gesture hook like `useMouseGesture`.
 */
export default function usePageGesture(
  /**
   * A function to handle pagination actions,
   * or a configuration of handlers, like
   * `{onNext?, onPrevious?, onFirst?, onLast?}`.
   */
  handler: PaginationChangeHandler | PaginationHandlers,
  /**
   * Configuration for the page gesture.
   */
  config?: PageGestureConfig | null,
): FromInputState {
  const latestInput = useRef<GestureLike | null>(null);
  const gestureIntent = useRef<GestureIntent | null>(null);
  const delta = useRef(0);

  const [orientation, threshold] = useMemo<
    [typeof HORIZONTAL | typeof VERTICAL, number]
  >(() => {
    let orientation: typeof HORIZONTAL | typeof VERTICAL = HORIZONTAL;
    let threshold = GESTURE_THRESHOLD;
    if (config && config.orientation === VERTICAL) {
      orientation = VERTICAL;
    }
    if (config && typeof config.threshold === 'number') {
      threshold = config.threshold;
    }
    return [orientation, threshold];
  }, [config]);

  const dispatch = useCallback(() => {
    let action = getAction(orientation, gestureIntent.current);
    if (action) {
      if (typeof handler === 'function') {
        handler(action);
      } else {
        switch (action) {
          case FIRST:
            if (typeof handler.onFirst === 'function') {
              handler.onFirst();
            }
            break;
          case LAST:
            if (typeof handler.onLast === 'function') {
              handler.onLast();
            }
            break;
          case NEXT:
            if (typeof handler.onNext === 'function') {
              handler.onNext();
            }
            break;
          case PREVIOUS:
            if (typeof handler.onPrevious === 'function') {
              handler.onPrevious();
            }
            break;
        }
      }
    }
  }, [orientation, handler]);

  const fromGestureState = useCallback(
    (inputState: GestureLike) => {
      // If we've already seen this input state, bail.
      if (inputState === latestInput.current) return;
      latestInput.current = inputState;
      const {gesturing} = inputState;

      // If this is keyboard input...
      if ('key' in inputState) {
        const {key} = inputState;
        if (gesturing) {
          // Record the pressed key as the gesture intent.
          gestureIntent.current = key;
        } else {
          gestureIntent.current = gestureIntent.current || key || CANCELED;
          // If we aren't gesturing with keyboard any more,
          // dispatch the recorded intent as a pagination action.
          dispatch();
        }
      } else {
        // If we're gesturing, record the gesture intent
        // for the configured orientation.
        if (gesturing) {
          // If our pagination orientation is VERTICAL,
          // we need a`yDelta` to determine the intention of the gesture.
          if (orientation === VERTICAL && 'yDelta' in inputState) {
            gestureIntent.current = UNKNOWN;
            // Consider positive y deltas as an intention to gesture DOWN,
            // and positive deltas as an inteiont to gesture UP.
            // If our delta exceeds the configured threshold,
            // record the direction as the current intent.
            switch (inputState.yDelta < 0 ? UP : DOWN) {
              case DOWN:
                gestureIntent.current =
                  inputState.yDelta < delta.current ||
                  (delta.current < 0 && Math.abs(inputState.yDelta) < threshold)
                    ? CANCELED
                    : DOWN;
                break;

              case UP:
                gestureIntent.current =
                  inputState.yDelta > delta.current ||
                  (delta.current > 0 && Math.abs(inputState.yDelta) < threshold)
                    ? CANCELED
                    : UP;
                break;
            }
            delta.current = inputState.yDelta;
          } else if ('xDelta' in inputState) {
            gestureIntent.current = UNKNOWN;
            // Consider positive x deltas as an intention to gesture RIGHT,
            // and positive deltas as an inteiont to gesture LEFT.
            // If our delta exceeds the configured threshold,
            // record the direction as the current intent.
            switch (inputState.xDelta < 0 ? LEFT : RIGHT) {
              case RIGHT:
                gestureIntent.current =
                  inputState.xDelta < delta.current ||
                  (delta.current < 0 && Math.abs(inputState.xDelta) < threshold)
                    ? CANCELED
                    : RIGHT;
                break;

              case LEFT:
                gestureIntent.current =
                  inputState.xDelta > delta.current ||
                  (delta.current > 0 && Math.abs(inputState.xDelta) < threshold)
                    ? CANCELED
                    : LEFT;
                break;
            }
            delta.current = inputState.xDelta;
          }
          delta.current = delta.current || 0;
          gestureIntent.current =
            Math.abs(delta.current) >= threshold
              ? gestureIntent.current
              : CANCELED;
          if (gestureIntent.current === CANCELED) delta.current = 0;
        } else {
          gestureIntent.current = gestureIntent.current || CANCELED;
          dispatch();
        }
      }
    },
    [orientation, threshold, dispatch],
  );

  return fromGestureState;
}
