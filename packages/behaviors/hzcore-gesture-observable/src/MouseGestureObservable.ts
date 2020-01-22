import {ensureDOMInstance} from '@hzcore/dom-utils';
import {Source} from 'callbag';
import share from 'callbag-share';
import pipe from 'callbag-pipe';
import scan from 'callbag-scan';
import merge from 'callbag-merge';
import filter from 'callbag-filter';
import fromEvent from 'callbag-from-event';
import asObservable, {DebugObservable} from './asObservable';
import {HORIZONTAL, VERTICAL, Orientation} from './Orientation';
import {parseConfig, ObservableConfig, DebugConfig} from './ObservableConfig';

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
export type MouseGestureObservableConfig = ObservableConfig;

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
  /** The timestamp of the event last associated with a gesture. */
  time: number;
  /** The initial timestamp for the gesture. */
  timeInitial: number;
  /** How long the latest update to the gesture state took. */
  duration: number;
  /** How long the gesture has been active. */
  elapsed: number;
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
  time: Infinity,
  timeInitial: Infinity,
  duration: 0,
  elapsed: 0,
};

function reduceGestureState(
  state: MouseGestureBaseState,
  event: MouseGestureEvent,
): MouseGestureBaseState | MouseGestureState | MouseGestureEndState {
  const {timeStamp: time} = event;
  switch (event.type) {
    case MOUSE_DOWN:
    case MOUSE_MOVE:
      if (state.gesturing) {
        return {
          ...state,
          time,
          duration: time - state.time,
          elapsed: time - state.timeInitial,
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
      } else {
        return {
          ...state,
          time,
          timeInitial: time,
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
      }
    case MOUSE_UP:
      return {
        ...state,
        time,
        duration: time - state.time,
        elapsed: time - state.timeInitial,
        gesturing: false,
        type: event.type,
      };
  }
  throw new Error(`Could not handle event ${event}`);
}

function shouldGesture(
  fromEvent: MouseGestureEvent,
  toEvent: MouseGestureEvent,
  threshold?: number,
  orientation?: Orientation,
): boolean {
  if (!threshold) return true;
  if (orientation) {
    switch (orientation) {
      case VERTICAL: {
        const yDelta = fromEvent.clientY - toEvent.clientY;
        return Math.abs(yDelta) > threshold;
      }
      case HORIZONTAL: {
        const xDelta = fromEvent.clientX - toEvent.clientX;
        return Math.abs(xDelta) > threshold;
      }
    }
  }
  const yDelta = fromEvent.clientY - toEvent.clientY;
  const xDelta = fromEvent.clientX - toEvent.clientX;
  return Math.max(Math.abs(xDelta), Math.abs(yDelta)) > threshold;
}

function shouldCancel(
  fromEvent: MouseGestureEvent,
  toEvent: MouseGestureEvent,
  threshold?: number,
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

const CLICK = 'click';

class ClickHack {
  clickTimeout: NodeJS.Timeout | null = null;
  clickHandler = (event: Event): void => {
    event.preventDefault();
    event.stopPropagation();
    if (typeof window === 'undefined') return;
    window.removeEventListener(CLICK, this.clickHandler, true);
  };

  preventNextClick(): void {
    if (typeof window === 'undefined') return;
    window.addEventListener(CLICK, this.clickHandler, true);
    this.clickTimeout = setTimeout(this.destroy.bind(this), 0);
  }

  destroy(): void {
    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout);
      this.clickTimeout = null;
    }
    if (typeof window === 'undefined') return;
    window.removeEventListener(CLICK, this.clickHandler, true);
  }
}

/**
 * A mouse gesture callbag source.
 */
export function createSource(
  /** The DOM element to observe for mouse events. */
  element: Element,
  /** Configuration for the mouse gesture source. */
  config?: Partial<MouseGestureObservableConfig> | null,
): Source<MouseGestureState | MouseGestureEndState>;
export function createSource(
  /** The DOM element to observe for mouse events. */
  element: Element,
  /** Configuration for debugging the mouse gesture source. */
  config: DebugConfig,
): Source<MouseGestureEvent>;
export function createSource(
  element: Element,
  config?: Partial<MouseGestureObservableConfig> | DebugConfig | null,
):
  | Source<MouseGestureState | MouseGestureEndState>
  | Source<MouseGestureEvent> {
  ensureDOMInstance(element, Element);

  const {
    preventDefault,
    passive,
    orientation,
    threshold,
    cancelThreshold,
    __debug: isDebug,
  } = parseConfig(config);

  const eventSource = merge(
    fromEvent(element, MOUSE_DOWN),
    fromEvent(document, MOUSE_UP),
    fromEvent(document, MOUSE_MOVE, {passive}),
  );

  if (isDebug) {
    let firstDebugEvent: MouseGestureEvent | null = null;
    const filterDebugEvents = (event: MouseGestureEvent): boolean => {
      switch (event.type) {
        case MOUSE_DOWN: {
          if (firstDebugEvent) return false;
          firstDebugEvent = event;
          return true;
        }
        case MOUSE_MOVE: {
          if (!firstDebugEvent) return false;
          return true;
        }
        case MOUSE_UP: {
          if (!firstDebugEvent) return false;
          firstDebugEvent = null;
          return true;
        }
      }
    };
    return share(pipe(eventSource, filter(filterDebugEvents)));
  }

  let gesturing = false;
  let firstEvent: MouseGestureEvent | null = null;
  let canceled = false;
  const clickHack = preventDefault ? new ClickHack() : null;

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
        if (canceled) return false;
        if (!gesturing) {
          gesturing = shouldGesture(firstEvent, event, threshold, orientation);
          if (!gesturing) {
            canceled = shouldCancel(
              firstEvent,
              event,
              cancelThreshold,
              orientation,
            );
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
        if (gesturing && clickHack) clickHack.preventNextClick();
        const wasGesturing = gesturing;
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
      eventSource,
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
): DebugObservable<
  MouseGestureState | MouseGestureEndState,
  MouseGestureEvent
> => {
  return asObservable(
    createSource(element, config),
    createSource(element, {__debug: true}),
  );
};

export default {create, createSource};
