/* eslint-disable no-duplicate-imports */
// @flow
import pipe from 'callbag-pipe';
import share from 'callbag-share';
import subscribe from 'callbag-subscribe';
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
  }

  wheel: Callbag;
  endTimeout: ?TimeoutID = null;
  resetTimeout: ?TimeoutID = null;
  threshold: number = GESTURE_THRESHOLD;
  done: false | typeof DOWN | typeof UP | typeof LEFT | typeof RIGHT = false;
  accX: number = 0;
  accY: number = 0;

  state = (source: Callbag) => (start: 0, sink: Callbag) => {
    if (start !== 0) return;
    let talkback;
    source(0, (type, data) => {
      if (type === 0) {
        talkback = data;
        sink(type, data);
      } else if (type === 1) {
        if (this.resetTimeout) clearTimeout(this.resetTimeout);
        this.resetTimeout = setTimeout(this.reset, GESTURE_END_TIMEOUT);

        if (this.done) {
          if (this.done === direction(data.deltaX, data.deltaY)) {
            talkback(1);
            return false;
          } else {
            this.reset();
          }
        }

        if (this.endTimeout) clearTimeout(this.endTimeout);

        this.accX += data.deltaX;
        this.accY += data.deltaY;

        if (
          this.threshold &&
          Math.max(Math.abs(this.accX), Math.abs(this.accY)) >= this.threshold
        ) {
          this.done = direction(this.accX, this.accY);
          this.endTimeout = setTimeout(gestureEnd(sink));
          sink(1, data);
        } else {
          this.endTimeout = setTimeout(gestureEnd(sink), GESTURE_END_TIMEOUT);
          sink(1, data);
        }
      } else {
        sink(type, data);
      }
    });
  };

  reset = () => {
    this.accX = 0;
    this.accY = 0;
    this.done = false;
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
