import {useState, useEffect} from 'react';
import useRefCallback, {InnerRef} from '@hzcore/hook-ref-callback';
import {getScrollRect, ScrollRect, useNearestScrollNode} from './utils';

const SCROLL = 'scroll';
const LISTENER_OPTIONS: AddEventListenerOptions = {passive: true};

interface Bounds {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

type TopBounds = Partial<Bounds> & Pick<Bounds, 'top'>;
type RightBounds = Partial<Bounds> & Pick<Bounds, 'right'>;
type BottomBounds = Partial<Bounds> & Pick<Bounds, 'bottom'>;
type LeftBounds = Partial<Bounds> & Pick<Bounds, 'left'>;

type BoundsRect = TopBounds | RightBounds | BottomBounds | LeftBounds;

/**
 * One or more areas to check for intersection with
 * the nearest scrollable container's scroll position.
 *
 * An area can be defined completely, i.e.,
 *
 *   {top: 0, right: 50, bottom: 50, left: 0}
 *
 * or partially, i.e.,
 *
 *   {right: 50, bottom: 50}
 */
export type ScrollIntersectionConfig = BoundsRect | BoundsRect[];

/**
 * Whether or not any of the configured areas currently intersect witho
 * the nearest scrollable container's scroll position.
 *
 * If a single area has been configured, this will be one boolean.
 * If an array of areas has been configured, this will be an array of booleans,
 * where the index of each boolean corresponds to the index of the area in
 * the configuration array.
 */
export type Intersects = boolean | boolean[] | null;

function intersects(bounds: BoundsRect, rect: ScrollRect): boolean {
  const {
    top = rect.top,
    right = rect.width,
    bottom = rect.height,
    left = rect.left,
  } = bounds;

  const inRangeVertical =
    typeof rect.top === 'number' &&
    (typeof top === 'number' && top <= rect.top) &&
    (typeof bottom === 'number' && bottom >= rect.top);

  const inRangeHorizontal =
    typeof rect.left === 'number' &&
    (typeof left === 'number' && left <= rect.left) &&
    (typeof right === 'number' && right >= rect.left);

  return inRangeVertical && inRangeHorizontal;
}

export function getIntersects(
  event: Event,
  config?: ScrollIntersectionConfig | null,
): Intersects {
  if (!config) return false;
  const target = event.currentTarget;
  if (target instanceof HTMLElement || target instanceof Document) {
    const rect = getScrollRect(target);
    if (Array.isArray(config)) {
      return config.map(c => intersects(c, rect));
    } else {
      return intersects(config, rect);
    }
  }
  return false;
}

/**
 * A React hook for components that care about the interesction
 * of the nearest scrollable container's scroll position
 * with one or more areas of the scrollable area.
 *
 * @returns {[Intersects, (node: HTMLElement | null) => void]}
 */
function useScrollIntersection(
  config: ScrollIntersectionConfig,
  innerRef?: InnerRef<HTMLElement> | null,
): [Intersects, (node: HTMLElement | null) => void];
function useScrollIntersection(
  config?: ScrollIntersectionConfig | null,
  innerRef?: InnerRef<HTMLElement> | null,
): [Intersects, (node: HTMLElement | null) => void];
function useScrollIntersection(
  /**
   * A rect or array of rects to check for intersection.
   * A rect should have at least one of `{top, right, left, bottom}`
   * set to a number.
   */
  config?: ScrollIntersectionConfig | null,
  /**
   * An optional ref object or callback ref.
   * Useful when the component needs to handle ref forwarding.
   */
  innerRef?: InnerRef<HTMLElement> | null,
): [Intersects, (node: HTMLElement | null) => void] {
  const [ref, refCallback] = useRefCallback(innerRef);
  const scrollingElement = useNearestScrollNode(ref);
  const [intersects, setIntersects] = useState<Intersects>(null);

  useEffect(() => {
    const handler = (event: Event): void => {
      setIntersects(getIntersects(event, config));
    };

    if (scrollingElement && config) {
      scrollingElement.addEventListener(SCROLL, handler, LISTENER_OPTIONS);
    }
    return () => {
      if (scrollingElement) {
        scrollingElement.removeEventListener(SCROLL, handler, LISTENER_OPTIONS);
      }
    };
  }, [scrollingElement, config]);

  return [intersects, refCallback];
}

export default useScrollIntersection;
