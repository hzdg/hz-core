// @flow
/* eslint-env jest */
import {
  KEY_DOWN,
  KEY_UP,
  SPACE,
  PAGE_UP,
  PAGE_DOWN,
  END,
  HOME,
  ARROW_LEFT,
  ARROW_UP,
  ARROW_RIGHT,
  ARROW_DOWN,
} from './types';
import EventSequence from './EventSequence';

export default class KeyboardSequence extends EventSequence {
  constructor() {
    throw new Error('KeyboardSequence not implemented yet!');
  }
  static createEvent(
    type,
    key,
    {
      location = 0,
      ctrlKey = false,
      shiftKey = false,
      altKey = false,
      metaKey = false,
      repeat = false,
    } = {},
  ) {
    return new KeyboardEvent(type, {
      bubbles: true,
      cancelable: true,
      view: window,
      location,
      ctrlKey,
      shiftKey,
      altKey,
      metaKey,
      repeat,
      ...key,
    });
  }
  down(key, keyOpts) {
    const repeatable = this.dispatch('keydown', key, keyOpts).expose({
      repeat: () =>
        repeatable.dispatch('keydown', key, {...keyOpts, repeat: true}),
      up: () => this.dispatch('keyup', key, keyOpts),
    });
    return repeatable;
  }
}
