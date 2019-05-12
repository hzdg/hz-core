import {useEffect, useRef, useCallback} from 'react';
import useRefCallback, {InnerRef} from '@hzcore/hook-ref-callback';
import {TouchGestureObservable} from '@hzcore/gesture-observable';

export type TouchGestureObservableConfig = TouchGestureObservable.TouchGestureObservableConfig;
export type TouchGestureState = TouchGestureObservable.TouchGestureState;
export type TouchGestureEndState = TouchGestureObservable.TouchGestureEndState;

export interface TouchGestureConfig extends TouchGestureObservableConfig {
  /**
   * An optional ref object or callback ref.
   * Useful when the component needs to handle ref forwarding.
   */
  ref?: InnerRef<HTMLElement> | null;
}

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

/**
 * A React hook for components that want to handle touch gesture intent.
 *
 * @returns A callback ref that should be passed to the DOM element
 *          for which touch gestures should be observed.
 */
export default function useTouchGesture(
  /**
   * A function to handle touch gesture updates,
   * or a configuration of handlers, like
   * `{onStart?, onMove?, onEnd?}`.
   */
  handler: TouchGestureChangeHandler | TouchGestureHandlers,
  /**
   * An object describing how to configure touch gesture detection.
   */
  config?: TouchGestureConfig | null,
): (node: HTMLElement | null) => void {
  const [ref, setRef] = useRefCallback((config && config.ref) || null);
  const lastState = useRef<TouchGestureState | TouchGestureEndState | null>(
    null,
  );
  const element = ref.current;
  const dispatch = useCallback(
    (state: TouchGestureState | TouchGestureEndState | null) => {
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
      const subscription = TouchGestureObservable.create(
        element,
        config,
      ).subscribe(dispatch);
      return subscription.unsubscribe.bind(subscription);
    }
  }, [element, config, dispatch]);
  return setRef;
}
