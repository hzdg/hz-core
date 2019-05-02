import Observable from 'zen-observable';
import invariant from 'invariant';
import merge from 'callbag-merge';
import * as Wheel from './WheelGestureObservable';
import * as Mouse from './MouseGestureObservable';
import * as Touch from './TouchGestureObservable';
import * as Keyboard from './KeyboardGestureObservable';
import asObservable from './asObservable';

export {
  WHEEL,
  GESTURE_END,
  default as WheelGestureObservable,
} from './WheelGestureObservable';

export {
  MOUSE_DOWN,
  MOUSE_MOVE,
  MOUSE_UP,
  default as MouseGestureObservable,
} from './MouseGestureObservable';

export {
  TOUCH_START,
  TOUCH_MOVE,
  TOUCH_END,
  default as TouchGestureObservable,
} from './TouchGestureObservable';

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
  default as KeyboardGestureObservable,
} from './KeyboardGestureObservable';

/**
 * An event associated with a gesture.
 */
export type GestureEvent =
  | Mouse.MouseGestureEvent
  | Touch.TouchGestureEvent
  | Keyboard.KeyboardGestureEvent
  | Wheel.WheelGestureEvent
  | Wheel.GestureEndEvent;

/**
 * An event type associated with a gesture.
 */
export type GestureType =
  | Mouse.MouseGestureType
  | Touch.TouchGestureType
  | Keyboard.KeyboardGestureType
  | Wheel.WheelGestureType;

/**
 * A snapshot of a previous or in-progress gesture.
 */
export type GestureState =
  | Mouse.MouseGestureState
  | Touch.TouchGestureState
  | Keyboard.KeyboardGestureState
  | Wheel.WheelGestureState;

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
  GestureSourceConfig & Mouse.MouseGestureObservableConfig
> & {
  mouse: true;
};
type TouchEnabledConfig = Partial<
  GestureSourceConfig & Touch.TouchGestureObservableConfig
> & {
  touch: true;
};
type KeyboardEnabledConfig = Partial<
  GestureSourceConfig & Keyboard.KeyboardGestureObservableConfig
> & {
  keyboard: true;
};
type WheelEnabledConfig = Partial<
  GestureSourceConfig & Wheel.WheelGestureObservableConfig
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

function parseConfig(
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
  invariant(
    element instanceof Element,
    `An Element is required, but received ${element}`,
  );
  config = parseConfig(config);

  const sources = [];
  if (config.mouse) {
    sources.push(Mouse.createSource(element, config));
  }
  if (config.touch) {
    sources.push(Touch.createSource(element, config));
  }
  if (config.wheel) {
    sources.push(Wheel.createSource(element, config));
  }
  if (config.keyboard) {
    sources.push(Keyboard.createSource(element, config));
  }

  const gestureState = merge(...sources);

  return asObservable(gestureState);
}

export default {create};
