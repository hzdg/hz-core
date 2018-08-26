/* eslint-disable no-duplicate-imports, max-lines */
// @flow
import $$observable from 'symbol-observable';
import filter from 'callbag-filter';
import flatten from 'callbag-flatten';
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
  GESTURE_END,
} from './types';
import {isGestureKey, isRepeatKey, not, getNearestFocusableNode} from './utils';

// TODO: Find the smallest timeout that won't ever get tricked by inertia.
const GESTURE_END_TIMEOUT = 60;

import type {
  Callbag,
  GestureCatcherConfig,
  GestureEvent,
  GestureState,
  Observer,
  Subscription,
} from './types';

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
  key: null,
  repeat: null,
  type: null,
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
  const {
    keyboard = false,
    mouse = false,
    touch = false,
    wheel = false,
  } = config;
  if (keyboard || mouse || touch || wheel) {
    return {...defaultConfig, ...config, keyboard, mouse, touch, wheel};
  } else {
    return {...defaultConfig, ...config};
  }
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

  // rxjs interopt
  // $FlowFixMe: Computed property keys not supported.
  [$$observable]() {
    return this;
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

function preventDefault(predicate: ?(event: GestureEvent) => boolean): Callbag {
  return map((event: GestureEvent) => {
    if (typeof predicate !== 'function' || predicate(event)) {
      if (typeof event.preventDefault === 'function') {
        event.preventDefault();
      }
    }
    return event;
  });
}

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

const gestureEndDebounced = (source: Callbag): Callbag => {
  let timeout = null;
  return (start, sink) => {
    source(0, (type, data) => {
      if (type === 1) {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          sink(1, {type: GESTURE_END});
        }, GESTURE_END_TIMEOUT);
      }
      sink(type, data);
    });
  };
};

function* generateGestures(
  node: HTMLElement,
  config: GestureCatcherConfig,
): Generator<Callbag, *, *> {
  if (config.mouse) yield mouseGesture(node, config.preventDefault);
  if (config.touch) yield touchGesture(node, config.preventDefault);
  if (config.wheel) yield wheelGesture(node, config.preventDefault);
  if (config.keyboard) yield keyboardGesture(node, config.preventDefault);
}

function gestures(node: HTMLElement, config: GestureCatcherConfig): Callbag {
  return merge(...generateGestures(node, config));
}

function fromEvent(node: Node, name: string, options: any): Callbag {
  return (start, sink) => {
    if (start !== 0) return;
    const handler = ev => sink(1, ev);
    sink(0, t => {
      if (t === 2) node.removeEventListener(name, handler, options);
    });
    node.addEventListener(name, handler, options);
  };
}

function mouseGesture(
  node: HTMLElement,
  shouldPreventDefault: ?boolean,
): Callbag {
  const mouseDown = fromEvent(node, MOUSE_DOWN);
  const mouseUp = fromEvent(document, MOUSE_UP);
  const mouseMove = shouldPreventDefault
    ? pipe(fromEvent(document, MOUSE_MOVE, {passive: false}), preventDefault())
    : fromEvent(document, MOUSE_MOVE);
  return gesture(mouseMove, mouseDown, () => mouseUp);
}

function touchGesture(
  node: HTMLElement,
  shouldPreventDefault: ?boolean,
): Callbag {
  const touchStart = fromEvent(node, TOUCH_START);
  const touchEnd = fromEvent(document, TOUCH_END);
  const touchMove = shouldPreventDefault
    ? pipe(fromEvent(document, TOUCH_MOVE, {passive: false}), preventDefault())
    : fromEvent(document, TOUCH_MOVE);
  return gesture(touchMove, touchStart, () => touchEnd);
}

function wheelGesture(
  node: HTMLElement,
  shouldPreventDefault: ?boolean,
): Callbag {
  const wheelMove = shouldPreventDefault
    ? pipe(fromEvent(node, WHEEL, {passive: false}), preventDefault())
    : fromEvent(node, WHEEL);
  return pipe(wheelMove, gestureEndDebounced);
}

function keyboardGesture(
  node: HTMLElement,
  shouldPreventDefault: ?boolean,
): Callbag {
  const keyDown = shouldPreventDefault
    ? pipe(
        fromEvent(getNearestFocusableNode(node), KEY_DOWN),
        preventDefault(isGestureKey),
      )
    : fromEvent(getNearestFocusableNode(node), KEY_DOWN);
  const keyUp = shouldPreventDefault
    ? pipe(fromEvent(document, KEY_UP), preventDefault(isGestureKey))
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
  const {type} = event;
  switch (type) {
    case TOUCH_START:
    case TOUCH_MOVE:
    case TOUCH_END:
      [event] = event.touches;
  }

  const nextState = {
    ...state,
    x: event.clientX == null ? state.x : event.clientX, // eslint-disable-line eqeqeq
    y: event.clientY == null ? state.y : event.clientY, // eslint-disable-line eqeqeq
    key: event.code == null ? null : event.code, // eslint-disable-line eqeqeq
  };

  switch (type) {
    case KEY_DOWN:
      nextState.gesturing = true;
      break;
    case WHEEL:
      nextState.xInitial = event.clientX;
      nextState.yInitial = event.clientY;
      nextState.xPrev = event.clientX;
      nextState.yPrev = event.clientY;
      nextState.xDelta = event.deltaX;
      nextState.yDelta = event.deltaY;
      nextState.xVelocity = event.deltaX;
      nextState.yVelocity = event.deltaY;
      nextState.gesturing = true;
      break;
    case TOUCH_START:
    case MOUSE_DOWN:
      nextState.xInitial = event.clientX;
      nextState.yInitial = event.clientY;
      nextState.xPrev = event.clientX;
      nextState.yPrev = event.clientY;
      nextState.xDelta = 0;
      nextState.yDelta = 0;
      nextState.gesturing = true;
      break;
    case TOUCH_MOVE:
    case MOUSE_MOVE:
      nextState.xPrev = state.x;
      nextState.yPrev = state.y;
      nextState.xDelta = event.clientX - state.xInitial;
      nextState.yDelta = event.clientY - state.yInitial;
      nextState.xVelocity = event.clientX - state.x;
      nextState.yVelocity = event.clientY - state.y;
      nextState.gesturing = true;
      break;
    // Special case: Some gestures don't have clear start/end events,
    // (like WHEEL), so we look for this message to indicate
    // that we are no longer gesturing.
    case GESTURE_END:
    case TOUCH_END:
    case MOUSE_UP:
    case KEY_UP:
      nextState.gesturing = false;
      break;
  }
  state = nextState;
  return state;
}
