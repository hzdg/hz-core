import {useEffect, useRef, useCallback} from 'react';
import useRefCallback, {InnerRef} from '@hzcore/hook-ref-callback';
import {KeyboardGestureObservable} from '@hzcore/gesture-observable';

export type KeyboardGestureObservableConfig = KeyboardGestureObservable.KeyboardGestureObservableConfig;
export type KeyboardGestureState = KeyboardGestureObservable.KeyboardGestureState;
export type KeyboardGestureEndState = KeyboardGestureObservable.KeyboardGestureEndState;

export interface KeyboardGestureConfig extends KeyboardGestureObservableConfig {
  /**
   * An optional ref object or callback ref.
   * Useful when the component needs to handle ref forwarding.
   */
  ref?: InnerRef<HTMLElement> | null;
}

/**
 * A callback for when keyboard gesture state changes.
 * Receives either an ongoing gesture state, or the ending gesture state.
 */
export type KeyboardGestureChangeHandler = (
  state: KeyboardGestureState | KeyboardGestureEndState,
) => void;

export interface KeyboardGestureHandlers {
  /**
   * A callback for when a keyboard gesture starts.
   * Receives the initializing gesture state.
   */
  onStart?: (state: KeyboardGestureState) => void;
  /**
   * A callback for when an ongoing keyboard gesture updates.
   * Receives the latest gesture state.
   */
  onMove?: (state: KeyboardGestureState) => void;
  /**
   * A callback for when a keyboard gesture has completed.
   * Receives the ending gesture state.
   */
  onEnd?: (state: KeyboardGestureEndState) => void;
}

/**
 * A React hook for components that want to handle keyboard gesture intent.
 *
 * @returns A callback ref that should be passed to the DOM element
 *          for which keyboard gestures should be observed.
 */
export default function useKeyboardGesture(
  /**
   * A function to handle keyboard gesture updates,
   * or a configuration of handlers, like
   * `{onStart?, onMove?, onEnd?}`.
   */
  handler: KeyboardGestureChangeHandler | KeyboardGestureHandlers,
  /**
   * An object describing how to configure keyboard gesture detection.
   */
  config?: KeyboardGestureConfig | null,
): (node: HTMLElement | null) => void {
  const [ref, setRef] = useRefCallback((config && config.ref) || null);
  const lastState = useRef<
    KeyboardGestureState | KeyboardGestureEndState | null
  >(null);
  const element = ref.current;
  const dispatch = useCallback(
    (state: KeyboardGestureState | KeyboardGestureEndState | null) => {
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
      const subscription = KeyboardGestureObservable.create(
        element,
        config,
      ).subscribe(dispatch);
      return subscription.unsubscribe.bind(subscription);
    }
  }, [element, config, dispatch]);
  return setRef;
}
