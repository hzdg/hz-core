import {useState, useLayoutEffect, useEffect, useRef, useCallback} from 'react';
import 'intersection-observer'; // polyfill

export interface IntersectionHandler {
  /**
   * `IntersectionHandler` will receive an `IntersectionObserverEntry` object
   * each time the observed element's intersection with the ancestor element
   * or viewport changes.
   *
   * @see https://hz-core.netlify.com/use-intersection#state
   */
  (entry: IntersectionObserverEntry): void;
}

/**
 * `useIntersection` is a React hook for components that care about
 * their interesction with an ancestor element or with the viewport.
 * It can be used statefully or not, and with an existing ref or not.
 *
 * @see https://hz-core.netlify.com/use-intersection
 */
function useIntersection<T extends HTMLElement>(
  /**
   * An existing ref being passed to the DOM element to measure.
   * Useful for ref forwarding or sharing.
   *
   * @see https://hz-core.netlify.com/use-intersection#shared-ref--ref-forwarding
   */
  providedRef: React.RefObject<T>,
  /**
   * `handler` will receive an `IntersectionObserverEntry` object each time
   * the observed element's intersection with the ancestor element
   * or viewport changes.
   *
   * @see https://hz-core.netlify.com/use-intersection#state
   */
  handler: IntersectionHandler,
  /**
   * Optional configuration for the intersection observer.
   *
   * @see https://hz-core.netlify.com/use-intersection#config
   */
  config?: IntersectionObserverInit,
): void;
/**
 * `useIntersection` is a React hook for components that care about
 * their interesction with an ancestor element or with the viewport.
 * It can be used statefully or not, and with an existing ref or not.
 *
 * @see https://hz-core.netlify.com/use-intersection
 */
function useIntersection<T extends HTMLElement>(
  /**
   * An existing ref being passed to the DOM element to measure.
   * Useful for ref forwarding or sharing.
   *
   * @see https://hz-core.netlify.com/use-intersection#shared-ref--ref-forwarding
   */
  providedRef: React.RefObject<T>,
  /**
   * Optional configuration for the intersection observer.
   *
   * @see https://hz-core.netlify.com/use-intersection#config
   */
  config?: IntersectionObserverInit,
): boolean;
/**
 * `useIntersection` is a React hook for components that care about
 * their interesction with an ancestor element or with the viewport.
 * It can be used statefully or not, and with an existing ref or not.
 *
 * @see https://hz-core.netlify.com/use-intersection
 */
function useIntersection<T extends HTMLElement>(
  /**
   * `handler` will receive an `IntersectionObserverEntry` object each time
   * the observed element's intersection with the ancestor element
   * or viewport changes.
   *
   * @see https://hz-core.netlify.com/use-intersection#state
   */
  handler: IntersectionHandler,
  /**
   * Optional configuration for the intersection observer.
   *
   * @see https://hz-core.netlify.com/use-intersection#config
   */
  config?: IntersectionObserverInit,
): React.RefObject<T>;
/**
 * `useIntersection` is a React hook for components that care about
 * their interesction with an ancestor element or with the viewport.
 * It can be used statefully or not, and with an existing ref or not.
 *
 * @see https://hz-core.netlify.com/use-intersection
 */
