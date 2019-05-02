import Observable from 'zen-observable';
import invariant from 'invariant';
import {Source} from 'callbag';
import share from 'callbag-share';
import pipe from 'callbag-pipe';
import scan from 'callbag-scan';
import merge from 'callbag-merge';
import filter from 'callbag-filter';
import fromEvent from 'callbag-from-event';
import asObservable from './asObservable';

export const MOUSE_DOWN = 'mousedown';
export const MOUSE_MOVE = 'mousemove';
export const MOUSE_UP = 'mouseup';

/**
 * An event assocated with a mouse gesture.
 */
export interface MouseGestureEvent extends MouseEvent {
  type: typeof MOUSE_DOWN | typeof MOUSE_MOVE | typeof MOUSE_UP;
}

/**
 * Configuration for a MouseGestureObservable.
 */
export interface MouseGestureObservableConfig {
  /**
   * Whether or not to prevent the default action
   * for `mousemove` events during a gesture.
   */
  preventDefault: boolean;
  /**
   * Whether or not to listen to mouse events passively.
   * If `true`, then `preventDefault` will have no effect.
   */
  passive: boolean;
}

/**
 * An event type associated with a mouse gesture.
 */
export type MouseGestureType =
  | typeof MOUSE_DOWN
  | typeof MOUSE_MOVE
  | typeof MOUSE_UP;

/**
 * A snapshot of a previous or in-progress mouse gesture.
 */
export interface MouseGestureState {
  /** The latest x position for the gesture. */
  x: number;
  /** The latest y position for the gesture. */
  y: number;
  /** The cumulative change of the gesture in the x dimension. */
  xDelta: number;
  /** The cumulative change of the gesture in the y dimension. */
  yDelta: number;
  /** The initial x position for the gesture. */
  xInitial: number;
  /** The initial y position for the gesture. */
  yInitial: number;
  /** The previous x position for the gesture. */
  xPrev: number;
  /** The previous y position for the gesture. */
  yPrev: number;
  /** The latest velocity of the gesture in the x dimension. */
  xVelocity: number;
  /** The latest velocity of the gesture in the y dimension. */
  yVelocity: number;
  /** Whether or not a gesture is ongoing. */
  gesturing: boolean;
  /** The type of event last associated with a gesture. */
  type: MouseGestureType | null;
}

const DEFAULT_INITIAL_STATE: MouseGestureState = {
  x: 0,
  y: 0,
  xDelta: 0,
  yDelta: 0,
  xInitial: 0,
  yInitial: 0,
  xPrev: 0,
  yPrev: 0,
  xVelocity: 0,
  yVelocity: 0,
  gesturing: false,
  type: null,
};

const DEFAULT_CONFIG: MouseGestureObservableConfig = {
  passive: false,
  preventDefault: false,
};

function parseConfig(
  config?: Partial<MouseGestureObservableConfig> | null,
): MouseGestureObservableConfig {
  if (!config) return {...DEFAULT_CONFIG};
  return {...DEFAULT_CONFIG, ...config};
}

function reduceGestureState(
  state: MouseGestureState,
  event: MouseGestureEvent,
): MouseGestureState {
  const nextState = {
    ...state,
    type: event.type,
    x: event.clientX,
    y: event.clientY,
  };

  switch (event.type) {
    case MOUSE_DOWN:
      nextState.xInitial = event.clientX;
      nextState.yInitial = event.clientY;
      nextState.xPrev = event.clientX;
      nextState.yPrev = event.clientY;
      nextState.xDelta = 0;
      nextState.yDelta = 0;
      nextState.gesturing = true;
      break;
    case MOUSE_MOVE:
      nextState.xPrev = state.x;
      nextState.yPrev = state.y;
      nextState.xDelta = event.clientX - state.xInitial;
      nextState.yDelta = event.clientY - state.yInitial;
      nextState.xVelocity = event.clientX - state.x;
      nextState.yVelocity = event.clientY - state.y;
      nextState.gesturing = true;
      break;
    case MOUSE_UP:
      nextState.gesturing = false;
      break;
  }
  state = nextState;
  return state;
}

/**
 * A mouse gesture callbag source.
 */
export function createSource(
  /** The DOM element to observe for mouse events. */
  element: Element,
  /** Configuration for the mouse gesture source. */
  config?: Partial<MouseGestureObservableConfig> | null,
): Source<MouseGestureState> {
  invariant(
    element instanceof Element,
    `An Element is required, but received ${element}`,
  );

  const {preventDefault, passive} = parseConfig(config);

  let gesturing = false;

  const shouldPreventDefault = (event: MouseGestureEvent): boolean => {
    return (
      event instanceof MouseEvent &&
      event.type === MOUSE_MOVE &&
      preventDefault &&
      !event.defaultPrevented &&
      typeof event.preventDefault === 'function'
    );
  };

  const filterEvents = (event: MouseGestureEvent): boolean => {
    switch (event.type) {
      case MOUSE_DOWN: {
        if (gesturing) return false;
        gesturing = true;
        return true;
      }
      case MOUSE_MOVE: {
        if (!gesturing) return false;
        if (shouldPreventDefault(event)) event.preventDefault();
        return true;
      }
      case MOUSE_UP: {
        if (!gesturing) return false;
        gesturing = false;
        return true;
      }
    }
    return false;
  };

  return share(
    pipe(
      merge(
        fromEvent(element, MOUSE_DOWN),
        fromEvent(document, MOUSE_UP),
        fromEvent(document, MOUSE_MOVE, {passive}),
      ),
      filter(filterEvents),
      scan(reduceGestureState, DEFAULT_INITIAL_STATE),
    ),
  );
}

/**
 * An Observable of mouse gestures.
 */
export const create = (
  /** The DOM element to observe for mouse events. */
  element: Element,
  /** Configuration for the MouseGestureObservable. */
  config?: Partial<MouseGestureObservableConfig> | null,
): Observable<MouseGestureState> => {
  return asObservable(createSource(element, config));
};

export default {create};
