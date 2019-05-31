import useMouseGesture, {
  MouseGestureConfig,
  MouseGestureState,
  MouseGestureEndState,
} from './useMouseGesture';
import useWheelGesture, {
  WheelGestureConfig,
  WheelGestureState,
  WheelGestureEndState,
} from './useWheelGesture';
import useTouchGesture, {
  TouchGestureConfig,
  TouchGestureState,
  TouchGestureEndState,
} from './useTouchGesture';
import useKeyboardGesture, {
  KeyboardGestureConfig,
  KeyboardGestureState,
  KeyboardGestureEndState,
} from './useKeyboardGesture';
import {useRef} from 'react';
import {useProvidedRef} from './utils';

export type GestureState =
  | MouseGestureState
  | TouchGestureState
  | WheelGestureState
  | KeyboardGestureState;

export type GestureEndState =
  | MouseGestureEndState
  | TouchGestureEndState
  | WheelGestureEndState
  | KeyboardGestureEndState;

/**
 * A callback for when gesturing state changes.
 * Receives either an ongoing gesture state, or the ending gesture state.
 */
export type GestureChangeHandler = (
  state: GestureState | GestureEndState,
) => void;

export interface GestureHandlers {
  /**
   * A callback for when gesturing starts.
   * Receives the initializing gesture state.
   */
  onStart?: (state: GestureState) => void;
  /**
   * A callback for when an ongoing gesture updates.
   * Receives the latest gesture state.
   */
  onMove?: (state: GestureState) => void;
  /**
   * A callback for when a gesture has completed.
   * Receives the ending gesture state.
   */
  onEnd?: (state: GestureEndState) => void;
}

export type GestureHandler = GestureChangeHandler | GestureHandlers;

export type GestureConfig = MouseGestureConfig &
  WheelGestureConfig &
  TouchGestureConfig &
  KeyboardGestureConfig;

/**
 * A React hook for components that want to handle _any_ gesture intent.
 *
 * This hook is a 'merge' of the separate input-specific gesture hooks,
 * `useMouseGesture`, `useWheelGesture`, `useTouchGesture`, `useKeyboardGesture`.
 *
 * @see https://hz-core.netlify.com/use-gesture
 */
function useGesture<T extends HTMLElement>(
  /**
   * An existing ref being passed to the DOM element on which to detect
   * gestures. Useful for ref forwarding or sharing.
   */
  providedRef: React.RefObject<T>,
  /**
   * A function to handle gesture updates,
   * or a configuration of handlers, like
   * `{onStart?, onMove?, onEnd?}`.
   */
  handler: GestureHandler,
  /**
   * An object describing how to configure gesture detection.
   */
  config?: GestureConfig,
): void;
function useGesture<T extends HTMLElement>(
  /**
   * A function to handle gesture updates,
   * or a configuration of handlers, like
   * `{onStart?, onMove?, onEnd?}`.
   */
  handler: GestureHandler,
  /**
   * An object describing how to configure gesture detection.
   */
  config?: GestureConfig,
): React.RefObject<T>;
function useGesture<T extends HTMLElement>(
  handlerOrProvidedRef: React.RefObject<T> | GestureHandler,
  handlerOrConfig?: GestureHandler | GestureConfig,
  maybeConfig?: GestureConfig,
): React.RefObject<T> | void {
  const ref = useRef<T | null>(null);
  let providedRef: React.RefObject<T> | null = null;
  let gestureHandler: GestureHandler;
  let gestureConfig: GestureConfig | undefined = undefined;

  if ('current' in handlerOrProvidedRef) {
    providedRef = handlerOrProvidedRef;
    gestureHandler = handlerOrConfig as GestureHandler;
    if (maybeConfig) gestureConfig = maybeConfig;
  } else {
    gestureHandler = (handlerOrProvidedRef as GestureHandler) || null;
    if (handlerOrConfig) gestureConfig = handlerOrConfig as MouseGestureConfig;
  }

  useProvidedRef(ref, providedRef);
  useMouseGesture(ref, gestureHandler, gestureConfig);
  useWheelGesture(ref, gestureHandler, gestureConfig);
  useTouchGesture(ref, gestureHandler, gestureConfig);
  useKeyboardGesture(ref, gestureHandler, gestureConfig);
  if (!providedRef) return ref;
}

export default useGesture;
