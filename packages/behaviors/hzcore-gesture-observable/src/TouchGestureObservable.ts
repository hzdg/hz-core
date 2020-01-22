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

export const TOUCH_START = 'touchstart';
export const TOUCH_MOVE = 'touchmove';
export const TOUCH_END = 'touchend';

/**
 * Configuration for a TouchGestureObservable.
 */
export type TouchGestureObservableConfig = ObservableConfig;

/**
 * An event assocated with a touch gesture.
 */
export interface TouchGestureEvent extends TouchEvent {
  type: typeof TOUCH_START | typeof TOUCH_MOVE | typeof TOUCH_END;
}

/**
 * An event type associated with a touch gesture.
 */
export type TouchGestureType =
  | typeof TOUCH_START
  | typeof TOUCH_MOVE
  | typeof TOUCH_END;

interface TouchGestureBaseState {
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
  type: TouchGestureType | null;
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
 * A snapshot of an in-progress touch gesture.
 */
export interface TouchGestureState extends TouchGestureBaseState {
  /** Indicates a gesture is ongoing. */
  gesturing: true;
  /** The type of event associated with the gesture. */
  type: typeof TOUCH_START | typeof TOUCH_MOVE;
}

/**
 * The last snapshot of a completed touch gesture.
 */
export interface TouchGestureEndState extends TouchGestureBaseState {
  /** Indicates a gesture is no longer ongoing. */
  gesturing: false;
  /** The type of event associated with the end of a gesture. */
  type: typeof TOUCH_END;
}

const DEFAULT_INITIAL_STATE: TouchGestureBaseState = {
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
  state: TouchGestureBaseState,
  event: TouchGestureEvent,
): TouchGestureBaseState | TouchGestureState | TouchGestureEndState {
  const {timeStamp: time} = event;
  switch (event.type) {
    case TOUCH_START:
    case TOUCH_MOVE:
      if (state.gesturing) {
        return {
          ...state,
          time,
          duration: time - state.time,
          elapsed: time - state.timeInitial,
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
          xPrev: state.x,
          yPrev: state.y,
          xDelta: event.touches[0].clientX - state.xInitial,
          yDelta: event.touches[0].clientY - state.yInitial,
          xVelocity: event.touches[0].clientX - state.x,
          yVelocity: event.touches[0].clientY - state.y,
          gesturing: true,
          type: event.type,
        };
      } else {
        return {
          ...state,
          time,
          timeInitial: time,
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
          xInitial: event.touches[0].clientX,
          yInitial: event.touches[0].clientY,
          xPrev: event.touches[0].clientX,
          yPrev: event.touches[0].clientY,
          xDelta: 0,
          yDelta: 0,
          gesturing: true,
          type: event.type,
        };
      }
    case TOUCH_END:
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
  fromEvent: TouchGestureEvent,
  toEvent: TouchGestureEvent,
  threshold?: number,
  orientation?: Orientation,
): boolean {
  if (!threshold) return true;
  if (orientation) {
    switch (orientation) {
      case VERTICAL: {
        const yDelta =
          fromEvent.touches[0].clientY - toEvent.touches[0].clientY;
        return Math.abs(yDelta) > threshold;
      }
      case HORIZONTAL: {
        const xDelta =
          fromEvent.touches[0].clientX - toEvent.touches[0].clientX;
        return Math.abs(xDelta) > threshold;
      }
    }
  }
  const yDelta = fromEvent.touches[0].clientY - toEvent.touches[0].clientY;
  const xDelta = fromEvent.touches[0].clientX - toEvent.touches[0].clientX;
  return Math.max(Math.abs(xDelta), Math.abs(yDelta)) > threshold;
}

function shouldCancel(
  fromEvent: TouchGestureEvent,
  toEvent: TouchGestureEvent,
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

const WEBKIT_HACK_OPTIONS: AddEventListenerOptions = {passive: false};

/**
 * Webkit does not allow event.preventDefault() in dynamically added handlers
 * (i.e., a handler added to 'touchmove' after handling a 'touchstart'),
 * so we add a permanent 'touchmove' handler to get around this.
 * webkit bug: https://bugs.webkit.org/show_bug.cgi?id=185656
 * Original implementation: https://github.com/atlassian/react-beautiful-dnd/pull/416
 */
class WebkitHack {
  constructor() {
    // Do nothing when server side rendering or no touch support.
    if (typeof window !== 'undefined' && 'ontouchstart' in window) {
      // Adding a persistent event handler.
      // It can't be passive, otherwise we wouldn't
      // be able to preventDefault().
      window.addEventListener(
        TOUCH_MOVE,
        this.handleTouchMove,
        WEBKIT_HACK_OPTIONS,
      );
    }
  }

  shouldPreventDefault = false;

  destroy(): void {
    if (typeof window === 'undefined') return;
    window.removeEventListener(
      TOUCH_MOVE,
      this.handleTouchMove,
      WEBKIT_HACK_OPTIONS,
    );
  }

  handleTouchMove = (event: Event): void => {
    if (this.shouldPreventDefault && !event.defaultPrevented) {
      event.preventDefault();
    }
  };

  preventTouchMove(): void {
    this.shouldPreventDefault = true;
  }

  allowTouchMove(): void {
    this.shouldPreventDefault = false;
  }
}

/**
 * A touch gesture callbag source.
 */
export function createSource(
  /** The DOM element to observe for touch events. */
  element: Element,
  /** Configuration for the touch gesture source. */
  config?: Partial<TouchGestureObservableConfig> | null,
): Source<TouchGestureState | TouchGestureEndState>;
export function createSource(
  /** The DOM element to observe for touch events. */
  element: Element,
  /** Configuration for debugging touch gesture source. */
  config: DebugConfig,
): Source<TouchGestureEvent>;
export function createSource(
  element: Element,
  config?: Partial<TouchGestureObservableConfig> | DebugConfig | null,
):
  | Source<TouchGestureState | TouchGestureEndState>
  | Source<TouchGestureEvent> {
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
    fromEvent(element, TOUCH_START),
    fromEvent(document, TOUCH_END),
    fromEvent(document, TOUCH_MOVE, {passive}),
  );

  if (isDebug) {
    let firstDebugEvent: TouchGestureEvent | null = null;
    const filterDebugEvents = (event: TouchGestureEvent): boolean => {
      switch (event.type) {
        case TOUCH_START: {
          if (firstDebugEvent) return false;
          firstDebugEvent = event;
          return true;
        }
        case TOUCH_MOVE: {
          if (!firstDebugEvent) return false;
          return true;
        }
        case TOUCH_END: {
          if (!firstDebugEvent) return false;
          firstDebugEvent = null;
          return true;
        }
      }
    };
    return share(pipe(eventSource, filter(filterDebugEvents)));
  }

  let gesturing = false;
  let firstEvent: TouchGestureEvent | null = null;
  let canceled = false;
  const webkitHack = preventDefault ? new WebkitHack() : null;

  const shouldPreventDefault = (event: TouchGestureEvent): boolean => {
    return (
      event instanceof TouchEvent &&
      event.type === TOUCH_MOVE &&
      preventDefault &&
      !event.defaultPrevented &&
      typeof event.preventDefault === 'function'
    );
  };

  const filterEvents = (event: TouchGestureEvent): boolean => {
    switch (event.type) {
      case TOUCH_START: {
        if (firstEvent) return false;
        firstEvent = event;
        if (webkitHack) webkitHack.preventTouchMove();
        if (threshold) return false;
        gesturing = true;
        return true;
      }
      case TOUCH_MOVE: {
        if (!firstEvent) return false;
        if (!gesturing) {
          if (!threshold || canceled) return false;
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
      case TOUCH_END: {
        if (!firstEvent) return false;
        if (webkitHack) webkitHack.allowTouchMove();
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
 * An Observable of touch gestures.
 */
export function create(
  /** The DOM element to observe for touch events. */
  element: Element,
  /** Configuration for the TouchGestureObservable. */
  config?: Partial<TouchGestureObservableConfig> | null,
): DebugObservable<
  TouchGestureState | TouchGestureEndState,
  TouchGestureEvent
> {
  return asObservable(
    createSource(element, config),
    createSource(element, {__debug: true}),
  );
}

export default {create, createSource};
