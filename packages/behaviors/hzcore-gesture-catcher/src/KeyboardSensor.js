/* eslint-disable no-duplicate-imports */
// @flow
import merge from 'callbag-merge';
import pipe from 'callbag-pipe';
import share from 'callbag-share';
import subscribe from 'callbag-subscribe';
import {fromEvent, preventDefault} from './callbags';

import {KEY_DOWN, KEY_UP, CODES, KEY_CODES_2_CODES} from './types';

import type {
  Callbag,
  Observer,
  Subscription,
  KeyboardSensorConfig,
} from './types';

const getKeyCode = (event: KeyboardEvent) =>
  event.code || KEY_CODES_2_CODES[event.keyCode];

const isGestureKey = (event: KeyboardEvent) => {
  const code = getKeyCode(event);
  return CODES.some(v => code === v);
};

const isSameKey = (eventA: KeyboardEvent, eventB: KeyboardEvent) =>
  eventB && eventA && getKeyCode(eventA) === getKeyCode(eventB);

const isRepeatKey = (eventA: KeyboardEvent, eventB: KeyboardEvent) =>
  isSameKey(eventA, eventB) &&
  eventB.type === eventA.type &&
  eventB.ctrlKey === eventA.ctrlKey &&
  eventB.shiftKey === eventA.shiftKey &&
  eventB.altKey === eventA.altKey &&
  eventB.metaKey === eventA.metaKey;

function getNearestFocusableNode(node: ?Node): Node {
  if (node instanceof Document) return node;
  if (!(node instanceof HTMLElement)) return document;
  if (node.tabIndex >= 0) return node;
  return getNearestFocusableNode(node.parentNode);
}

export default class KeyboardSensor {
  constructor(node: HTMLElement, config: KeyboardSensorConfig = {}) {
    this.keyDown = share(
      config.preventDefault
        ? pipe(
            fromEvent(getNearestFocusableNode(node), KEY_DOWN),
            preventDefault(isGestureKey),
          )
        : fromEvent(getNearestFocusableNode(node), KEY_DOWN),
    );
    this.keyUp = share(
      config.preventDefault
        ? pipe(
            fromEvent(document, KEY_UP),
            preventDefault(isGestureKey),
          )
        : fromEvent(document, KEY_UP),
    );
  }

  keyDown: Callbag;
  keyUp: Callbag;
  gesturingKey: ?KeyboardEvent = null;

  state = (source: Callbag) => (start: 0, sink: Callbag) => {
    if (start !== 0) return;
    let talkback;
    source(0, (type, data) => {
      if (type === 0) {
        talkback = data;
        sink(type, data);
      } else if (type === 1) {
        switch (data.type) {
          case KEY_DOWN: {
            if (this.gesturingKey) {
              if (isRepeatKey(this.gesturingKey, data)) {
                return sink(1, data);
              }
            } else if (isGestureKey(data)) {
              this.gesturingKey = data;
              return sink(1, data);
            }
            return talkback(1);
          }
          case KEY_UP: {
            if (this.gesturingKey && isSameKey(this.gesturingKey, data)) {
              this.gesturingKey = null;
              return sink(1, data);
            }
            return talkback(1);
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
        merge(this.keyDown, this.keyUp),
        this.state,
        subscribe(observer),
      ),
    };
  }
}
