import {useRef} from 'react';
import {TouchGestureObservable} from '@hzcore/gesture-observable';
import {useProvidedRef, useObservableGestureEffect} from './utils';

export type TouchGestureObservableConfig = TouchGestureObservable.TouchGestureObservableConfig;
export type TouchGestureState = TouchGestureObservable.TouchGestureState;
export type TouchGestureEndState = TouchGestureObservable.TouchGestureEndState;
export type TouchGestureConfig = TouchGestureObservable.TouchGestureObservableConfig;

/**
 * A callback for when touch gesture state changes.
 * Receives either an ongoing gesture state, or the ending gesture state.
 */
export type TouchGestureChangeHandler = (
  state: TouchGestureState | TouchGestureEndState,
) => void;

export interface TouchGestureHandlers {
  /**
   * A callback for when a touch gesture starts.
   * Receives the initializing gesture state.
   */
  onStart?: (state: TouchGestureState) => void;
  /**
   * A callback for when an ongoing touch gesture updates.
   * Receives the latest gesture state.
   */
  onMove?: (state: TouchGestureState) => void;
  /**
   * A callback for when a touch gesture has completed.
   * Receives the ending gesture state.
   */
  onEnd?: (state: TouchGestureEndState) => void;
}

export type TouchGestureHandler =
  | TouchGestureChangeHandler
  | TouchGestureHandlers;

/**
 * `useTouchGesture` is a React hook for components that want to handle
 * touch gesture intent. It can be used with an existing ref or not.
 *
 * @see https://hz-core.netlify.com/use-touch-gesture
 */
function useTouchGesture<T extends HTMLElement>(
  /**
   * An existing ref being passed to the DOM element on which to detect
   * touch gestures. Useful for ref forwarding or sharing.
   */
  providedRef: React.RefObject<T>,
  /**
   * A function to handle touch gesture updates,
   * or a configuration of handlers, like
   * `{onStart?, onMove?, onEnd?}`.
   */
  handler: TouchGestureHandler,
  /**
   * An object describing how to configure touch gesture detection.
   */
  config?: TouchGestureConfig,
): void;
/**
 * `useTouchGesture` is a React hook for components that want to handle
 * touch gesture intent. It can be used with an existing ref or not.
 *
 * @see https://hz-core.netlify.com/use-touch-gesture
 */
function useTouchGesture<T extends HTMLElement>(
  /**
   * A function to handle touch gesture updates,
   * or a configuration of handlers, like
   * `{onStart?, onMove?, onEnd?}`.
   */
  handler: TouchGestureHandler,
  /**
   * An object describing how to configure touch gesture detection.
   */
  config?: TouchGestureConfig,
): React.RefObject<T>;
function useTouchGesture<T extends HTMLElement>(
  handlerOrProvidedRef: React.RefObject<T> | TouchGestureHandler,
  handlerOrConfig?: TouchGestureHandler | TouchGestureConfig,
  maybeConfig?: TouchGestureConfig,
): React.RefObject<T> | void {
  const ref = useRef<T | null>(null);
  const handler = useRef<TouchGestureHandler | null>(null);
  const config = useRef<TouchGestureConfig | null>(null);
  let providedRef: React.RefObject<T> | null = null;

  if ('current' in handlerOrProvidedRef) {
    providedRef = handlerOrProvidedRef;
    handler.current = (handlerOrConfig as TouchGestureHandler) || null;
    config.current = maybeConfig || null;
  } else {
    handler.current = (handlerOrProvidedRef as TouchGestureHandler) || null;
    config.current = (handlerOrConfig as TouchGestureConfig) || null;
  }

  useProvidedRef(ref, providedRef);
  useObservableGestureEffect(TouchGestureObservable, ref, handler, config);
  if (!providedRef) return ref;
}

export default useTouchGesture;
