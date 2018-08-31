/* eslint-disable no-duplicate-imports */
// @flow
import merge from 'callbag-merge';
import pipe from 'callbag-pipe';
import share from 'callbag-share';
import subscribe from 'callbag-subscribe';
import {fromEvent, preventDefault} from './callbags';
import {TOUCH_START, TOUCH_MOVE, TOUCH_END} from './types';

import type {Callbag, Observer, Subscription, TouchSensorConfig} from './types';

export default class TouchSensor {
  constructor(node: HTMLElement, config: TouchSensorConfig = {}) {
    this.touchStart = share(fromEvent(node, TOUCH_START));
    this.touchEnd = share(fromEvent(document, TOUCH_END));
    this.touchMove = share(
      config.preventDefault
        ? pipe(
            fromEvent(document, TOUCH_MOVE, {passive: false}),
            preventDefault(),
          )
        : fromEvent(document, TOUCH_MOVE),
    );
  }

  touchStart: Callbag;
  touchMove: Callbag;
  touchEnd: Callbag;
  gesturing: boolean = false;

  state = (source: Callbag) => (start: 0, sink: Callbag) => {
    if (start !== 0) return;
    let talkback;
    source(0, (type, data) => {
      if (type === 0) {
        talkback = data;
        sink(type, data);
      } else if (type === 1) {
        switch (data.type) {
          case TOUCH_START: {
            if (this.gesturing) return talkback(1);
            this.gesturing = true;
            return sink(1, data);
          }
          case TOUCH_MOVE: {
            if (!this.gesturing) return talkback(1);
            return sink(1, data);
          }
          case TOUCH_END: {
            if (!this.gesturing) return talkback(1);
            this.gesturing = false;
            return sink(1, data);
          }
        }
      } else {
        sink(type, data);
      }
    });
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
        merge(this.touchStart, this.touchMove, this.touchEnd),
        this.state,
        subscribe(observer),
      ),
    };
  }
}
