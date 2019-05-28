import {useEffect, useMemo, useState, useRef, useLayoutEffect} from 'react';
import {useWindowSize} from '@hzcore/windowsize-monitor';
import ResizeObservable from '@hzcore/resize-observable';

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

/**
 * `useSize` is a React hook for components that care about their size.
 *
 * If a `providedRef` is passed to `useSize`, returns a `Size` value.
 *
 * If no `providedRef` is passed, returns an array containing a
 * `Size` object and a `ref` object. The `ref` should be passed
 * to an underlying DOM node.
 */
function useSize<T extends HTMLElement>(): [Size, React.RefObject<T>];
function useSize<T extends HTMLElement>(providedRef: React.RefObject<T>): Size;
function useSize<T extends HTMLElement>(
  /**
   * An optional ref object.
   * If provided, `useSize` will return only a `Size` value.
   * Useful when the component needs to handle ref forwarding.
   */
  providedRef?: React.RefObject<T>,
): Size | [Size, React.RefObject<T>] {
  const [elementSize, setElementSize] = useState<ElementSize>(
    INITIAL_ELEMENT_SIZE,
  );
  const viewSize = useWindowSize();
  const size: Size = useMemo(
    () =>
      Object.freeze({
        x: elementSize.x,
        y: elementSize.y,
        top: elementSize.top,
        right: elementSize.right,
        bottom: elementSize.bottom,
        left: elementSize.left,
        width: elementSize.width,
        height: elementSize.height,
        vw: elementSize.width / viewSize.width,
        vh: elementSize.height / viewSize.height,
      }),
    [elementSize, viewSize],
  );

  const ref = useRef<T | null>(null);
  if (providedRef) {
    ref.current = providedRef.current;
  }

  // Note: we use state instead of a ref to track this value
  // because `useState` supports lazy instantiation (via a callback),
  // whereas`useRef` would have us creating and throwing away a `new Map()`
  // on every subsequent render.
  const [subscriptions] = useState(
    () => new Map<HTMLElement, ZenObservable.Subscription>(),
  );

  /* eslint-disable-next-line react-hooks/exhaustive-deps */
  useLayoutEffect(
    /**
     * `subscribeIfNecessary` will run on layout to determine if we need to
     * subscribe to resize events on an element. If we are already subscribed
     * to the element, it will do nothing.
     */
    function subscribeIfNecessary() {
      const element = ref.current;
      if (element && !subscriptions.has(element)) {
        subscriptions.set(
          element,
          ResizeObservable.create(element).subscribe(setElementSize),
        );
      }
    },
  );

  useEffect(() => {
    /**
     * `cleanup` will run on unmount to unsubscribe from any subscriptions.
     */
    function cleanup(): void {
      if (subscriptions.size > 0) {
        for (const [el, sub] of subscriptions.entries()) {
          sub.unsubscribe();
          subscriptions.delete(el);
        }
      }
    }
    return cleanup;
  }, [subscriptions]);

  return providedRef ? size : [size, ref];
}

export default useSize;
