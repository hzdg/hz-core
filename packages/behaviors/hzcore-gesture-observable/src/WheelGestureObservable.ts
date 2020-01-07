import Observable from 'zen-observable';
import {ensureDOMInstance} from '@hzcore/dom-utils';
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
import {HORIZONTAL, VERTICAL, Orientation} from './Orientation';
import {parseConfig, ObservableConfig} from './ObservableConfig';
import MovingAverage from './MovingAverage';

export {HORIZONTAL, VERTICAL};

export const WHEEL = 'wheel';
export const GESTURE_END = 'gestureend';

/**
 * Configuration for a WheelGestureObservable.
 */
export type WheelGestureObservableConfig = ObservableConfig;

/**
 * How long to wait for additional intentional events
 * before ending a gesture.
 */
const GESTURE_END_TIMEOUT = 140;
/**
 * How big the absolute difference between an event delta
 * and the average must be to be considered intentional.
 */
const DEVIATION_THRESHOLD = 1;
/** How many pixels one delta{X,Y} unit is when `wheelMode` is 'line'. */
const LINE_HEIGHT = 40;
/** How many pixels one delta{X,Y} unit is when `wheelMode` is 'page'. */
const PAGE_HEIGHT = 800;
/** How many pixels one native wheelDelta{X,Y} 'spin' (probably) covers. */
const SPIN_FACTOR = 120;

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
  timeStamp: number;
}

// Based on https://github.com/facebookarchive/fixed-data-table/blob/3a9bf338b22406169e7261f85ddeda22ddce3b6f/src/vendor_upstream/dom/normalizeWheel.js
function normalizeWheel(event: UnnormalizedWheelEvent): WheelGestureEvent {
  let {deltaX, deltaY} = event;
  const {deltaMode, timeStamp = Date.now()} = event;

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
    spinY = -event.wheelDelta / SPIN_FACTOR;
  }
  if ('wheelDeltaY' in event) {
    spinY = -event.wheelDeltaY / SPIN_FACTOR;
  }
  if ('wheelDeltaX' in event) {
    spinX = -event.wheelDeltaX / SPIN_FACTOR;
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
    timeStamp,
  };
}

/**
 * An event type associated with a wheel gesture.
 */
export type WheelGestureType = typeof WHEEL | typeof GESTURE_END;

