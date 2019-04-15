import React from 'react';
import {Callbag} from 'callbag';
import invariant from 'invariant';

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

type Mutable<T> = {-readonly [P in keyof T]: T[P]};
type MembersOf<A> = Mutable<A> extends (infer T)[] ? T : never;

export const KEY_CODES_2_CODES: Record<string, MembersOf<typeof CODES>> = {
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
] as const;

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

export type Observer = {
  next(value: any): void;
  error(error: Error): void;
  complete(): void;
};
export type Subscription = {
  unsubscribe(): void;
};
export type GestureEvent = any;

export type ReactRef<T = React.ElementType> = React.Ref<T>;
export type ReactRefObject<T = React.ElementType> = {
  current: React.Ref<T> | null;
};
export type ReactRefCallback<T = React.ElementType> = (
  node: React.Ref<T> | null,
) => void;
export type ReactRefProp<T = React.ElementType> =
  | ReactRefObject<T>
  | ReactRefCallback<T>;

export interface SensorInterface {
  source: Callbag<any, any>;
  onData(data: any): any;
  shouldPreventDefault(data: any): boolean;
  updateConfig(config: SensorConfig): boolean; // `false` to means config cannot be applied.
}

export function implementsSensorInterface(
  sensor: any,
): sensor is SensorInterface {
  invariant(sensor, `Expected ${sensor} to be an object`);
  invariant(
    typeof sensor.source === 'function',
    `Expected ${sensor.constructor.name} to have a source callbag.`,
  );
  invariant(
    typeof sensor.onData === 'function',
    `Expected ${sensor.constructor.name} to have a onData method.`,
  );
  invariant(
    typeof sensor.shouldPreventDefault === 'function',
    `Expected ${
      sensor.constructor.name
    } to have a shouldPreventDefault method.`,
  );
  invariant(
    typeof sensor.updateConfig === 'function',
    `Expected ${sensor.constructor.name} to have a updateConfig method.`,
  );
  return true;
}

export type SensorConfig = {
  passive?: boolean;
  preventDefault?: boolean;
  threshold?: number | false;
};

export type MouseSensorConfig = SensorConfig | boolean;

export type TouchSensorConfig = SensorConfig | boolean;

export type WheelSensorConfig = SensorConfig | boolean;

export type KeyboardSensorConfig = SensorConfig | boolean;

export type GestureCatcherConfig = {
  passive?: boolean;
  preventDefault?: boolean;
  keyboard?: KeyboardSensorConfig;
  mouse?: MouseSensorConfig;
  touch?: TouchSensorConfig;
  wheel?: WheelSensorConfig;
};

export type GestureState = {
  x: number;
  y: number;
  xDelta: number;
  yDelta: number;
  xSpin: number;
  ySpin: number;
  xInitial: number;
  yInitial: number;
  xPrev: number;
  yPrev: number;
  xVelocity: number;
  yVelocity: number;
  gesturing: boolean;
  key: string | null;
  repeat: boolean | null;
  type: GestureType | null;
};

export type GestureCatcherState = GestureState;

export type GestureCatcherRenderProps = GestureState & {
  gestureRef: ReactRefCallback;
};

export interface GestureCatcherProps extends GestureCatcherConfig {
  children: (props: GestureCatcherRenderProps) => React.ReactNode;
  innerRef: ReactRefProp | null;
  disabled: boolean | null;
  onStart?: (state: GestureState) => void;
  onMove?: (state: GestureState) => void;
  onEnd?: (state: GestureState) => void;
}
