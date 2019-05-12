import {useEffect, useRef, useCallback} from 'react';
import useRefCallback, {InnerRef} from '@hzcore/hook-ref-callback';
import {WheelGestureObservable} from '@hzcore/gesture-observable';

export type WheelGestureObservableConfig = WheelGestureObservable.WheelGestureObservableConfig;
export type WheelGestureState = WheelGestureObservable.WheelGestureState;
export type WheelGestureEndState = WheelGestureObservable.WheelGestureEndState;

export interface WheelGestureConfig extends WheelGestureObservableConfig {
  /**
   * An optional ref object or callback ref.
   * Useful when the component needs to handle ref forwarding.
   */
  ref?: InnerRef<HTMLElement> | null;
}

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

/**
 * A React hook for components that want to handle wheel gesture intent.
 *
 * @returns A callback ref that should be passed to the DOM element
 *          for which wheel gestures should be observed.
 */
export default function useWheelGesture(
  /**
   * A function to handle wheel gesture updates,
   * or a configuration of handlers, like
   * `{onStart?, onMove?, onEnd?}`.
   */
  handler: WheelGestureChangeHandler | WheelGestureHandlers,
  /**
   * An object describing how to configure wheel gesture detection.
   */
  config?: WheelGestureConfig | null,
): (node: HTMLElement | null) => void {
  const [ref, setRef] = useRefCallback((config && config.ref) || null);
  const lastState = useRef<WheelGestureState | WheelGestureEndState | null>(
    null,
  );
  const element = ref.current;
  const dispatch = useCallback(
    (state: WheelGestureState | WheelGestureEndState | null) => {
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
      const subscription = WheelGestureObservable.create(
        element,
        config,
      ).subscribe(dispatch);
      return subscription.unsubscribe.bind(subscription);
    }
  }, [element, config, dispatch]);
  return setRef;
}
