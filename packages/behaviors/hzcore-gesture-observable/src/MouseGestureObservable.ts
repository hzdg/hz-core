import Observable from 'zen-observable';
import {ensureDOMInstance} from '@hzcore/dom-utils';
import {Source} from 'callbag';
import share from 'callbag-share';
import pipe from 'callbag-pipe';
import scan from 'callbag-scan';
import merge from 'callbag-merge';
import filter from 'callbag-filter';
import fromEvent from 'callbag-from-event';
import asObservable from './asObservable';
import {HORIZONTAL, VERTICAL, Orientation} from './Orientation';

export {HORIZONTAL, VERTICAL};

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
  /**
   * How 'far' a series of mouse events must cumulatively move
   * in a consistent direction before a mouse gesture is detected,
   * or `false`, if _any_ mouse event should be considered part of a gesture.
   */
  threshold?: number | false;
  /**
   * The orientation in which a series of mouse events
   * can move in order to be considered part of a gesture.
   * If not provided, then mouse events in _any_ orientation
   * can be considered part of a gesture.
   */
  orientation?: Orientation;
}

/**
 * An event type associated with a mouse gesture.
 */
export type MouseGestureType =
  | typeof MOUSE_DOWN
  | typeof MOUSE_MOVE
  | typeof MOUSE_UP;

interface MouseGestureBaseState {
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

/**
 * A snapshot of an in-progress mouse gesture.
 */
export interface MouseGestureState extends MouseGestureBaseState {
  /** Indicates a gesture is ongoing. */
  gesturing: true;
  /** The type of event associated with the gesture. */
  type: typeof MOUSE_DOWN | typeof MOUSE_MOVE;
}

/**
 * The last snapshot of a completed mouse gesture.
 */
export interface MouseGestureEndState extends MouseGestureBaseState {
  /** Indicates a gesture is no longer ongoing. */
  gesturing: false;
  /** The type of event associated with the end of a gesture. */
  type: typeof MOUSE_UP;
}

const DEFAULT_INITIAL_STATE: MouseGestureBaseState = {
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
  threshold: false,
};

function parseConfig(
  config?: Partial<MouseGestureObservableConfig> | null,
): MouseGestureObservableConfig {
  if (!config) return {...DEFAULT_CONFIG};
  return {...DEFAULT_CONFIG, ...config};
}

function reduceGestureState(
  state: MouseGestureBaseState,
  event: MouseGestureEvent,
): MouseGestureBaseState | MouseGestureState | MouseGestureEndState {
  switch (event.type) {
    case MOUSE_DOWN:
      return {
        ...state,
        x: event.clientX,
        y: event.clientY,
        xInitial: event.clientX,
        yInitial: event.clientY,
        xPrev: event.clientX,
        yPrev: event.clientY,
        xDelta: 0,
        yDelta: 0,
        gesturing: true,
        type: event.type,
      };
    case MOUSE_MOVE:
      return {
        ...state,
        x: event.clientX,
        y: event.clientY,
        xPrev: state.x,
        yPrev: state.y,
        xDelta: event.clientX - state.xInitial,
        yDelta: event.clientY - state.yInitial,
        xVelocity: event.clientX - state.x,
        yVelocity: event.clientY - state.y,
        gesturing: true,
        type: event.type,
      };
    case MOUSE_UP:
      return {
        ...state,
        gesturing: false,
        type: event.type,
      };
  }
  throw new Error(`Could not handle event ${event}`);
}

function shouldGesture(
  fromEvent: MouseGestureEvent,
  toEvent: MouseGestureEvent,
  threshold?: number | false,
  orientation?: Orientation,
): boolean {
  if (!threshold) return true;
  if (orientation) {
    switch (orientation) {
      case VERTICAL: {
        let yDelta = fromEvent.clientY - toEvent.clientY;
        return Math.abs(yDelta) > threshold;
      }
      case HORIZONTAL: {
        let xDelta = fromEvent.clientX - toEvent.clientX;
        return Math.abs(xDelta) > threshold;
      }
    }
  }
  let yDelta = fromEvent.clientY - toEvent.clientY;
  let xDelta = fromEvent.clientX - toEvent.clientX;
  return Math.max(Math.abs(xDelta), Math.abs(yDelta)) > threshold;
}

function shouldCancel(
  fromEvent: MouseGestureEvent,
  toEvent: MouseGestureEvent,
  threshold?: number | false,
  orientation?: Orientation,
): boolean {
  if (threshold && orientation) {
    switch (orientation) {
      case VERTICAL: {
        return shouldGesture(fromEvent, toEvent, threshold, HORIZONTAL);
      }
      case HORIZONTAL: {
        return shouldGesture(fromEvent, toEvent, threshold, VERTICAL);
      }
    }
  }
  return false;
}

/**
 * A mouse gesture callbag source.
 */
export function createSource(
  /** The DOM element to observe for mouse events. */
  element: Element,
  /** Configuration for the mouse gesture source. */
  config?: Partial<MouseGestureObservableConfig> | null,
): Source<MouseGestureState | MouseGestureEndState> {
  ensureDOMInstance(element, Element);

  const {preventDefault, passive, orientation, threshold} = parseConfig(config);

  let gesturing = false;
  let firstEvent: MouseGestureEvent | null = null;
  let canceled = false;

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
        if (firstEvent) return false;
        firstEvent = event;
        if (threshold) return false;
        gesturing = true;
        return true;
      }
      case MOUSE_MOVE: {
        if (!firstEvent) return false;
        if (!gesturing) {
          if (!threshold || canceled) return false;
          gesturing = shouldGesture(firstEvent, event, threshold, orientation);
          if (!gesturing) {
            canceled = shouldCancel(firstEvent, event, threshold, orientation);
            return false;
          }
        }
        if (shouldPreventDefault(event)) {
          event.preventDefault();
        }
        return true;
      }
      case MOUSE_UP: {
        if (!firstEvent) return false;
        let wasGesturing = gesturing;
        firstEvent = null;
        canceled = false;
        gesturing = false;
        return wasGesturing;
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
): Observable<MouseGestureState | MouseGestureEndState> => {
  return asObservable(createSource(element, config));
};

export default {create, createSource};
