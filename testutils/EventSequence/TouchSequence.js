// @flow
/* eslint-env jest */
import invariant from 'invariant';
import {TOUCH_START, TOUCH_MOVE, TOUCH_END} from './types';
import EventSequence from './EventSequence';
import {getFlag, getValue, getTouchAt} from '..';

type TouchEventType = typeof TOUCH_START | typeof TOUCH_MOVE | typeof TOUCH_END;

type TouchInit = {
  identifier: number,
  target: EventTarget,
  screenX?: number,
  screenY?: number,
  clientX?: number,
  clientY?: number,
};

type TouchMoveInit = {
  identifier: number,
  target: EventTarget,
  screenX?: number,
  screenY?: number,
  clientX?: number,
  clientY?: number,
  x?: number,
  y?: number,
};

type TouchEventInit = {
  touches?: TouchInit[],
  ctrlKey?: boolean,
  shiftKey?: boolean,
  altKey?: boolean,
  metaKey?: boolean,
};

type TouchMoveEventInit = {
  touches?: TouchMoveInit[],
};

type TouchStartSequence = EventSequence & {
  move(opts: TouchMoveEventInit): TouchStartSequence,
  end(): TouchSequence,
};

const DEFAULT_TOUCH_INIT = {
  identifier: 0,
  clientX: 0,
  clientY: 0,
  screenX: 0,
  screenY: 0,
};

const DEFAULT_TOUCH_EVENT_INIT = {
  touches: [{...DEFAULT_TOUCH_INIT}],
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  metaKey: false,
};

function normalizeTouchInitList(
  init: TouchInit[],
  from: TouchList,
): TouchInit[] {
  invariant(
    init.length === from.length,
    `Cannot normalize ${init.length} touches from ${(from: any)}`,
  );

  return init.map((touchInit, i) => {
    const fromTouch = getTouchAt(from, i);
    invariant(
      fromTouch,
      `Cannot normalize touch ${touchInit.identifier} from ${(from: any)}`,
    );
    return normalizeTouchInit(touchInit, fromTouch);
  });
}

function normalizeTouchInit(init: TouchInit, from: Touch): TouchInit {
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
    identifier: getValue(init, 'identifier', from.identifier),
    target: getValue(init, 'target', from.target),
    screenX,
    screenY,
    clientX,
    clientY,
  };
}

function normalizeTouchEventInit(
  init: TouchInit | TouchEventInit | TouchMoveEventInit,
  from: TouchEvent,
): Event$Init & TouchEventInit {
  let touches = getValue(init, 'touches', init);
  if (!Array.isArray(touches)) touches = [touches];

  return {
    ctrlKey: getFlag(init, 'ctrlKey', from.ctrlKey),
    shiftKey: getFlag(init, 'shiftKey', from.shiftKey),
    altKey: getFlag(init, 'altKey', from.altKey),
    metaKey: getFlag(init, 'metaKey', from.metaKey),
    bubbles: true,
    cancelable: true,
    view: window,
    touches: normalizeTouchInitList(touches, from.touches),
  };
}

export default class TouchSequence extends EventSequence {
  static createNextEvent(
    type: TouchEventType,
    init: TouchInit | TouchEventInit | TouchMoveEventInit = {},
    lastEvent?: ?TouchEvent,
  ): TouchEvent {
    return new TouchEvent(
      type,
      normalizeTouchEventInit(
        init,
        lastEvent || new TouchEvent('init', DEFAULT_TOUCH_EVENT_INIT),
      ),
    );
  }
  start(startOpts: TouchInit | TouchEventInit): TouchStartSequence {
    const downSequence: TouchStartSequence = this.dispatch(
      TOUCH_START,
      startOpts,
    ).expose({
      start: false,
      move: (moveOpts: TouchMoveEventInit): TouchStartSequence =>
        downSequence.dispatch(TOUCH_MOVE, moveOpts),
      end: (): TouchSequence => this.dispatch(TOUCH_END),
    });
    return downSequence;
  }
}