function useIntersection<T extends HTMLElement>(
  /**
   * Optional configuration for the intersection observer.
   *
   * @see https://hz-core.netlify.com/use-intersection#config
   */
  config?: IntersectionObserverInit,
): [boolean, React.RefObject<T>];
function useIntersection<T extends HTMLElement>(
  providedRefOrHandlerOrConfig?:
    | React.RefObject<T>
    | IntersectionHandler
    | IntersectionObserverInit,
  handlerOrConfig?: IntersectionHandler | IntersectionObserverInit,
  maybeConfig?: IntersectionObserverInit,
): [boolean, React.RefObject<T>] | React.RefObject<T> | boolean | void {
  const changeHandler = useRef<IntersectionHandler | null>(null);
  const ref = useRef<T | null>(null);
  let providedRef: React.RefObject<T> | null = null;
  let config: IntersectionObserverInit | undefined = undefined;

  if (providedRefOrHandlerOrConfig) {
    if (typeof providedRefOrHandlerOrConfig === 'function') {
      changeHandler.current = providedRefOrHandlerOrConfig;
      if (handlerOrConfig) {
        if ('current' in handlerOrConfig) {
          providedRef = handlerOrConfig;
          config = maybeConfig;
        } else if (typeof handlerOrConfig === 'object') {
          config = handlerOrConfig;
        }
      }
    } else if ('current' in providedRefOrHandlerOrConfig) {
      providedRef = providedRefOrHandlerOrConfig;
      if (typeof handlerOrConfig === 'function') {
        changeHandler.current = handlerOrConfig;
        config = maybeConfig;
      } else if (typeof handlerOrConfig === 'object') {
        config = handlerOrConfig;
      }
    } else if (typeof providedRefOrHandlerOrConfig === 'object') {
      config = providedRefOrHandlerOrConfig;
    }
  }

  useLayoutEffect(
    /**
     * `syncWithProvidedRefIfNecessary` will update
     * the current ref with the provided ref value, if it exists.
     */
    function syncWithProvidedRefIfNecessary() {
      if (providedRef) {
        ref.current = providedRef.current;
      }
    },
  );

  // Note: we use state instead of a ref to track this value
  // because `useState` supports lazy instantiation (via a callback),
  // whereas`useRef` would have us creating and throwing away a `new Map()`
  // on every subsequent render.
  const [subscriptions] = useState(
    () => new Map<HTMLElement, ZenObservable.Subscription>(),
  );

  const [intersects, setIntersects] = useState(false);

  const handleIntersectionChange = useCallback(
    /**
     * `handleIntersectionChange` will update the current change handler
     * with a new `IntersectionObserverEntry` whenever the observed element's
     * intersection with the ancestor element or viewport changes.
     */
    function handleIntersectionChange(entry: IntersectionObserverEntry) {
      const cb = changeHandler.current;
      if (typeof cb === 'function') {
        cb(entry);
      } else {
        setIntersects(entry.isIntersecting);
      }
    },
    [],
  );

  const {root = undefined, rootMargin = undefined, threshold = undefined} =
    config || {};

  const element = ref.current;

  useLayoutEffect(
    /**
     * `subscribeIfNecessary` will run on layout to determine if we need to
     * subscribe to intersection events on an element. If we are already
     * subscribed to the element, it will do nothing.
     */
    function subscribeIfNecessary() {
      if (element && !subscriptions.has(element)) {
        const observer = new IntersectionObserver(entries => {
          for (const entry of entries) {
            if (entry.target === element) {
              return handleIntersectionChange(entry);
            }
          }
        }, config);
        observer.observe(element);
        subscriptions.set(element, {
          closed: false,
          unsubscribe() {
            this.closed = true;
            observer.unobserve(element);
          },
        });
      }
      /**
       * `resetSubscriptionsIfNecessary` returns a function that will run
       * whenever the options for the intersection observer change.
       */
      return function resetSubscriptionsIfNecessary() {
        if (subscriptions.size > 0) {
          for (const [el, sub] of subscriptions.entries()) {
            sub.unsubscribe();
            subscriptions.delete(el);
          }
        }
      };
    },
    // Note: We don't include `config` in our depenency list because
    // the object might not be referentially stable across renders.
    // We don't care if it isn't; we only care if its deconstructed values
    // (`root`, `rootMargin`, `threshold`) are.
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [
      subscriptions,
      handleIntersectionChange,
      element,
      root,
      rootMargin,
      // Note: We spread `threshold` value(s) as dependencies because
      // `threshold` might be an array that is not referentially stable
      // across renders, and, like with `config`, we don't care if it isn't;
      // we only care if its deconstructed values are.
      /* eslint-disable-next-line react-hooks/exhaustive-deps */
      ...(Array.isArray(threshold) ? threshold : [threshold]),
    ],
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

  if (!providedRef) {
    if (changeHandler.current) {
      return ref;
    } else {
      return [intersects, ref];
    }
  } else if (!changeHandler.current) {
    return intersects;
  }
}

export default useIntersection;
