import {useEffect, useMemo, useState} from 'react';
import useRefCallback, {InnerRef} from '@hzcore/hook-ref-callback';
import {useWindowSize} from '@hzcore/windowsize-monitor';
import ResizeObservable from '@hzcore/resize-observable';

// We really would just like to use DOMRect as our type here, but due to
// the new nature of the API and the polyfill behavior, The DOMRect interface
// isn't always fully implemented. in particulart, the `toJSON()` method is
// often missing. Since we aren't using it directly anyway, we just omit it
// from our expected type.
type ElementSize = Readonly<Pick<DOMRect, Exclude<keyof DOMRect, 'toJSON'>>>;

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
 * A React hook for components that care about their size
 *
 * @returns {[Size, (node: HTMLElement | null) => void]}
 */
export default function useSize(
  /**
   * An optional ref object or callback ref.
   * Useful when the component needs to handle ref forwarding.
   */
  innerRef?: InnerRef<HTMLElement> | null,
): [Size, (node: HTMLElement | null) => void] {
  const [elementSize, setElementSize] = useState<ElementSize>(
    INITIAL_ELEMENT_SIZE,
  );
  const viewSize = useWindowSize();
  const [ref, refCallback] = useRefCallback(innerRef);
  const element = ref.current;
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

  useEffect(() => {
    if (element) {
      const subscription = ResizeObservable.create(element).subscribe(
        setElementSize,
      );
      return subscription.unsubscribe.bind(subscription);
    }
  }, [element]);
  return [size, refCallback];
}
