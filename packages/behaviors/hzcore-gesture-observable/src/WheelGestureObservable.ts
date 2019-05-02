import Observable from 'zen-observable';
import invariant from 'invariant';
import {Lethargy} from 'lethargy';
import {Source} from 'callbag';
import share from 'callbag-share';
import pipe from 'callbag-pipe';
import scan from 'callbag-scan';
import map from 'callbag-map';
import merge from 'callbag-merge';
import filter from 'callbag-filter';
import fromEvent from 'callbag-from-event';
import createSubject from 'callbag-subject';
import asObservable from './asObservable';

export const WHEEL = 'wheel';
export const GESTURE_END = 'gestureend';

/**
 * Configuration for a WheelGestureObservable.
 */
export interface WheelGestureObservableConfig {
  /**
   * Whether or not to prevent the default action
   * for `wheel` events during a gesture.
   */
  preventDefault: boolean;
  /**
   * Whether or not to listen to wheel events passively.
   * If `true`, then `preventDefault` will have no effect.
   */
  passive: boolean;
  /**
   * How 'far' a series of wheel events must cumulative move
   * in a consistent direction before a wheel gesture is detected,
   * or `false`, if _any_ wheel event should be considered part of a gesture.
   */
  threshold?: number | false;
}

// TODO: Find the smallest timeout that won't ever get tricked by inertia.
const GESTURE_END_TIMEOUT = 60;
const GESTURE_THRESHOLD = 40;

const LEFT = 'left';
const RIGHT = 'right';
const UP = 'up';
const DOWN = 'down';

const direction = (
  x: number,
  y: number,
): typeof LEFT | typeof RIGHT | typeof UP | typeof DOWN =>
  Math.abs(x) > Math.abs(y) ? (x > 0 ? LEFT : RIGHT) : y > 0 ? UP : DOWN;

// Reasonable defaults
const LINE_HEIGHT = 40;
const PAGE_HEIGHT = 800;
const WHEEL_FACTOR = 120;

type UnnormalizedWheelEvent = WheelEvent & {
  wheelDelta: number;
  wheelDeltaX: number;
  wheelDeltaY: number;
};

/**
 * An event assocated with a wheel gesture.
 */
export interface WheelGestureEvent extends WheelEvent {
  type: typeof WHEEL;
  /**
   * The original unnormalized wheel event.
   */
  originalEvent: UnnormalizedWheelEvent;
  /**
   * Normalized speed the wheel was spun (or trackpad dragged)
   * in the x dimension.
   *
   * Attempts to represent a single slow step on a wheel as 1,
   * with the intention to smooth over discrete wheel steps
   * to more closely resemble trackpad movement.
   */
  spinX: number;
  /**
   * Normalized speed the wheel was spun (or trackpad dragged)
   * in the y dimension.
   *
   * Attempts to represent a single slow step on a wheel as 1,
   * with the intention to smooth over discrete wheel steps
   * to more closely resemble trackpad movement.
   */
  spinY: number;
  /**
   * Normalized distance the wheel has moved (in pixels) in the x dimension.
   *
   * Attempts to represent the same 'line' or 'page' distance across browsers
   * for wheel events that have 'line' or 'page' `deltaMode`.
   */
  deltaX: number;
  /**
   * Normalized distance the wheel has moved (in pixels) in the y dimension.
   *
   * Attempts to represent the same 'line' or 'page' distance across browsers
   * for wheel events that have 'line' or 'page' `deltaMode`.
   */
  deltaY: number;
}

/**
 * An event assocated with the end of a wheel gesture.
 * This is needed for wheel gestures because
 * there is nothing that natively represents 'wheel end'.
 */
export interface GestureEndEvent {
  type: typeof GESTURE_END;
}

