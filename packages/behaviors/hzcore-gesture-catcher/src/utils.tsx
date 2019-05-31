import {useRef, useLayoutEffect, useEffect, useState} from 'react';
import Observable from 'zen-observable';

interface GestureState {
  gesturing: boolean;
}

interface GestureChangeHandler<S extends GestureState> {
  (state: S): void;
}

interface GestureHandlers<S extends GestureState> {
  onStart?: (state: S) => void;
  onMove?: (state: S) => void;
  onEnd?: (state: S) => void;
}

interface ObservableFactory<T extends GestureState | null> {
  create(...args: unknown[]): Observable<T>;
}

function dispatchGestureStateChange<S extends GestureState>(
  handler: GestureChangeHandler<S> | GestureHandlers<S>,
  state: S,
  lastState: S | null,
): void {
  if (state) {
    if (typeof handler === 'function') {
      handler(state);
    } else {
      if (state.gesturing) {
        if (!lastState || !lastState.gesturing) {
          if (handler && typeof handler.onStart === 'function') {
            handler.onStart(state);
          }
        } else if (lastState && lastState.gesturing) {
          if (handler && typeof handler.onMove === 'function') {
            handler.onMove(state);
          }
        }
      } else if (!lastState || lastState.gesturing) {
        if (handler && typeof handler.onEnd === 'function') {
          handler.onEnd(state);
        }
      }
    }
  }
}

/**
 * `useObservableGestureEffect` will manage a subscription to the given
 * gesture `Observable` on the `ref` DOM element with the given `config`,
 * calling the current `handler` wheneer a gesture state change is observed.
 */
export function useObservableGestureEffect<
  E extends HTMLElement,
  S extends GestureState,
  H,
  C
>(
  /**
   * The gesture observable to use. Expected to have a `create`
   * static method that returns an `Observable` instance.
   */
  Observable: ObservableFactory<S>,
  /**
   * A ref to the DOM element to observe.
   */
  ref: React.RefObject<E>,
  /**
   * A ref to the current handler or handlers of gesture state changes.
   */
  handler: React.RefObject<H>,
  /**
   * A ref to the current configuration for the gesture observable.
   */
  config: React.RefObject<C>,
): void {
  const lastState = useRef<S | null>(null);

  // Note: we use state instead of a ref to track this value
  // because `useState` supports lazy instantiation (via a callback),
  // whereas`useRef` would have us creating and throwing away a `new Map()`
  // on every subsequent render.
  const [subscriptions] = useState(
    () => new Map<HTMLElement, ZenObservable.Subscription>(),
  );

  useLayoutEffect(
    /**
     * `subscribeIfNecessary` will run on layout to determine if we need to
     * subscribe to events on an element. If we are already subscribed
     * to the element, it will do nothing.
     */
    function subscribeIfNecessary() {
      const element = ref.current;
      if (element && !subscriptions.has(element)) {
        subscriptions.set(
          element,
          Observable.create(element, config.current).subscribe(
            function handleGestureState(state) {
              if (handler.current) {
                dispatchGestureStateChange<S>(
                  handler.current,
                  state,
                  lastState.current,
                );
              }
              lastState.current = state;
            },
          ),
        );
      }
    },
  );

  useEffect(
    /**
     * `cleanup` returns a function that will run on unmount
     * to unsubscribe from any subscriptions.
     */
    function cleanup() {
      return () => {
        if (subscriptions.size > 0) {
          for (const [el, sub] of subscriptions.entries()) {
            sub.unsubscribe();
            subscriptions.delete(el);
          }
        }
      };
    },
    [subscriptions],
  );
}

/**
 * `useProvidedRef` will set `ref.current` to `providedRef.current`
 * on layout, if `providedRef` is a ref object.
 */
export function useProvidedRef<T extends HTMLElement>(
  /**
   * The ref to sync with a provided ref. If `providedRef` is a ref object,
   * `useProvidedRef` will set `ref.current` to `providedRef.current` on layout.
   */
  ref: React.MutableRefObject<T | null>,
  /**
   * The provided ref. If not a ref object, `useProvidedRef` will do nothing.
   */
  providedRef?: React.RefObject<T> | null,
): void {
  useLayoutEffect(
    /**
     * `syncWithProvidedRef` will keep the internal ref in sync
     * with the provided ref, if it exists.
     */
    function syncWithProvidedRef() {
      if (providedRef) {
        ref.current = providedRef.current;
      }
    },
  );
}
