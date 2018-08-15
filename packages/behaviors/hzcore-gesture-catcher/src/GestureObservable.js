// @flow
/* eslint-disable no-duplicate-imports */
import filter from 'callbag-filter';
import flatten from 'callbag-flatten';
import fromEvent from 'callbag-from-event';
import map from 'callbag-map';
import merge from 'callbag-merge';
import pipe from 'callbag-pipe';
import scan from 'callbag-scan';
import share from 'callbag-share';
import startWith from 'callbag-start-with';
import subscribe from 'callbag-subscribe';
import takeUntil from 'callbag-take-until';
import {
  KEY_DOWN,
  KEY_UP,
  MOUSE_DOWN,
  MOUSE_MOVE,
  MOUSE_UP,
  TOUCH_START,
  TOUCH_MOVE,
  TOUCH_END,
  WHEEL,
} from './types';
import {isGestureKey, isRepeatKey, not, getNearestFocusableNode} from './utils';

import type {GestureCatcherConfig, GestureState} from './types';

type Callbag = any;
type Observer = {
  next: ?(value: any) => void,
  error: ?(error: Error) => void,
  complete: ?() => void,
};
type Subscription = {
  unsubscribe(): void,
};
type GestureEvent = any;

const defaultInitialState: GestureState = {
  x: 0,
  y: 0,
  xDelta: 0,
  yDelta: 0,
  xInitial: 0,
  yInitial: 0,
  xPrev: 0,
  yPrev: 0,
  xVelocity: 0,
  yVelocity: 0,
  gesturing: false,
};

const defaultConfig = {
  preventDefault: false,
  keyboard: true,
  mouse: true,
  touch: true,
  wheel: true,
};

function parseConfig(config: any): GestureCatcherConfig {
  if (!config) return {...defaultConfig};
  return {...defaultConfig, ...config};
}

function initializeState(initialState: any): GestureState {
  if (!initialState) return {...defaultInitialState};
  return {...defaultInitialState, ...initialState};
}

export default class GestureObservable {
  constructor(
    node: HTMLElement,
    config: GestureCatcherConfig,
    initialState: GestureState,
  ) {
    this.state = share(
      pipe(
        gestures(node, parseConfig(config)),
        scan(reduceGestureState, initializeState(initialState)),
      ),
    );
  }

  static create(
    node: HTMLElement,
    config: GestureCatcherConfig,
    initialState: GestureState,
  ) {
    return new this.prototype.constructor(node, config, initialState);
  }

  state: Callbag;

  subscribe(
    observer: ?(Observer | Function),
    error: ?Function,
    complete: ?Function,
  ): Subscription {
    if (typeof observer !== 'object' || observer === null) {
      observer = {next: observer, error, complete};
    }
    return {unsubscribe: pipe(this.state, subscribe(observer))};
  }
}

const preventDefault: Callbag = map((event: GestureEvent) => {
  if (typeof event.preventDefault === 'function') {
    event.preventDefault();
  }
  return event;
});

const exclude = (fn): Callbag => filter(not(fn));

const gesture = (
  source: Callbag,
  startSource: Callbag,
  endSelector: (value: any) => Callbag,
): Callbag =>
  pipe(
    startSource,
    map(value => {
      const endSource = endSelector(value);
      return merge(
        pipe(source, takeUntil(endSource), startWith(value)),
        endSource,
      );
    }),
    flatten,
  );

function* generateGestures(
  node: HTMLElement,
  config: GestureCatcherConfig,
): Generator<Callbag, *, *> {
  if (config.mouse) yield mouse(node, config.preventDefault);
  if (config.touch) yield touch(node, config.preventDefault);
  if (config.wheel) yield wheel(node, config.preventDefault);
  if (config.keyboard) yield keyboard(node, config.preventDefault);
}

function gestures(node: HTMLElement, config: GestureCatcherConfig): Callbag {
  return merge(...generateGestures(node, config));
}

function mouse(node: HTMLElement, shouldPreventDefault: ?boolean): Callbag {
  const mouseDown = fromEvent(node, MOUSE_DOWN);
  const mouseUp = fromEvent(document, MOUSE_UP);
  const mouseMove = shouldPreventDefault
    ? pipe(fromEvent(document, MOUSE_MOVE, {passive: false}), preventDefault)
    : fromEvent(document, MOUSE_MOVE);
  return gesture(mouseMove, mouseDown, () => mouseUp);
}

function touch(node: HTMLElement, shouldPreventDefault: ?boolean): Callbag {
  const touchStart = fromEvent(node, TOUCH_START);
  const touchEnd = fromEvent(document, TOUCH_END);
  const touchMove = shouldPreventDefault
    ? pipe(fromEvent(document, TOUCH_MOVE, {passive: false}), preventDefault)
    : fromEvent(document, TOUCH_MOVE);
  return gesture(touchMove, touchStart, () => touchEnd);
}

function wheel(node: HTMLElement, shouldPreventDefault: ?boolean): Callbag {
  const wheelMove = shouldPreventDefault
    ? pipe(fromEvent(node, WHEEL, {passive: false}), preventDefault)
    : fromEvent(node, WHEEL);
  return wheelMove;
}

function keyboard(node: HTMLElement, shouldPreventDefault: ?boolean): Callbag {
  const keyDown = shouldPreventDefault
    ? pipe(fromEvent(getNearestFocusableNode(node), KEY_DOWN), preventDefault)
    : fromEvent(getNearestFocusableNode(node), KEY_DOWN);
  const keyUp = shouldPreventDefault
    ? pipe(fromEvent(document, KEY_UP), preventDefault)
    : fromEvent(document, KEY_UP);
  const keyStart = pipe(keyDown, filter(isGestureKey));
  const keyStopSelector = keyDownEvent =>
    merge(keyUp, pipe(keyDown, exclude(isRepeatKey(keyDownEvent))));
  return gesture(keyDown, keyStart, keyStopSelector);
}

function reduceGestureState(
  state: GestureState,
  event: GestureEvent,
): GestureState {
  const nextState = {
    ...state,
    xPrev: state.x,
    yPrev: state.y,
  };
  nextState.x = event.pageX;
  nextState.y = event.pageY;
  nextState.xDelta = event.pageX - state.xInitial;
  nextState.yDelta = event.pageY - state.yInitial;
  nextState.xVelocity = event.pageX - nextState.x;
  nextState.yVelocity = event.pageY - nextState.y;
  state = nextState;
  return state;
}
