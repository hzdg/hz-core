import {useRef} from 'react';
import {MouseGestureObservable} from '@hzcore/gesture-observable';
import useRefCallback from '@hzcore/hook-ref-callback';
import {useObservableGestureEffect} from './utils';

export type MouseGestureObservableConfig = MouseGestureObservable.MouseGestureObservableConfig;
export type MouseGestureState = MouseGestureObservable.MouseGestureState;
export type MouseGestureEndState = MouseGestureObservable.MouseGestureEndState;
export type MouseGestureConfig = MouseGestureObservable.MouseGestureObservableConfig;

/**
 * A callback for when mouse gesture state changes.
 * Receives either an ongoing gesture state, or the ending gesture state.
 */
export type MouseGestureChangeHandler = (
  state: MouseGestureState | MouseGestureEndState,
) => void;

export interface MouseGestureHandlers {
  /**
   * A callback for when a mouse gesture starts.
   * Receives the initializing gesture state.
   */
  onStart?: (state: MouseGestureState) => void;
  /**
   * A callback for when an ongoing mouse gesture updates.
   * Receives the latest gesture state.
   */
  onMove?: (state: MouseGestureState) => void;
  /**
   * A callback for when a mouse gesture has completed.
   * Receives the ending gesture state.
   */
  onEnd?: (state: MouseGestureEndState) => void;
}

export type MouseGestureHandler =
  | MouseGestureChangeHandler
  | MouseGestureHandlers;

/**
 * `useMouseGesture` is a React hook for components that want to handle
 * mouse gesture intent. It can be used with an existing ref or not.
 *
 * @see https://hz-core.netlify.com/use-mouse-gesture
 */
function useMouseGesture<T extends HTMLElement>(
  /**
   * An existing ref being passed to the DOM element on which to detect
   * mouse gestures. Useful for ref forwarding or sharing.
   */
  providedRef: React.RefObject<T>,
  /**
   * A function to handle mouse gesture updates,
   * or a configuration of handlers, like
   * `{onStart?, onMove?, onEnd?}`.
   */
  handler: MouseGestureHandler,
  /**
   * An object describing how to configure mouse gesture detection.
   */
  config?: MouseGestureConfig,
): void;
/**
 * `useMouseGesture` is a React hook for components that want to handle
 * mouse gesture intent. It can be used with an existing ref or not.
 *
 * @see https://hz-core.netlify.com/use-mouse-gesture
 */
function useMouseGesture<T extends HTMLElement>(
  /**
   * A function to handle mouse gesture updates,
   * or a configuration of handlers, like
   * `{onStart?, onMove?, onEnd?}`.
   */
  handler: MouseGestureHandler,
  /**
   * An object describing how to configure mouse gesture detection.
   */
  config?: MouseGestureConfig,
): (node: T | null) => void;
function useMouseGesture<T extends HTMLElement>(
  handlerOrProvidedRef: React.RefObject<T> | MouseGestureHandler,
  handlerOrConfig?: MouseGestureHandler | MouseGestureConfig,
  maybeConfig?: MouseGestureConfig,
): ((node: T | null) => void) | void {
  const handler = useRef<MouseGestureHandler | null>(null);
  const config = useRef<MouseGestureConfig | null>(null);
  let providedRef: React.RefObject<T> | null = null;

  if ('current' in handlerOrProvidedRef) {
    providedRef = handlerOrProvidedRef;
    handler.current = (handlerOrConfig as MouseGestureHandler) || null;
    config.current = maybeConfig || null;
  } else {
    handler.current = (handlerOrProvidedRef as MouseGestureHandler) || null;
    config.current = (handlerOrConfig as MouseGestureConfig) || null;
  }

  const [ref, setRef] = useRefCallback<T>();
  if (providedRef) setRef(providedRef.current);
  useObservableGestureEffect(MouseGestureObservable, ref, handler, config);
  if (!providedRef) return setRef;
}

export default useMouseGesture;