// Based on https://github.com/facebookarchive/fixed-data-table/blob/3a9bf338b22406169e7261f85ddeda22ddce3b6f/src/vendor_upstream/dom/normalizeWheel.js
function normalizeWheel(event: UnnormalizedWheelEvent): WheelGestureEvent {
  let {deltaX, deltaY} = event;
  const {deltaMode} = event;

  if ((deltaX || deltaY) && deltaMode) {
    if (deltaMode === 1) {
      // delta in LINE units
      deltaX *= LINE_HEIGHT;
      deltaY *= LINE_HEIGHT;
    } else {
      // delta in PAGE units
      deltaX *= PAGE_HEIGHT;
      deltaY *= PAGE_HEIGHT;
    }
  }

  let spinX = 0;
  let spinY = 0;

  if ('detail' in event) {
    spinY = event.detail;
  }
  if ('wheelDelta' in event) {
    spinY = -event.wheelDelta / WHEEL_FACTOR;
  }
  if ('wheelDeltaY' in event) {
    spinY = -event.wheelDeltaY / WHEEL_FACTOR;
  }
  if ('wheelDeltaX' in event) {
    spinX = -event.wheelDeltaX / WHEEL_FACTOR;
  }

  // Fall-back if spin cannot be determined
  if (deltaX && !spinX) {
    spinX = deltaX < 1 ? -1 : 1;
  }

  if (deltaY && !spinY) {
    spinY = deltaY < 1 ? -1 : 1;
  }

  return {
    ...event,
    type: 'wheel',
    originalEvent: event,
    spinX,
    spinY,
    deltaX,
    deltaY,
    deltaMode,
  };
}

/**
 * An event type associated with a wheel gesture.
 */
export type WheelGestureType = typeof WHEEL | typeof GESTURE_END;

/**
 * A snapshot of a previous or in-progress wheel gesture.
 */
export interface WheelGestureState {
  /** The latest x position for the gesture. */
  x: number;
  /** The latest y position for the gesture. */
  y: number;
  /** The cumulative change of the spin speed in the x dimension. */
  xSpin: number;
  /** The cumulative change of the spin speed in the y dimension. */
  ySpin: number;
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
  type: WheelGestureType | null;
}

