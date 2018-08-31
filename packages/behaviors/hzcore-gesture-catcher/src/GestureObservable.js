/* eslint-disable no-duplicate-imports */
// @flow
import $$observable from 'symbol-observable';
import merge from 'callbag-merge';
import pipe from 'callbag-pipe';
import scan from 'callbag-scan';
import share from 'callbag-share';
import subscribe from 'callbag-subscribe';
import MouseSensor from './MouseSensor';
import TouchSensor from './TouchSensor';
import WheelSensor from './WheelSensor';
import KeyboardSensor from './KeyboardSensor';
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
    return {
      unsubscribe: pipe(
        this.state,
        subscribe(observer),
      ),
    };
  }
}

function* generateGestures(
  node: HTMLElement,
  config: GestureCatcherConfig,
): Generator<Callbag, *, *> {
  const {mouse, touch, keyboard, wheel, ...all} = config;
  if (mouse) yield fromSensor(new MouseSensor(node, makeConfig(all, mouse)));
  if (touch) yield fromSensor(new TouchSensor(node, makeConfig(all, touch)));
  if (wheel) yield fromSensor(new WheelSensor(node, makeConfig(all, wheel)));
  if (keyboard)
    yield fromSensor(new KeyboardSensor(node, makeConfig(all, keyboard)));
}

function makeConfig(base: Object, config: Object | boolean) {
  return typeof config === 'object' ? {...base, ...config} : {...base};
}

function fromSensor(sensor) {
  return (start, sink) => {
    if (start === 0) {
      const subscription = sensor.subscribe(v => sink(1, v));
      sink(0, done => {
        if (done === 2) {
          subscription.unsubscribe();
        }
      });
    }
  };
}

function reduceGestureState(
  state: GestureState,
  event: GestureEvent,
): GestureState {
  const {type} = event;
  switch (type) {
    case TOUCH_START:
    case TOUCH_MOVE:
      [event] = event.touches;
  }

  const nextState = {
    ...state,
    type,
    x: event.clientX == null ? state.x : event.clientX, // eslint-disable-line eqeqeq
    y: event.clientY == null ? state.y : event.clientY, // eslint-disable-line eqeqeq
    key: event.code == null ? null : event.code, // eslint-disable-line eqeqeq
    repeat: event.repeat == null ? null : event.repeat, // eslint-disable-line eqeqeq
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
      nextState.xDelta =
        state.type === WHEEL
          ? state.xDelta - event.deltaX
          : event.deltaX
            ? -event.deltaX
            : 0;
      nextState.yDelta =
        state.type === WHEEL
          ? state.yDelta - event.deltaY
          : event.deltaY
            ? -event.deltaY
            : 0;
      nextState.xVelocity = event.deltaX ? -event.deltaX : 0;
      nextState.yVelocity = event.deltaY ? -event.deltaY : 0;
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
