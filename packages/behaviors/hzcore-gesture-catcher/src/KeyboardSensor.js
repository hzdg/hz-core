/* eslint-disable no-duplicate-imports */
// @flow
import merge from 'callbag-merge';
import Sensor from './Sensor';
import {fromEvent} from './callbags';

import {KEY_DOWN, KEY_UP, CODES, KEY_CODES_2_CODES} from './types';

import type {SensorConfig, SensorInterface} from './types';

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

export default class KeyboardSensor extends Sensor implements SensorInterface {
  constructor(node: HTMLElement, config: SensorConfig) {
    super(config);
    this.source = merge(
      fromEvent(getNearestFocusableNode(node), KEY_DOWN),
      fromEvent(document, KEY_UP),
    );
  }

  gesturingKey: ?KeyboardEvent = null;

  shouldPreventDefault(event: Event) {
    return (
      event instanceof KeyboardEvent &&
      isGestureKey(event) &&
      super.shouldPreventDefault(event)
    );
  }

  onData(data: KeyboardEvent) {
    switch (data.type) {
      case KEY_DOWN: {
        if (this.gesturingKey) {
          if (isRepeatKey(this.gesturingKey, data)) {
            return data;
          }
        } else if (isGestureKey(data)) {
          this.gesturingKey = data;
          return data;
        }
        return null;
      }
      case KEY_UP: {
        if (this.gesturingKey && isSameKey(this.gesturingKey, data)) {
          this.gesturingKey = null;
          return data;
        }
        return null;
      }
    }
  }
}
