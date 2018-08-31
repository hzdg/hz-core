/* eslint-disable no-duplicate-imports */
// @flow
import merge from 'callbag-merge';
import pipe from 'callbag-pipe';
import share from 'callbag-share';
import subscribe from 'callbag-subscribe';
import {fromEvent, preventDefault} from './callbags';
import {MOUSE_DOWN, MOUSE_MOVE, MOUSE_UP} from './types';

import type {Callbag, Observer, Subscription, MouseSensorConfig} from './types';

export default class MouseSensor {
  constructor(node: HTMLElement, config: MouseSensorConfig = {}) {
    this.mouseDown = share(fromEvent(node, MOUSE_DOWN));
    this.mouseUp = share(fromEvent(document, MOUSE_UP));
    this.mouseMove = share(
      config.preventDefault
        ? pipe(
            fromEvent(document, MOUSE_MOVE, {passive: false}),
            preventDefault(),
          )
        : fromEvent(document, MOUSE_MOVE),
    );
  }

  mouseDown: Callbag;
  mouseMove: Callbag;
  mouseUp: Callbag;
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
          case MOUSE_DOWN: {
            if (this.gesturing) return talkback(1);
            this.gesturing = true;
            return sink(1, data);
          }
          case MOUSE_MOVE: {
            if (!this.gesturing) return talkback(1);
            return sink(1, data);
          }
          case MOUSE_UP: {
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
        merge(this.mouseDown, this.mouseMove, this.mouseUp),
        this.state,
        subscribe(observer),
      ),
    };
  }
}
