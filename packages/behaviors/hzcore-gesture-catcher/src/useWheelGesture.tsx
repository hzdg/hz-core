import {useRef} from 'react';
import {WheelGestureObservable} from '@hzcore/gesture-observable';
import {useProvidedRef, useObservableGestureEffect} from './utils';

export type WheelGestureObservableConfig = WheelGestureObservable.WheelGestureObservableConfig;
export type WheelGestureState = WheelGestureObservable.WheelGestureState;
export type WheelGestureEndState = WheelGestureObservable.WheelGestureEndState;
export type WheelGestureConfig = WheelGestureObservable.WheelGestureObservableConfig;

/**
 * A callback for when wheel gesture state changes.
 * Receives either an ongoing gesture state, or the ending gesture state.
 */
export type WheelGestureChangeHandler = (
  state: WheelGestureState | WheelGestureEndState,
) => void;

export interface WheelGestureHandlers {
  /**
   * A callback for when a wheel gesture starts.
   * Receives the initializing gesture state.
   */
  onStart?: (state: WheelGestureState) => void;
  /**
   * A callback for when an ongoing wheel gesture updates.
   * Receives the latest gesture state.
   */
  onMove?: (state: WheelGestureState) => void;
  /**
   * A callback for when a wheel gesture has completed.
   * Receives the ending gesture state.
   */
  onEnd?: (state: WheelGestureEndState) => void;
}

export type WheelGestureHandler =
  | WheelGestureChangeHandler
  | WheelGestureHandlers;

/**
 * `useWheelGesture` is a React hook for components that want to handle
 * wheel gesture intent. It can be used with an existing ref or not.
 *
 * @see https://hz-core.netlify.com/use-wheel-gesture
 */
function useWheelGesture<T extends HTMLElement>(
  /**
   * An existing ref being passed to the DOM element on which to detect
   * wheel gestures. Useful for ref forwarding or sharing.
   */
  providedRef: React.RefObject<T>,
  /**
   * A function to handle wheel gesture updates,
   * or a configuration of handlers, like
   * `{onStart?, onMove?, onEnd?}`.
   */
  handler: WheelGestureHandler,
  /**
   * An object describing how to configure wheel gesture detection.
   */
  config?: WheelGestureConfig,
): void;
/**
 * `useWheelGesture` is a React hook for components that want to handle
 * wheel gesture intent. It can be used with an existing ref or not.
 *
 * @see https://hz-core.netlify.com/use-wheel-gesture
 */
function useWheelGesture<T extends HTMLElement>(
  /**
   * A function to handle wheel gesture updates,
   * or a configuration of handlers, like
   * `{onStart?, onMove?, onEnd?}`.
   */
  handler: WheelGestureHandler,
  /**
   * An object describing how to configure wheel gesture detection.
   */
  config?: WheelGestureConfig,
): React.RefObject<T>;
function useWheelGesture<T extends HTMLElement>(
  handlerOrProvidedRef: React.RefObject<T> | WheelGestureHandler,
  handlerOrConfig?: WheelGestureHandler | WheelGestureConfig,
  maybeConfig?: WheelGestureConfig,
): React.RefObject<T> | void {
  const ref = useRef<T | null>(null);
  const handler = useRef<WheelGestureHandler | null>(null);
  const config = useRef<WheelGestureConfig | null>(null);
  let providedRef: React.RefObject<T> | null = null;

  if ('current' in handlerOrProvidedRef) {
    providedRef = handlerOrProvidedRef;
    handler.current = (handlerOrConfig as WheelGestureHandler) || null;
    config.current = maybeConfig || null;
  } else {
    handler.current = (handlerOrProvidedRef as WheelGestureHandler) || null;
    config.current = (handlerOrConfig as WheelGestureConfig) || null;
  }

  useProvidedRef(ref, providedRef);
  useObservableGestureEffect(WheelGestureObservable, ref, handler, config);
  if (!providedRef) return ref;
}

export default useWheelGesture;
