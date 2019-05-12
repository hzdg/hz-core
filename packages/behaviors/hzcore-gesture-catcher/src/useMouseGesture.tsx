import {useEffect, useRef, useCallback} from 'react';
import useRefCallback, {InnerRef} from '@hzcore/hook-ref-callback';
import {MouseGestureObservable} from '@hzcore/gesture-observable';

export type MouseGestureObservableConfig = MouseGestureObservable.MouseGestureObservableConfig;
export type MouseGestureState = MouseGestureObservable.MouseGestureState;
export type MouseGestureEndState = MouseGestureObservable.MouseGestureEndState;

export interface MouseGestureConfig extends MouseGestureObservableConfig {
  /**
   * An optional ref object or callback ref.
   * Useful when the component needs to handle ref forwarding.
   */
  ref?: InnerRef<HTMLElement> | null;
}

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

/**
 * A React hook for components that want to handle mouse gesture intent.
 *
 * @returns A callback ref that should be passed to the DOM element
 *          for which mouse gestures should be observed.
 */
export default function useMouseGesture(
  /**
   * A function to handle mouse gesture updates,
   * or a configuration of handlers, like
   * `{onStart?, onMove?, onEnd?}`.
   */
  handler: MouseGestureChangeHandler | MouseGestureHandlers,
  /**
   * An object describing how to configure mouse gesture detection.
   */
  config?: MouseGestureConfig | null,
): (node: HTMLElement | null) => void {
  const [ref, setRef] = useRefCallback((config && config.ref) || null);
  const lastState = useRef<MouseGestureState | MouseGestureEndState | null>(
    null,
  );
  const element = ref.current;
  const dispatch = useCallback(
    (state: MouseGestureState | MouseGestureEndState | null) => {
      if (state) {
        if (typeof handler === 'function') {
          handler(state);
        } else {
          if (state.gesturing) {
            if (!lastState.current || !lastState.current.gesturing) {
              if (handler && typeof handler.onStart === 'function') {
                handler.onStart(state);
              }
            } else if (lastState.current && lastState.current.gesturing) {
              if (handler && typeof handler.onMove === 'function') {
                handler.onMove(state);
              }
            }
          } else if (!lastState.current || lastState.current.gesturing) {
            if (handler && typeof handler.onEnd === 'function') {
              handler.onEnd(state);
            }
          }
        }
      }
      lastState.current = state;
    },
    [handler],
  );
  useEffect(() => {
    if (element) {
      const subscription = MouseGestureObservable.create(
        element,
        config,
      ).subscribe(dispatch);
      return subscription.unsubscribe.bind(subscription);
    }
  }, [element, config, dispatch]);
  return setRef;
}
