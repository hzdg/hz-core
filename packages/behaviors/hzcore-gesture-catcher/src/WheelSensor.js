/* eslint-disable no-duplicate-imports */
// @flow
import pipe from 'callbag-pipe';
import share from 'callbag-share';
import subscribe from 'callbag-subscribe';
import {Lethargy} from 'lethargy';
import {fromEvent, preventDefault} from './callbags';
import {WHEEL, GESTURE_END} from './types';

import type {Callbag, Observer, Subscription, WheelSensorConfig} from './types';

// TODO: Find the smallest timeout that won't ever get tricked by inertia.
const GESTURE_END_TIMEOUT = 60;
const GESTURE_THRESHOLD = 40;

const LEFT = 'left';
const RIGHT = 'right';
const UP = 'up';
const DOWN = 'down';

const gestureEnd = sink => () => {
  sink(1, {type: GESTURE_END});
};

const direction = (x, y) =>
  Math.abs(x) > Math.abs(y) ? (x > 0 ? LEFT : RIGHT) : y > 0 ? UP : DOWN;

// Reasonable defaults
const LINE_HEIGHT = 40;
const PAGE_HEIGHT = 800;
const WHEEL_FACTOR = 120;

// Based on https://github.com/facebookarchive/fixed-data-table/blob/3a9bf338b22406169e7261f85ddeda22ddce3b6f/src/vendor_upstream/dom/normalizeWheel.js
function normalizeWheel(event: WheelEvent) {
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
    type: 'wheel',
    originalEvent: event,
    spinX,
    spinY,
    deltaX,
    deltaY,
    deltaMode,
  };
}

export default class WheelSensor {
  constructor(node: HTMLElement, config: WheelSensorConfig = {}) {
    if (config.threshold === false) {
      this.threshold = 0;
    } else if (typeof config.threshold === 'number') {
      this.threshold = config.threshold;
    }
    this.wheel = share(
      config.preventDefault
        ? pipe(
            fromEvent(node, WHEEL, {passive: false}),
            preventDefault(),
          )
        : fromEvent(node, WHEEL),
    );
    this.lethargy = new Lethargy();
  }

  wheel: Callbag;
  lethargy: Lethargy;
  endTimeout: ?TimeoutID = null;
  resetTimeout: ?TimeoutID = null;
  threshold: number = GESTURE_THRESHOLD;
  intent: false | typeof DOWN | typeof UP | typeof LEFT | typeof RIGHT = false;
  accX: number = 0;
  accY: number = 0;
  deltaX: number = 0;
  deltaY: number = 0;

  state = (source: Callbag) => (start: 0, sink: Callbag) => {
    if (start !== 0) return;
    let talkback;
    source(0, (type, data) => {
      if (type === 0) {
        talkback = data;
        sink(type, data);
      } else if (type === 1) {
        // We're seeing a wheel event, so debounce the state reset,
        // in case it's part of an ongoing gesture.
        if (this.resetTimeout) clearTimeout(this.resetTimeout);
        this.resetTimeout = setTimeout(this.reset, GESTURE_END_TIMEOUT);

        const normalized = normalizeWheel(data);

        let intentional = this.lethargy.check(data);

        // If we've already identified a gesture intent,
        // check to see if this event indicates a new intention.
        if (this.intent && !intentional) {
          // If the direction of this event is not the same
          // as the previously identified intent,
          // assume it is intentional.
          intentional =
            this.intent !== direction(normalized.deltaX, normalized.deltaY);

          if (intentional) {
            // This event appears to be intentional,
            // but we've already identified an intended gesture,
            // so reset the gesture state to try and figure out
            // the new intention.
            this.reset();
          } else {
            // This event probably isn't intentional
            // (i.e., trackpad inertia), so ignore it.
            talkback(1);
            return false;
          }
        }

        // We're still gesturing, so debounce the end event.
        if (this.endTimeout) clearTimeout(this.endTimeout);

        // Update state with the event deltas.
        this.deltaX = normalized.deltaX;
        this.deltaY = normalized.deltaY;
        this.accX += normalized.deltaX;
        this.accY += normalized.deltaY;

        if (
          this.threshold &&
          Math.max(Math.abs(this.accX), Math.abs(this.accY)) >= this.threshold
        ) {
          // If we have a defined gesture threshold,
          // and the accumulated magnitude is above the threshold,
          // declare a gesture intent.
          this.intent = direction(this.accX, this.accY);
        }

        // Schedule an end event.
        this.endTimeout = setTimeout(gestureEnd(sink), GESTURE_END_TIMEOUT);
        sink(1, normalized);
      } else {
        sink(type, data);
      }
    });
  };

  reset = () => {
    this.accX = 0;
    this.accY = 0;
    this.deltaX = 0;
    this.deltaY = 0;
    this.intent = false;
    this.lethargy = new Lethargy();
  };

  subscribe(
    observer: ?(Observer | Function),
    error: ?Function,
    complete: ?Function,
  ): Subscription {
    if (typeof observer !== 'object' || observer === null) {
      observer = {next: observer, error, complete};
    }
    return {
      unsubscribe: pipe(
        this.wheel,
        this.state,
        subscribe(observer),
      ),
    };
  }
}