interface WheelGestureBaseState {
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
 * A snapshot of an in-progress wheel gesture.
 */
export interface WheelGestureState extends WheelGestureBaseState {
  /** Indicates a gesture is ongoing. */
  gesturing: true;
  /** The type of event associated with the gesture. */
  type: typeof WHEEL;
}

/**
 * The last snapshot of a completed wheel gesture.
 */
export interface WheelGestureEndState extends WheelGestureBaseState {
  /** Indicates a gesture is no longer ongoing. */
  gesturing: false;
  /** The type of event associated with the end of a gesture. */
  type: typeof GESTURE_END;
}

const DEFAULT_INITIAL_STATE: WheelGestureBaseState = {
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
  time: Infinity,
  timeInitial: Infinity,
  duration: 0,
  elapsed: 0,
};

function reduceGestureState(
  state: WheelGestureBaseState,
  event: WheelGestureEvent | GestureEndEvent,
): WheelGestureBaseState | WheelGestureState | WheelGestureEndState {
  const {timeStamp: time} =
    'originalEvent' in event ? event.originalEvent : event;
  switch (event.type) {
    case WHEEL:
      if (state.gesturing) {
        return {
          ...state,
          time,
          duration: time - state.time,
          elapsed: time - state.timeInitial,
          x: event.clientX || event.originalEvent.clientX || state.x,
          y: event.clientY || event.originalEvent.clientY || state.y,
          xPrev: state.x,
          yPrev: state.y,
          xDelta: state.xDelta - event.deltaX,
          yDelta: state.yDelta - event.deltaY,
          xSpin: state.xSpin + event.spinX,
          ySpin: state.ySpin + event.spinY,
          xVelocity: event.deltaX ? -event.deltaX : 0,
          yVelocity: event.deltaY ? -event.deltaY : 0,
          gesturing: true,
          type: event.type,
        };
      } else {
        return {
          ...state,
          time,
          timeInitial: time,
          x: event.clientX || event.originalEvent.clientX || 0,
          y: event.clientY || event.originalEvent.clientY || 0,
          xInitial: event.clientX || event.originalEvent.clientX || 0,
          yInitial: event.clientY || event.originalEvent.clientY || 0,
          xPrev: event.clientX || event.originalEvent.clientX || 0,
          yPrev: event.clientY || event.originalEvent.clientY || 0,
          xDelta: event.deltaX ? -event.deltaX : 0,
          yDelta: event.deltaY ? -event.deltaY : 0,
          xVelocity: event.deltaX ? -event.deltaX : 0,
          yVelocity: event.deltaY ? -event.deltaY : 0,
          xSpin: event.spinX,
          ySpin: event.spinY,
          gesturing: true,
          type: event.type,
        };
      }
    case GESTURE_END: {
      return {
        ...state,
        time,
        duration: time - state.time,
        elapsed: time - state.timeInitial,
        gesturing: false,
        type: event.type,
      };
    }
  }
  throw new Error(`Could not handle event ${event}`);
}

function shouldGesture(
  x: MovingAverage,
  y: MovingAverage,
  threshold?: number,
  orientation?: Orientation,
): boolean {
  if (!threshold) return true;
  if (orientation === VERTICAL || Math.abs(y.delta) > Math.abs(x.delta)) {
    return Math.abs(y.delta) > threshold && y.deviation > threshold;
  } else {
    return Math.abs(x.delta) > threshold && x.deviation > threshold;
  }
}

function shouldCancel(
  x: MovingAverage,
  y: MovingAverage,
  threshold?: number,
  orientation?: Orientation,
): boolean {
  if (threshold && orientation) {
    switch (orientation) {
      case VERTICAL: {
        return (
          Math.abs(y.delta) < threshold && Math.abs(x.delta) > Math.abs(y.delta)
        );
      }
      case HORIZONTAL: {
        return (
          Math.abs(x.delta) < threshold && Math.abs(y.delta) > Math.abs(x.delta)
        );
      }
    }
  }
  return false;
}

/**
 * A wheel gesture callbag source.
 */
export function createSource(
  /** The DOM element to observe for wheel events. */
  element: Element,
  /** Configuration for the wheel gesture source. */
  config?: Partial<WheelGestureObservableConfig> | null,
): Source<WheelGestureState | WheelGestureEndState> {
  ensureDOMInstance(element, Element);
  const {
    threshold,
    cancelThreshold,
    preventDefault,
    passive,
    orientation,
  } = parseConfig(config);

  let endTimeout: NodeJS.Timeout | null = null;
  let gesturing = false;
  let canceled = false;
  let lastEventTimeStamp: number | null = null;

  const x = new MovingAverage({weight: 0});
  const y = new MovingAverage({weight: 0});
  const t = new MovingAverage({round: true});
  t.pin(GESTURE_END_TIMEOUT);

  const endEvents = createSubject<GestureEndEvent>();

  const gestureEnd = (): void => {
    if (endTimeout) {
      clearTimeout(endTimeout);
      endTimeout = null;
    }
    const wasGesturing = gesturing;
    if (wasGesturing || canceled) {
      x.reset();
      y.reset();
      t.reset();
      t.pin(GESTURE_END_TIMEOUT);
      gesturing = false;
      canceled = false;
      lastEventTimeStamp = null;
      if (wasGesturing) {
        endEvents(1, new WheelEvent(GESTURE_END) as GestureEndEvent);
      }
    }
  };

  const scheduleGestureEnd = (timeout: MovingAverage | number = t): void => {
    if (endTimeout) clearTimeout(endTimeout);
    endTimeout = setTimeout(gestureEnd, (timeout as unknown) as number);
  };

  const shouldPreventDefault = (event: UnnormalizedWheelEvent): boolean => {
    return (
      event instanceof WheelEvent &&
      event.type === WHEEL &&
      preventDefault &&
      !passive &&
      !event.defaultPrevented &&
      typeof event.preventDefault === 'function'
    );
  };

  const filterEvents = (event: WheelGestureEvent): boolean => {
    if (canceled) return false;
    x.push(event.deltaX);
    y.push(event.deltaY);

    if (lastEventTimeStamp !== null) {
      t.push(event.timeStamp - lastEventTimeStamp);
    }
    lastEventTimeStamp = event.timeStamp;

    if (!gesturing) {
      gesturing = shouldGesture(x, y, threshold, orientation);
    }

    if (!gesturing) {
      canceled = shouldCancel(x, y, cancelThreshold, orientation);
      if (canceled) {
        scheduleGestureEnd(GESTURE_END_TIMEOUT);
        return false;
      }
    }

    // Debounce the gesture end event.
    if (!endTimeout || !threshold) {
      scheduleGestureEnd();
    } else {
      switch (orientation) {
        case HORIZONTAL: {
          if (x.deviation > DEVIATION_THRESHOLD) {
            scheduleGestureEnd();
          }
          break;
        }
        case VERTICAL: {
          if (y.deviation > DEVIATION_THRESHOLD) {
            scheduleGestureEnd();
          }
          break;
        }
        default: {
          if (Math.max(x.deviation, y.deviation) > DEVIATION_THRESHOLD) {
            scheduleGestureEnd();
          }
        }
      }
    }

    if (shouldPreventDefault(event.originalEvent)) {
      event.originalEvent.preventDefault();
    }
    return gesturing;
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
): Observable<WheelGestureState | WheelGestureEndState> {
  return asObservable(createSource(element, config));
}

export default {create, createSource};
