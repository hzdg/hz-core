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

export const TOUCH_START = 'touchstart';
export const TOUCH_MOVE = 'touchmove';
export const TOUCH_END = 'touchend';

/**
 * Configuration for a TouchGestureObservable.
 */
export interface TouchGestureObservableConfig {
  /**
   * Whether or not to prevent the default action
   * for `touchmove` events during a gesture.
   */
  preventDefault: boolean;
  /**
   * Whether or not to listen to touch events passively.
   * If `true`, then `preventDefault` will have no effect.
   */
  passive: boolean;
}

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
};

const DEFAULT_CONFIG: TouchGestureObservableConfig = {
  passive: false,
  preventDefault: false,
};

function parseConfig(
  config?: Partial<TouchGestureObservableConfig> | null,
): TouchGestureObservableConfig {
  if (!config) return {...DEFAULT_CONFIG};
  return {...DEFAULT_CONFIG, ...config};
}

function reduceGestureState(
  state: TouchGestureBaseState,
  event: TouchGestureEvent,
): TouchGestureBaseState | TouchGestureState | TouchGestureEndState {
  switch (event.type) {
    case TOUCH_START:
      return {
        ...state,
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
    case TOUCH_MOVE:
      return {
        ...state,
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
    case TOUCH_END:
      return {
        ...state,
        gesturing: false,
        type: event.type,
      };
  }
  throw new Error(`Could not handle event ${event}`);
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

  shouldPreventDefault: boolean = false;

  destroy(): void {
    if (typeof window === 'undefined') return;
    window.removeEventListener(
      TOUCH_MOVE,
      this.handleTouchMove,
      WEBKIT_HACK_OPTIONS,
    );
  }

  handleTouchMove = (event: Event) => {
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
): Source<TouchGestureState | TouchGestureEndState> {
  invariant(
    element instanceof Element,
    `An Element is required, but received ${element}`,
  );

  const {preventDefault, passive} = parseConfig(config);

  let gesturing = false;
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
        if (gesturing) return false;
        gesturing = true;
        if (webkitHack) webkitHack.preventTouchMove();
        return true;
      }
      case TOUCH_MOVE: {
        if (!gesturing) return false;
        if (shouldPreventDefault(event)) event.preventDefault();
        return true;
      }
      case TOUCH_END: {
        if (!gesturing) return false;
        gesturing = false;
        if (webkitHack) webkitHack.allowTouchMove();
        return true;
      }
    }
    return false;
  };

  return share(
    pipe(
      merge(
        fromEvent(element, TOUCH_START),
        fromEvent(document, TOUCH_END),
        fromEvent(document, TOUCH_MOVE, {passive}),
      ),
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
): Observable<TouchGestureState | TouchGestureEndState> {
  return asObservable(createSource(element, config));
}

export default {create, createSource};