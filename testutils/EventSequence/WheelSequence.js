// @flow
/* eslint-env jest */
import {WHEEL} from './types';
import EventSequence from './EventSequence';

export default class WheelSequence extends EventSequence {
  constructor() {
    throw new Error('WheelSequence not implemented yet!');
  }
  static createEvent({
    deltaX = 0.0,
    deltaY = 0.0,
    deltaZ = 0.0,
    deltaMode = 0,
  } = {}) {
    return new WheelEvent({
      bubbles: true,
      cancelable: true,
      view: window,
      deltaX,
      deltaY,
      deltaZ,
      deltaMode,
    });
  }
  wheel(wheelOpts) {
    return this.dispatch(wheelOpts);
  }
}
