import {useState, useEffect} from 'react';
import useRefCallback, {InnerRef} from '@hzcore/hook-ref-callback';
import {getNearestScrollNode, getScrollRect, ScrollRect} from './utils';

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

export type ScrollIntersectionConfig = BoundsRect | BoundsRect[];

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

function getIntersects(
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
  const [intersects, setIntersects] = useState<Intersects>(null);
  const scrollingElement = getNearestScrollNode(ref.current);

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
