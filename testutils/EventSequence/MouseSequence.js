// @flow
/* eslint-env jest */
import {MOUSE_DOWN, MOUSE_MOVE, MOUSE_UP} from './types';
import EventSequence from './EventSequence';
import {getFlag, getValue} from '..';

type MouseEventType = typeof MOUSE_DOWN | typeof MOUSE_MOVE | typeof MOUSE_UP;

type MouseEventInit = {
  screenX?: number,
  screenY?: number,
  clientX?: number,
  clientY?: number,
  ctrlKey?: boolean,
  shiftKey?: boolean,
  altKey?: boolean,
  metaKey?: boolean,
  button?: number,
};

type MouseMoveEventInit = {
  screenX?: number,
  screenY?: number,
  clientX?: number,
  clientY?: number,
  x?: number,
  y?: number,
};

type MouseDownSequence = EventSequence & {
  move(opts: MouseMoveEventInit): MouseDownSequence,
  up(): MouseSequence,
};

const DEFAULT_MOUSE_EVENT_INIT = {
  screenX: 0,
  screenY: 0,
  clientX: 0,
  clientY: 0,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  metaKey: false,
  button: 0,
};

function normalizeMouseEventInit(
  init: MouseEventInit | MouseMoveEventInit,
  from: MouseEvent,
): MouseEvent$MouseEventInit {
  const clientX = getValue(init, 'clientX', getValue(init, 'x', from.clientX));
  const clientY = getValue(init, 'clientY', getValue(init, 'y', from.clientY));
  const screenX = getValue(
    init,
    'screenX',
    from.screenX + clientX - from.clientX,
  );
  const screenY = getValue(
    init,
    'screenY',
    from.screenY + clientY - from.clientY,
  );
  return {
    ctrlKey: getFlag(init, 'ctrlKey', from.ctrlKey),
    shiftKey: getFlag(init, 'shiftKey', from.shiftKey),
    altKey: getFlag(init, 'altKey', from.altKey),
    metaKey: getFlag(init, 'metaKey', from.metaKey),
    button: getValue(init, 'button', from.button),
    bubbles: true,
    cancelable: true,
    view: window,
    screenX,
    screenY,
    clientX,
    clientY,
  };
}

export default class MouseSequence extends EventSequence {
  static createNextEvent(
    type: MouseEventType,
    init: MouseEventInit | MouseMoveEventInit = {},
    lastEvent?: ?MouseEvent,
  ): MouseEvent {
    return new MouseEvent(
      type,
      normalizeMouseEventInit(
        init,
        lastEvent || new MouseEvent('init', DEFAULT_MOUSE_EVENT_INIT),
      ),
    );
  }
  down(downOpts: MouseEventInit): MouseDownSequence {
    const downSequence: MouseDownSequence = this.dispatch(
      'mousedown',
      downOpts,
    ).expose({
      down: false,
      move: (moveOpts: MouseMoveEventInit): MouseDownSequence =>
        downSequence.dispatch('mousemove', moveOpts),
      up: (): MouseSequence => this.dispatch('mouseup'),
    });
    return downSequence;
  }
}
