import * as GestureCatcher from './GestureCatcher';
import * as GestureObservable from '@hzcore/gesture-observable';
import * as keyboard from './useKeyboardGesture';
import * as mouse from './useMouseGesture';
import * as touch from './useTouchGesture';
import * as wheel from './useWheelGesture';
import * as gesture from './useGesture';

export type GestureCatcherRenderProps<
  T extends HTMLElement
> = GestureCatcher.GestureCatcherRenderProps<T>;
export type GestureCatcherProps<
  T extends HTMLElement
> = GestureCatcher.GestureCatcherProps<T>;

export type KeyboardGestureConfig = keyboard.KeyboardGestureConfig;
export type KeyboardGestureState = keyboard.KeyboardGestureState;
export type KeyboardGestureEndState = keyboard.KeyboardGestureEndState;
export type KeyboardGestureHandler = keyboard.KeyboardGestureHandler;

export type MouseGestureConfig = mouse.MouseGestureConfig;
export type MouseGestureState = mouse.MouseGestureState;
export type MouseGestureEndState = mouse.MouseGestureEndState;
export type MouseGestureHandler = mouse.MouseGestureHandler;

export type TouchGestureConfig = touch.TouchGestureConfig;
export type TouchGestureState = touch.TouchGestureState;
export type TouchGestureEndState = touch.TouchGestureEndState;
export type TouchGestureHandler = touch.TouchGestureHandler;

export type WheelGestureConfig = wheel.WheelGestureConfig;
export type WheelGestureState = wheel.WheelGestureState;
export type WheelGestureEndState = wheel.WheelGestureEndState;
export type WheelGestureHandler = wheel.WheelGestureHandler;
export type WheelGestureEventDebug = GestureObservable.WheelGestureEventDebug;

export type GestureConfig = gesture.GestureConfig;
export type GestureState = gesture.GestureState;
export type GestureEndState = gesture.GestureEndState;
export type GestureHandler = gesture.GestureHandler;

export const useKeyboardGesture = keyboard.default;
export const useMouseGesture = mouse.default;
export const useTouchGesture = touch.default;
export const useWheelGesture = wheel.default;
export const useGesture = gesture.default;

export const Orientation = GestureObservable.Orientation;

export const useConfigFor = GestureCatcher.useConfigFor;
export default GestureCatcher.default;
