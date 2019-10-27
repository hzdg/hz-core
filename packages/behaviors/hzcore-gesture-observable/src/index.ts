import Observable from 'zen-observable';
import {ensureDOMInstance} from '@hzcore/dom-utils';
import merge from 'callbag-merge';
import asObservable from './asObservable';
import * as Orientation from './Orientation';
import * as WheelGestureObservable from './WheelGestureObservable';
import * as MouseGestureObservable from './MouseGestureObservable';
import * as TouchGestureObservable from './TouchGestureObservable';
import * as KeyboardGestureObservable from './KeyboardGestureObservable';

export {
  WheelGestureObservable,
  MouseGestureObservable,
  TouchGestureObservable,
  KeyboardGestureObservable,
};

export {HORIZONTAL, VERTICAL} from './Orientation';
export {WHEEL, GESTURE_END} from './WheelGestureObservable';
export {MOUSE_DOWN, MOUSE_MOVE, MOUSE_UP} from './MouseGestureObservable';
export {TOUCH_START, TOUCH_MOVE, TOUCH_END} from './TouchGestureObservable';
export {
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
} from './KeyboardGestureObservable';

export type Orientation = Orientation.Orientation;

export type WheelGestureType = WheelGestureObservable.WheelGestureType;
export type WheelGestureEvent = WheelGestureObservable.WheelGestureEvent;
export type GestureEndEvent = WheelGestureObservable.GestureEndEvent;
export type WheelGestureState = WheelGestureObservable.WheelGestureState;
export type WheelGestureEndState = WheelGestureObservable.WheelGestureEndState;
export type WheelGestureObservableConfig = WheelGestureObservable.WheelGestureObservableConfig;

export type MouseGestureType = MouseGestureObservable.MouseGestureType;
export type MouseGestureEvent = MouseGestureObservable.MouseGestureEvent;
export type MouseGestureState = MouseGestureObservable.MouseGestureState;
export type MouseGestureEndState = MouseGestureObservable.MouseGestureEndState;
export type MouseGestureObservableConfig = MouseGestureObservable.MouseGestureObservableConfig;

export type TouchGestureType = TouchGestureObservable.TouchGestureType;
export type TouchGestureEvent = TouchGestureObservable.TouchGestureEvent;
export type TouchGestureState = TouchGestureObservable.TouchGestureState;
export type TouchGestureEndState = TouchGestureObservable.TouchGestureEndState;
export type TouchGestureObservableConfig = TouchGestureObservable.TouchGestureObservableConfig;

export type KeyboardGestureType = KeyboardGestureObservable.KeyboardGestureType;
export type KeyboardGestureEvent = KeyboardGestureObservable.KeyboardGestureEvent;
export type KeyboardGestureState = KeyboardGestureObservable.KeyboardGestureState;
export type KeyboardGestureEndState = KeyboardGestureObservable.KeyboardGestureEndState;
export type KeyboardGestureObservableConfig = KeyboardGestureObservable.KeyboardGestureObservableConfig;

/**
 * An event associated with a gesture.
 */
export type GestureEvent =
  | MouseGestureEvent
  | TouchGestureEvent
  | KeyboardGestureEvent
  | WheelGestureEvent
  | GestureEndEvent;

/**
 * An event type associated with a gesture.
 */
export type GestureType =
  | MouseGestureType
  | TouchGestureType
  | KeyboardGestureType
  | WheelGestureType;

/**
 * A snapshot of a previous or in-progress gesture.
 */
export type GestureState =
  | MouseGestureState
  | MouseGestureEndState
  | TouchGestureState
  | TouchGestureEndState
  | KeyboardGestureState
  | KeyboardGestureEndState
  | WheelGestureState
  | WheelGestureEndState;

interface GestureSourceConfig {
  /** Whether or not to observe keyboard gestures. Defaults to `true`. */
  keyboard: boolean;
  /** Whether or not to observe mouse gestures. Defaults to `true`. */
  mouse: boolean;
  /** Whether or not to observe touch gestures. Defaults to `true`. */
  touch: boolean;
  /** Whether or not to observe wheel gestures. Defaults to `true`. */
  wheel: boolean;
}

type MouseEnabledConfig = Partial<
  GestureSourceConfig & MouseGestureObservableConfig
> & {
  mouse: true;
};
type TouchEnabledConfig = Partial<
  GestureSourceConfig & TouchGestureObservableConfig
> & {
  touch: true;
};
type KeyboardEnabledConfig = Partial<
  GestureSourceConfig & KeyboardGestureObservableConfig
> & {
  keyboard: true;
};
type WheelEnabledConfig = Partial<
  GestureSourceConfig & WheelGestureObservableConfig
> & {
  wheel: true;
};

/**
 * Configuration for a GestureObservable.
 */
export type GestureObservableConfig =
  | MouseEnabledConfig
  | TouchEnabledConfig
  | KeyboardEnabledConfig
  | WheelEnabledConfig;

const DEFAULT_CONFIG: GestureObservableConfig = {
  passive: false,
  preventDefault: false,
  keyboard: true,
  mouse: true,
  touch: true,
  wheel: true,
};

export function parseConfig(
  config?: GestureObservableConfig | null,
): GestureObservableConfig {
  if (!config) {
    return {...DEFAULT_CONFIG};
  } else {
    const {keyboard, mouse, touch, wheel} = config;
    if (keyboard || mouse || touch || wheel) {
      return {
        ...DEFAULT_CONFIG,
        keyboard: false,
        mouse: false,
        touch: false,
        wheel: false,
        ...config,
      };
    } else {
      return {...DEFAULT_CONFIG, ...config};
    }
  }
}

/**
 * An Observable of gestures.
 */
export function create(
  /** The DOM element to observe for gestures. */
  element: Element,
  /** Configuration for the GestureObservable. */
  config?: GestureObservableConfig | null,
): Observable<GestureState> {
  ensureDOMInstance(element, Element);
  config = parseConfig(config);

  const sources = [];
  if (config.mouse) {
    sources.push(MouseGestureObservable.createSource(element, config));
  }
  if (config.touch) {
    sources.push(TouchGestureObservable.createSource(element, config));
  }
  if (config.wheel) {
    sources.push(WheelGestureObservable.createSource(element, config));
  }
  if (config.keyboard) {
    sources.push(KeyboardGestureObservable.createSource(element, config));
  }

  const gestureState = merge(...sources);

  return asObservable(gestureState);
}

export default {create};
