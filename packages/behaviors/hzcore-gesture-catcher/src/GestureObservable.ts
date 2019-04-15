import $$observable from 'symbol-observable';
import flatten from 'callbag-flatten';
import merge from 'callbag-merge';
import pipe from 'callbag-pipe';
import scan from 'callbag-scan';
import share from 'callbag-share';
import subscribe from 'callbag-subscribe';
import mapChanged from './mapChanged';
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
  GestureCatcherConfig,
  GestureEvent,
  GestureState,
  Observer,
  Subscription,
  SensorConfig,
} from './types';

import Sensor from './Sensor';
import {Callbag, Sink, Source} from 'callbag';

const defaultInitialState: GestureState = {
  x: 0,
  y: 0,
  xSpin: 0,
  ySpin: 0,
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
  passive: false,
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

class Config {
  constructor(config: any) {
    this.config = parseConfig(config);
    this.handlers = new Set();
  }

  config: GestureCatcherConfig;
  handlers: Set<(config: GestureCatcherConfig) => void>;

  read = (start: 0 | 1 | 2, sink: Sink<any>): void => {
    if (start !== 0) return;
    const handler = (config: GestureCatcherConfig) => sink(1, config);
    this.handlers.add(handler);
    sink(0, (stop: 0 | 1 | 2) => {
      if (stop === 2) this.handlers.delete(handler);
    });
    if (this.config && this.handlers.has(handler)) {
      handler(this.config);
    }
  };

  write = (config: any): void => {
    this.config = parseConfig(config);
    this.handlers.forEach(handler => handler(this.config));
  };
}

export default class GestureObservable {
  constructor(
    node: HTMLElement,
    config: GestureCatcherConfig,
    initialState: GestureState,
  ) {
    this.config = new Config(config);
    this.state = share(
      pipe(
        this.config.read,
        mapChanged(this.createSourceConfigurator(node)),
        flatten,
        scan(reduceGestureState, initializeState(initialState)),
      ),
    );
  }

  static create(
    node: HTMLElement,
    config: GestureCatcherConfig,
    initialState: GestureState,
  ) {
    return new (this.prototype.constructor as typeof GestureObservable)(
      node,
      config,
      initialState,
    );
  }

  // rxjs interopt
  // $FlowFixMe: Computed property keys not supported.
  [$$observable]() {
    return this;
  }

  config: Config;
  state: Callbag<any, any>;
  source?: Source<any> | null;
  mouseSensor?: MouseSensor | null;
  touchSensor?: TouchSensor | null;
  keyboardSensor?: KeyboardSensor | null;
  wheelSensor?: WheelSensor | null;

  createSourceConfigurator(node: HTMLElement) {
    return ({mouse, touch, wheel, keyboard, ...all}: GestureCatcherConfig) => {
      if (mouse) {
        const mouseConfig = makeSensorConfig(all, mouse);
        if (!this.mouseSensor || !this.mouseSensor.updateConfig(mouseConfig)) {
          this.mouseSensor = new MouseSensor(node, mouseConfig);
          this.source = null;
        }
      } else if (this.mouseSensor) {
        this.mouseSensor = null;
        this.source = null;
      }

      if (touch) {
        const touchConfig = makeSensorConfig(all, touch);
        if (!this.touchSensor || !this.touchSensor.updateConfig(touchConfig)) {
          this.touchSensor = new TouchSensor(node, touchConfig);
          this.source = null;
        }
      } else if (this.touchSensor) {
        this.touchSensor = null;
        this.source = null;
      }

      if (wheel) {
        const wheelConfig = makeSensorConfig(all, wheel);
        if (!this.wheelSensor || !this.wheelSensor.updateConfig(wheelConfig)) {
          this.wheelSensor = new WheelSensor(node, wheelConfig);
          this.source = null;
        }
      } else if (this.wheelSensor) {
        this.wheelSensor = null;
        this.source = null;
      }

      if (keyboard) {
        const keyboardConfig = makeSensorConfig(all, keyboard);
        if (
          !this.keyboardSensor ||
          !this.keyboardSensor.updateConfig(keyboardConfig)
        ) {
          this.keyboardSensor = new KeyboardSensor(node, keyboardConfig);
          this.source = null;
        }
      } else if (this.keyboardSensor) {
        this.keyboardSensor = null;
        this.source = null;
      }

      if (!this.source) {
        this.source = merge(
          ...[
            this.mouseSensor,
            this.touchSensor,
            this.keyboardSensor,
            this.wheelSensor,
          ]
            .filter(sensor => Boolean(sensor))
            .map(sensor => fromSensor(sensor as Sensor)),
        );
      }

      return this.source;
    };
  }

  updateConfig(config: GestureCatcherConfig) {
    this.config.write(config);
  }

  subscribe(
    observer: Partial<Observer> | ((value: any) => void),
    error?: (error: Error) => void,
    complete?: () => void,
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

function makeSensorConfig(
  base: SensorConfig,
  config: SensorConfig | boolean,
): SensorConfig {
  return typeof config === 'object' ? {...base, ...config} : {...base};
}

function fromSensor(sensor: Sensor): Callbag<any, any> {
  return (start: 0 | 1 | 2, sink: Sink<any>) => {
    if (start === 0) {
      const subscription = sensor.subscribe(v => sink(1, v));
      sink(0, (done: 0 | 1 | 2) => {
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
      nextState.xDelta = 0;
      nextState.yDelta = 0;
      nextState.xVelocity = 0;
      nextState.yVelocity = 0;
      break;
    case WHEEL:
      nextState.xInitial = event.clientX || event.originalEvent.clientX;
      nextState.yInitial = event.clientY || event.originalEvent.clientY;
      nextState.xPrev = event.clientX || event.originalEvent.clientX;
      nextState.yPrev = event.clientY || event.originalEvent.clientY;
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
      nextState.xSpin =
        state.type === WHEEL
          ? state.xSpin + event.spinX
          : event.spinX
          ? event.spinX
          : 0;
      nextState.ySpin =
        state.type === WHEEL
          ? state.ySpin + event.spinY
          : event.spinY
          ? event.spinY
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