const DEFAULT_INITIAL_STATE: WheelGestureState = {
  x: 0,
  y: 0,
  xSpin: 0,
  ySpin: 0,
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

const DEFAULT_CONFIG: WheelGestureObservableConfig = {
  passive: false,
  preventDefault: false,
};

function parseConfig(
  config?: Partial<WheelGestureObservableConfig> | null,
): WheelGestureObservableConfig {
  if (!config) return {...DEFAULT_CONFIG};
  return {...DEFAULT_CONFIG, ...config};
}

function reduceGestureState(
  state: WheelGestureState,
  event: WheelGestureEvent | GestureEndEvent,
): WheelGestureState {
  const nextState = {
    ...state,
    type: event.type,
    x: 'clientX' in event ? event.clientX : state.x,
    y: 'clientY' in event ? event.clientY : state.y,
  };

  switch (event.type) {
    case WHEEL:
      nextState.xInitial = event.clientX || event.originalEvent.clientX;
      nextState.yInitial = event.clientY || event.originalEvent.clientY;
      nextState.xPrev = event.clientX || event.originalEvent.clientX;
      nextState.yPrev = event.clientY || event.originalEvent.clientY;
      nextState.xDelta =
        state.type === WHEEL
          ? state.xDelta - event.deltaX
          : event.deltaX
          ? -event.deltaX
          : 0;
      nextState.yDelta =
        state.type === WHEEL
          ? state.yDelta - event.deltaY
          : event.deltaY
          ? -event.deltaY
          : 0;
      nextState.xSpin =
        state.type === WHEEL
          ? state.xSpin + event.spinX
          : event.spinX
          ? event.spinX
          : 0;
      nextState.ySpin =
        state.type === WHEEL
          ? state.ySpin + event.spinY
          : event.spinY
          ? event.spinY
          : 0;
      nextState.xVelocity = event.deltaX ? -event.deltaX : 0;
      nextState.yVelocity = event.deltaY ? -event.deltaY : 0;
      nextState.gesturing = true;
      break;
    case GESTURE_END:
      nextState.gesturing = false;
      break;
  }
  state = nextState;
  return state;
}

/**
 * A wheel gesture callbag source.
 */
export function createSource(
  /** The DOM element to observe for wheel events. */
  element: Element,
  /** Configuration for the wheel gesture source. */
  config?: Partial<WheelGestureObservableConfig> | null,
): Source<WheelGestureState> {
  invariant(
    element instanceof Element,
    `An Element is required, but received ${element}`,
  );

  let endTimeout: NodeJS.Timeout | null = null;
  let resetTimeout: NodeJS.Timeout | null = null;

  let {threshold = GESTURE_THRESHOLD, passive} = parseConfig(config);
  if (threshold === false) {
    threshold = 0;
  }

  let lethargy = new Lethargy();
  let intent:
    | false
    | typeof DOWN
    | typeof UP
    | typeof LEFT
    | typeof RIGHT = false;
  let accX = 0;
  let accY = 0;

  const reset = (): void => {
    accX = 0;
    accY = 0;
    intent = false;
    lethargy = new Lethargy();
  };

  const endEvents = createSubject<GestureEndEvent>();

  const gestureEnd = (): void => {
    endEvents(1, {type: GESTURE_END});
  };

  const filterEvents = (event: WheelGestureEvent): boolean => {
    // We're seeing a wheel event, so debounce the state reset,
    // in case it's part of an ongoing gesture.
    if (resetTimeout) clearTimeout(resetTimeout);
    resetTimeout = setTimeout(reset, GESTURE_END_TIMEOUT);

    let intentional = Boolean(lethargy.check(event.originalEvent));

    // If we've already identified a gesture intent,
    // check to see if this event indicates a new intention.
    if (intent && !intentional) {
      // If the direction of this event is not the same
      // as the previously identified intent,
      // assume it is intentional.
      intentional = intent !== direction(event.deltaX, event.deltaY);

      if (intentional) {
        // This event appears to be intentional,
        // but we've already identified an intended gesture,
        // so reset the gesture state to try and figure out
        // the new intention.
        reset();
      } else {
        // This event probably isn't intentional
        // (i.e., trackpad inertia), so ignore it.
        return false;
      }
    }

    // We're still gesturing, so debounce the end event.
    if (endTimeout) clearTimeout(endTimeout);

    // Update state with the event deltas.
    accX += event.deltaX;
    accY += event.deltaY;

    if (threshold && Math.max(Math.abs(accX), Math.abs(accY)) >= threshold) {
      // If we have a defined gesture threshold,
      // and the accumulated magnitude is above the threshold,
      // declare a gesture intent.
      intent = direction(accX, accY);
    }

    // Schedule an end event.
    endTimeout = setTimeout(gestureEnd, GESTURE_END_TIMEOUT);
    return true;
  };

  return share(
    pipe(
      merge(
        pipe(
          fromEvent(element, WHEEL, {passive}),
          map(normalizeWheel),
          filter(filterEvents),
        ),
        endEvents,
      ),
      scan(reduceGestureState, DEFAULT_INITIAL_STATE),
    ),
  );
}

/**
 * An Observable of a wheel gesture.
 *
 * Uses normalized versions of wheel event values because they
 * can vary significantly on different platforms and browsers.
 * For example, some devices (like trackpads) emit more events
 * at smaller increments with fine granularity, and some emit
 * massive jumps with linear speed or acceleration.
 *
 * Also uses a `gestureend` event to indicate when the intent
 * to end a wheel gesture has been detected. This is useful
 * because there is no native representation of a 'wheelend' event
 * (like you get from touch with 'touchend' or mouse with 'mouseup'),
 * which makes it difficult to decide when to resolve a guess
 * for a gesturing user's intention.
 */
export function create(
  /** The DOM element to observe for wheel events. */
  element: Element,
  /** Configuration for the WheelGestureObservable. */
  config?: Partial<WheelGestureObservableConfig> | null,
): Observable<WheelGestureState> {
  return asObservable(createSource(element, config));
}

export default {create};
