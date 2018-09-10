// @flow
import type {
  Node as ReactNode,
  ElementType as ReactElementType,
  ElementRef as ReactElementRef,
} from 'react';

export const WHEEL = 'wheel';
export const MOUSE_DOWN = 'mousedown';
export const MOUSE_MOVE = 'mousemove';
export const MOUSE_UP = 'mouseup';
export const TOUCH_START = 'touchstart';
export const TOUCH_MOVE = 'touchmove';
export const TOUCH_END = 'touchend';
export const KEY_DOWN = 'keydown';
export const KEY_UP = 'keyup';
export const GESTURE_END = 'gestureend';

export const SPACE = 'Space';
export const PAGE_UP = 'PageUp';
export const PAGE_DOWN = 'PageDown';
export const END = 'End';
export const HOME = 'Home';
export const ARROW_LEFT = 'ArrowLeft';
export const ARROW_UP = 'ArrowUp';
export const ARROW_RIGHT = 'ArrowRight';
export const ARROW_DOWN = 'ArrowDown';

export const CODES = [
  SPACE,
  PAGE_UP,
  PAGE_DOWN,
  END,
  HOME,
  ARROW_LEFT,
  ARROW_UP,
  ARROW_RIGHT,
  ARROW_DOWN,
];

export const KEY_CODES_2_CODES = {
  '32': SPACE,
  '33': PAGE_UP,
  '34': PAGE_DOWN,
  '35': END,
  '36': HOME,
  '37': ARROW_LEFT,
  '38': ARROW_UP,
  '39': ARROW_RIGHT,
  '40': ARROW_DOWN,
};

export const CONFIG_SHAPE = [
  'disabled',
  'passive',
  'preventDefault',
  'keyboard',
  'mouse',
  'touch',
  'wheel',
];

export type GestureType =
  | typeof WHEEL
  | typeof MOUSE_DOWN
  | typeof MOUSE_MOVE
  | typeof MOUSE_UP
  | typeof TOUCH_START
  | typeof TOUCH_MOVE
  | typeof TOUCH_END
  | typeof KEY_DOWN
  | typeof KEY_UP
  | typeof GESTURE_END;

// FIXME: Type these things.
export type Callbag = any;
export type Observer = {
  next: ?(value: any) => void,
  error: ?(error: Error) => void,
  complete: ?() => void,
};
export type Subscription = {
  unsubscribe(): void,
};
export type GestureEvent = any;

export type ReactRef<T = ReactElementType> = ReactElementRef<T>;
export type ReactRefObject<T = ReactElementType> = {current: ?ReactRef<T>};
export type ReactRefCallback<T = ReactElementType> = (
  node: ?ReactRef<T>,
) => void;
export type ReactRefProp<T = ReactElementType> =
  | ReactRefObject<T>
  | ReactRefCallback<T>;

export interface SensorInterface {
  source: Callbag;
  onData(data: any): any;
  shouldPreventDefault(data: any): boolean;
  updateConfig(config: SensorConfig): boolean; // `false` to means config cannot be applied.
}

export type SensorConfig = {
  passive?: boolean,
  preventDefault?: boolean,
  threshold?: number | false,
};

export type MouseSensorConfig = SensorConfig | boolean;

export type TouchSensorConfig = SensorConfig | boolean;

export type WheelSensorConfig = SensorConfig | boolean;

export type KeyboardSensorConfig = SensorConfig | boolean;

export type GestureCatcherConfig = {
  passive?: boolean,
  preventDefault?: boolean,
  keyboard?: KeyboardSensorConfig,
  mouse?: MouseSensorConfig,
  touch?: TouchSensorConfig,
  wheel?: WheelSensorConfig,
};

export type GestureState = {
  x: number,
  y: number,
  xDelta: number,
  yDelta: number,
  xSpin: number,
  ySpin: number,
  xInitial: number,
  yInitial: number,
  xPrev: number,
  yPrev: number,
  xVelocity: number,
  yVelocity: number,
  gesturing: boolean,
  key: ?string,
  repeat: ?boolean,
  type: ?GestureType,
};

export type GestureCatcherState = GestureState;

export type GestureCatcherProps = {
  ...GestureCatcherConfig,
  children: (
    state: GestureState & {gestureRef: ReactRefCallback<>},
  ) => ReactNode,
  innerRef: ?ReactRefProp<>,
  disabled: ?boolean,
  onStart?: (state: GestureState) => void,
  onMove?: (state: GestureState) => void,
  onEnd?: (state: GestureState) => void,
};
