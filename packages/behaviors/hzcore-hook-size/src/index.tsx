import {useEffect, useState, useRef, useCallback} from 'react';
import {useWindowSize, WindowSize} from '@hzcore/windowsize-monitor';
import ResizeObservable from '@hzcore/resize-observable';
import useRefCallback from '@hzcore/hook-ref-callback';
import memoizeOne from 'memoize-one';

// We really would just like to use DOMRect as our type here, but due to
// the new nature of the API and the polyfill behavior, The DOMRect interface
// isn't always fully implemented. in particular, the `toJSON()` method is
// often missing. Since we aren't using it directly anyway, we just omit it
// from our expected type.
type ElementSize = Readonly<Pick<DOMRect, Exclude<keyof DOMRect, 'toJSON'>>>;

/**
 * A DOMRect-like object, but with additional useful measurements.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMRect
 */
export interface Size {
  /** The x coordinate of the DOMRect's origin. */
  readonly x: number;
  /** The y coordinate of the DOMRect's origin. */
  readonly y: number;
  /** The width of the DOMRect. */
  readonly width: number;
  /** The height of the DOMRect. */
  readonly height: number;
  /**
   * The top coordinate value of the DOMRect
   * (has the same value as y, or y + height if height is negative.)
   */
  readonly top: number;
  /**
   * The right coordinate value of the DOMRect
   * (has the same value as x + width, or x if width is negative.)
   */
  readonly right: number;
  /**
   * The bottom coordinate value of the DOMRect
   * (has the same value as y + height, or y if height is negative.)
   */
  readonly bottom: number;
  /**
   * The left coordinate value of the DOMRect
   * (has the same value as x, or x + width if width is negative.)
   */
  readonly left: number;
  /**
   * The DOMRect width as a percentage of the viewport width
   * (where 0 is 0% and 1 is 100%.)
   */
  readonly vw: number;
  /**
   * The DOMRect height as a percentage of the viewport height
   * (where 0 is 0% and 1 is 100%.)
   */
  readonly vh: number;
}

const INITIAL_ELEMENT_SIZE: ElementSize = {
  x: 0,
  y: 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  width: 0,
  height: 0,
};

const INITIAL_VIEW_SIZE: WindowSize = {
  width: 0,
  height: 0,
};

function shallowEqual(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): boolean {
  if (a === b) return true;
  for (let k in a) {
    if (a[k] !== b[k]) {
      return false;
    }
  }
  return true;
}

/**
 * `getSize` calculates a new `Size` from a `DOMRect` and viewport size.
 */
const getSize = memoizeOne(
  function getSize(elementSize: ElementSize, viewSize: WindowSize): Size {
    return Object.freeze({
      x: elementSize.x,
      y: elementSize.y,
      top: elementSize.top,
      right: elementSize.right,
      bottom: elementSize.bottom,
      left: elementSize.left,
      width: elementSize.width,
      height: elementSize.height,
      vw: Math.round((elementSize.width / viewSize.width) * 100) / 100 || 0,
      vh: Math.round((elementSize.height / viewSize.height) * 100) / 100 || 0,
    });
  },
  function areInputsEqual(
    [newElementSize, newViewSize],
    [lastElementSize, lastViewSize],
  ) {
    return (
      shallowEqual(newElementSize, lastElementSize) &&
      shallowEqual(newViewSize, lastViewSize)
    );
  },
);

/**
 * `useForceUpdate` will return a function that, when called
 * will force the component to rerender.
 */
function useForceUpdate(): () => void {
  const [, flipUpdateBit] = useState(false);
  const forceUpdate = useCallback(function forceUpdate() {
    flipUpdateBit(v => !v);
  }, []);
  return forceUpdate;
}

/**
 * `useSize` is a React hook for components that care about their size.
 * It can be used statefully or not, and with an existing ref or not.
 *
 * @see https://hz-core.netlify.com/use-size
 */
