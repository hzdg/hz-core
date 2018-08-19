// @flow
/* eslint-env jest */
import {WHEEL, DOM_DELTA_PIXEL, DOM_DELTA_LINE, DOM_DELTA_PAGE} from './types';
import EventSequence from './EventSequence';
import {hasProperty, getFlag, getValue} from '..';

type WheelEventType = typeof WHEEL;

type WheelDeltaMode =
  | typeof DOM_DELTA_PIXEL
  | typeof DOM_DELTA_LINE
  | typeof DOM_DELTA_PAGE;

type WheelEventInit = {
  deltaX?: number,
  deltaY?: number,
  deltaZ?: number,
  deltaMode?: WheelDeltaMode,
  ctrlKey?: boolean,
  shiftKey?: boolean,
  altKey?: boolean,
  metaKey?: boolean,
};

const DEFAULT_WHEEL_EVENT_INIT = {
  deltaX: 0,
  deltaY: 1,
  deltaZ: 0,
  deltaMode: DOM_DELTA_PIXEL,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  metaKey: false,
};

function normalizeWheelEventInit(
  init: WheelEventInit,
  from: WheelEvent,
): MouseEvent$MouseEventInit & WheelEventInit {
  const deltaY = getValue(
    init,
    'deltaY',
    hasProperty(init, 'deltaX') || hasProperty(init, 'deltaZ')
      ? 0
      : DEFAULT_WHEEL_EVENT_INIT.deltaY,
  );
  return {
    bubbles: true,
    cancelable: true,
    view: window,
    ctrlKey: getFlag(init, 'ctrlKey', from.ctrlKey),
    shiftKey: getFlag(init, 'shiftKey', from.shiftKey),
    altKey: getFlag(init, 'altKey', from.altKey),
    metaKey: getFlag(init, 'metaKey', from.metaKey),
    button: getValue(init, 'button', from.button),
    deltaX: getValue(init, 'deltaX', DEFAULT_WHEEL_EVENT_INIT.deltaX),
    deltaY,
    deltaZ: getValue(init, 'deltaZ', DEFAULT_WHEEL_EVENT_INIT.deltaZ),
    deltaMode: getValue(init, 'deltaMode', from.deltaMode),
  };
}

export default class WheelSequence extends EventSequence {
  static createNextEvent(
    type: WheelEventType,
    init: WheelEventInit = {},
    lastEvent?: ?WheelEvent,
  ): WheelEvent {
    return new WheelEvent(
      type,
      normalizeWheelEventInit(
        init,
        lastEvent || new WheelEvent('init', DEFAULT_WHEEL_EVENT_INIT),
      ),
    );
  }
  wheel(wheelOpts: WheelEventInit): WheelSequence {
    const downSequence: WheelSequence = this.dispatch(WHEEL, wheelOpts);
    return downSequence;
  }
}
