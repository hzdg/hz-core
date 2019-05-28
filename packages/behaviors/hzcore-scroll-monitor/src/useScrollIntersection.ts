import {useState, useEffect, useRef} from 'react';
import {
  getScrollRect,
  ScrollRect,
  useNearestScrollNodeRef,
  useScrollEffect,
  useSyncRef,
} from './utils';

export interface Bounds {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type TopBounds = Partial<Bounds> & Pick<Bounds, 'top'>;
export type RightBounds = Partial<Bounds> & Pick<Bounds, 'right'>;
export type BottomBounds = Partial<Bounds> & Pick<Bounds, 'bottom'>;
export type LeftBounds = Partial<Bounds> & Pick<Bounds, 'left'>;

export type BoundsRect = TopBounds | RightBounds | BottomBounds | LeftBounds;

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
 * Whether or not any of the configured areas currently intersect with
 * the nearest scrollable container's scroll position.
 *
 * If a single area has been configured, this will be a boolean.
 * If an array of areas has been configured, this will be an array of booleans,
 * where the index of each boolean corresponds to the index of the area in
 * the configuration array.
 */
export type Intersects = boolean | boolean[];

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

/**
 * `getIntersects` returns an `Intersects` value for
 * a given `Event` target and `ScrollIntersectionConfig`.
 *
 * `Intersects` describes whether or not any of the configured areas
 * currently intersect with the scroll position for the given `Event` target.
 *
 * If a single area has been configured in `ScrollIntersectionConfig`,
 * `Intersects` will be a boolean. If an array of areas has been configured,
 * this will be an array of booleans, where the index of each boolean
 * corresponds to the index of the area in the configuration array.
 */
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
 * `useScrollIntersection` is a React hook for components
 * that care about the interesction of the nearest scrollable container's
 * scroll position with one or more areas of the scrollable area.
 *
 * If a `providedRef` is passed to `useScrollIntersection`,
 * returns the `Intersects` value, consisting of one intersection
 * boolean or an array of booleans.
 *
 * If no `providedRef` is passed, returns an array containing an `Intersects`
 * value and a `ref` object. The `ref` should be passed to an underlying
 * DOM node. Note that the node does not have to be scrollable itself,
 * as `useScrollIntersection` will traverse the DOM to find
 * a scrollable parent to observe.
 *
 * `Intersects` describes whether or not any of the configured areas
 * currently intersect with the nearest scrollable container's scroll position.
 *
 * If a single area has been configured, `Intersects` will be a boolean.
 * If an array of areas has been configured, this will be an array of booleans,
 * where the index of each boolean corresponds to the index of the area in
 * the configuration array.
 */
function useScrollIntersection<T extends HTMLElement>(
  config: ScrollIntersectionConfig,
  providedRef: React.RefObject<T>,
): Intersects;
function useScrollIntersection<T extends HTMLElement>(
  config: ScrollIntersectionConfig,
): [Intersects, React.RefObject<T>];
function useScrollIntersection<T extends HTMLElement>(
  /**
   * A rect or array of rects to check for intersection.
   * A rect should have at least one of `{top, right, left, bottom}`
   * set to a number.
   */
  config: ScrollIntersectionConfig,
  /**
   * An optional ref to use. If provided, this ref object will be
   * passed through as the returned value for `useScrollIntersection`.
   * Useful when the component needs to handle ref forwarding.
   */
  providedRef?: React.RefObject<T>,
): Intersects | [Intersects, React.RefObject<T>] {
  // Keep track of changes to intersection config.
  const intersectionConfig = useRef(config);
  useEffect(() => {
    intersectionConfig.current = config;
  }, [config]);

  // Keep track of whether or not any configured areas
  // interesect the scroll position.
  const [intersects, setIntersects] = useState<Intersects>(() => {
    return Array.isArray(intersectionConfig.current)
      ? new Array(intersectionConfig.current.length).fill(false)
      : false;
  });

  const ref = useSyncRef(providedRef);
  const scrollRef = useNearestScrollNodeRef(ref);

  useScrollEffect(
    scrollRef,
    (event: Event): void => {
      setIntersects(getIntersects(event, intersectionConfig.current));
    },
    [],
  );

  // If a ref has been provided, just return the `Intersects` value.
  // If a ref has not not been provided, return a ref along with
  // the `Intersects` value.
  return providedRef ? intersects : [intersects, ref];
}

export default useScrollIntersection;