function useSize<T extends HTMLElement>(
  /**
   * An existing ref being passed to the DOM element to measure.
   * Useful for ref forwarding or sharing.
   */
  providedRef: React.RefObject<T>,
  /**
   * `handler` will receive a `Size` object each time
   * the observed element's size changes.
   */
  handler: (size: Size) => void,
): void;
function useSize<T extends HTMLElement>(
  /**
   * An existing ref being passed to the DOM element to measure.
   * Useful for ref forwarding or sharing.
   */
  providedRef: React.RefObject<T>,
): Size;
function useSize<T extends HTMLElement>(
  /**
   * `handler` will receive a `Size` object each time
   * the observed element's size changes.
   */
  handler: (size: Size) => void,
): React.Ref<T>;
function useSize<T extends HTMLElement>(): [Size, React.Ref<T>];
function useSize<T extends HTMLElement>(
  handlerOrProvidedRef?: React.RefObject<T> | ((size: Size) => void),
  handler?: (size: Size) => void,
): Size | React.Ref<T> | [Size, React.Ref<T>] | void {
  const changeHandler = useRef<((size: Size) => void) | null>(null);
  let providedRef: React.Ref<T> | null = null;

  if (typeof handlerOrProvidedRef === 'function') {
    changeHandler.current = handlerOrProvidedRef;
  } else if (typeof handlerOrProvidedRef === 'object') {
    providedRef = handlerOrProvidedRef;
    if (typeof handler === 'function') {
      changeHandler.current = handler;
    }
  }

  const [ref, setRef] = useRefCallback<T>();
  if (providedRef) setRef(providedRef.current);

  const viewSize = useRef(INITIAL_VIEW_SIZE);
  const elementSize = useRef(INITIAL_ELEMENT_SIZE);
  // Note: we use `setState` here to take advantage of the
  // init function so that we only calculate the initial size once.
  const [initialSize] = useState(() =>
    getSize(elementSize.current, viewSize.current),
  );
  const size = useRef(initialSize);

  const subscribed = useRef<T | null>(null);

  const forceUpdate = useForceUpdate();

  const handleSizeChange = useCallback(
    /**
     * `handleSizeChange` will update the current change handler
     * with a new `Size` whenever the observed element's size or
     * the viewport size changes.
     */
    function handleSizeChange() {
      if (!subscribed.current) return;
      const nextSize = getSize(elementSize.current, viewSize.current);
      if (size.current !== nextSize) {
        size.current = nextSize;
        const cb = changeHandler.current;
        if (typeof cb === 'function') {
          // If we have a callback, then we're in 'stateless' mode,
          // so just call it with the new size.
          cb(size.current);
        } else {
          // Otherwise, we're in 'stateful' mode, so we should rerender,
          // as the size has changed.
          forceUpdate();
        }
      }
    },
    [forceUpdate],
  );

  const handleWindowSizeChange = useCallback(
    /**
     * `handleWindowSizeChange` will update the current view size
     * with a new `WindowSize` whenever it changes, and also
     * call `handleSizeChange` to update the container size.
     */
    function handleWindowSizeChange(windowSize) {
      viewSize.current = windowSize;
      handleSizeChange();
    },
    [handleSizeChange],
  );

  useWindowSize(handleWindowSizeChange);

  const handleElementSizeChange = useCallback(
    /**
     * `handleElementSizeChange` will update the current element size
     * with a new `Size` whenever it changes, and also
     * call `handleSizeChange` to update the container size.
     */
    function handleElementSizeChange(newSize: ElementSize) {
      elementSize.current = newSize;
      handleSizeChange();
    },
    [handleSizeChange],
  );

  const isSubscribed = ref.current === subscribed.current;

  useEffect(
    /**
     * `subscribeIfNecessary` will run to determine if we need to
     * subscribe to resize events on an element. If we are already subscribed
     * to the element, it will do nothing.
     */
    function subscribeIfNecessary() {
      const element = ref.current;
      if (element) {
        subscribed.current = element;
        const subscription = ResizeObservable.create(element).subscribe(
          handleElementSizeChange,
        );

        return function unsubscribe() {
          subscribed.current = null;
          subscription.unsubscribe();
        };
      }
    },
    [isSubscribed, ref, handleElementSizeChange],
  );

  if (!providedRef) {
    if (changeHandler.current) {
      return setRef;
    } else {
      return [size.current, setRef];
    }
  } else if (!changeHandler.current) {
    return size.current;
  }
}

export default useSize;
