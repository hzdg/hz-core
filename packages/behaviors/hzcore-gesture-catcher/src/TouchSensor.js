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
    this.webkitHack = config.preventDefault ? new WebkitHack() : null;
  }

  touchStart: Callbag;
  touchMove: Callbag;
  touchEnd: Callbag;
  webkitHack: ?WebkitHack = null;
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
            if (this.webkitHack) this.webkitHack.preventTouchMove();
            return sink(1, data);
          }
          case TOUCH_MOVE: {
            if (!this.gesturing) return talkback(1);
            return sink(1, data);
          }
          case TOUCH_END: {
            if (!this.gesturing) return talkback(1);
            this.gesturing = false;
            if (this.webkitHack) this.webkitHack.allowTouchMove();
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

// Webkit does not allow event.preventDefault() in dynamically added handlers
// (i.e., a handler added to 'touchmove' after handling a 'touchstart'),
// so we add a permanent 'touchmove' handler to get around this.
// webkit bug: https://bugs.webkit.org/show_bug.cgi?id=184250
// Original implementation: https://github.com/atlassian/react-beautiful-dnd/pull/416
class WebkitHack {
  constructor() {
    // Do nothing when server side rendering or no touch support.
    if (typeof window !== 'undefined' && 'ontouchstart' in window) {
      // Adding a persistent event handler.
      // It can't be passive, otherwise we wouldn't
      // be able to preventDefault().
      window.addEventListener('touchmove', this.handleTouchMove, {
        passive: false,
      });
    }
  }

  shouldPreventDefault: boolean = false;

  destroy() {
    if (typeof window === 'undefined') return;
    window.removeEventListener('touchmove', this.handleTouchMove, {
      passive: false,
    });
  }

  handleTouchMove = (event: TouchEvent) => {
    if (this.shouldPreventDefault && !event.defaultPrevented) {
      event.preventDefault();
    }
  };

  preventTouchMove() {
    this.shouldPreventDefault = true;
  }

  allowTouchMove() {
    this.shouldPreventDefault = false;
  }
}
