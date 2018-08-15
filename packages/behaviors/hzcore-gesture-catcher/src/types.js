// @flow
import type {Node as ReactNode} from 'react';

export const WHEEL = 'wheel';
export const MOUSE_DOWN = 'mousedown';
export const MOUSE_MOVE = 'mousemove';
export const MOUSE_UP = 'mouseup';
export const TOUCH_START = 'touchstart';
export const TOUCH_MOVE = 'touchmove';
export const TOUCH_END = 'touchend';
export const KEY_DOWN = 'keydown';
export const KEY_UP = 'keyup';

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
  'preventDefault',
  'keyboard',
  'mouse',
  'touch',
  'wheel',
];

export type ReactRef = {
  current: any,
};

export type GestureCatcherConfig = {
  preventDefault: ?boolean,
  keyboard: ?boolean,
  mouse: ?boolean,
  touch: ?boolean,
  wheel: ?boolean,
};

export type GestureState = {
  x: number,
  y: number,
  xDelta: number,
  yDelta: number,
  xInitial: number,
  yInitial: number,
  xPrev: number,
  yPrev: number,
  xVelocity: number,
  yVelocity: number,
  gesturing: boolean,
};

export type GestureCatcherState = GestureState & {gestureRef: ReactRef};

export type GestureCatcherProps = {
  ...GestureCatcherConfig,
  children: (state: GestureCatcherState) => ReactNode,
  gestureRef: ?ReactRef,
  disabled: ?boolean,
  onStart?: (state: GestureCatcherState) => GestureCatcherState,
  onMove?: (state: GestureCatcherState) => GestureCatcherState,
  onStop?: (state: GestureCatcherState) => GestureCatcherState,
};
