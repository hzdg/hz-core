import {useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import {InnerRef} from '@hzcore/hook-ref-callback';
import useScrolling from './useScrolling';
import useScrollPosition, {ScrollPosition} from './useScrollPosition';
import useScrollDirection, {ScrollDirection} from './useScrollDirection';
import useScrollIntersection, {
  ScrollIntersectionConfig,
  Intersects,
} from './useScrollIntersection';

/**
 * Scroll state passed to the ScrollMonitor render prop (children function).
 */
export interface ScrollMonitorRenderProps {
  /**
   * A callback ref that should be passed to an underlying DOM node.
   * Note that the node does not have to be scrollable itself,
   * as `ScrollMonitor` will traverse the DOM to find a scrollable parent
   * to observe.
   */
  scrollRef: (instance: HTMLElement | null) => void;
  /**
   * Whether or not the nearest scrollable container is currently scrolling.
   *
   * Only set if the `ScrollMonitor` `scrolling` prop is `true`.
   */
  scrolling: boolean;
  /**
   * The current position of the nearest scrollable container.
   *
   * Only set if the `ScrollMonitor` `position` prop is `true`.
   */
  position: ScrollPosition;
  /**
   * The latest vertical and horizontal direction of scroll
   * in the nearest scrollable container.
   *
   * Only set if the `ScrollMonitor` `direction` prop is `true`.
   */
  direction: ScrollDirection;
  /**
   * Whether or not the latest position of the nearest scrollable container
   * intersects with one or more defined areas.
   *
   * Only set if the `ScrollMonitor` `inersects` prop is given a defined
   * area, or array of areas, of the form
   * `{top?: number, right?: number, bottom?: number, left?: number}`.
   */
  intersects: Intersects;
}

export interface ScrollMonitorProps {
  /**
   * A function that takes scroll monitor state and returns a React element.
   * Also known as a 'render prop'.
   */
  children: (state: ScrollMonitorRenderProps) => JSX.Element;
  /**
   * An optional ref object or callback ref.
   * Useful when the owner component needs to handle ref forwarding.
   */
  innerRef?: InnerRef<HTMLElement> | null;
  /**
   * Whether or not to monitor scroll direction.
   *
   * If `true`, then scroll state will have a `direction` value
   * like `{vertical: 'down', horizontal: 'right'}`.
   */
  direction?: boolean | null;
  /**
   * Whether or not to monitor scroll direction.
   *
   * If `true`, then scroll state will have a `position` value
   * like `{top: 10, left: 10}`.
   */
  position?: boolean | null;
  /**
   * Whether or not to monitor scrolling state.
   *
   * if `true`, then scroll state will have a boolean `scrolling` value
   * where `true` means scrolling is happening.
   */
  scrolling?: boolean | null;
  /**
   * One area, or array of areas, of the form
   * `{top?: number, right?: number, bottom?: number, left?: number}`
   * within a scrollable area to monitor for intersection with scroll position.
   *
   * If defined, then scroll state will have an `intersects` value
   * like `true` or `[true, false]`, depending on if the config defines
   * a single area an array of areas. The value indicates whether or not
   * scroll position currently intersects with the defined area.
   */
  intersects?: ScrollIntersectionConfig | null;
  /**
   * A callback for when scrolling starts.
   */
  onStart?: (() => void) | null;
  /**
   * A callback for when scroll position changes.
   * Receives the latest scroll state, in the same form as the render prop.
   */
  onChange?:
    | ((
        position: Pick<
          ScrollMonitorRenderProps,
          'scrolling' | 'position' | 'position' | 'direction' | 'intersects'
        >,
      ) => void)
    | null;
  onEnd?: (() => void) | null;
}

/**
 * A React component for monitoring and interacting with scroll position.
 *
 * `ScrollMonitor` is a headless component, meaning
 * it accepts a child render prop, and returns the result
 * of calling that render prop with the latest state of
 * the nearest scrollable container.
 */
function ScrollMonitor(props: ScrollMonitorProps): JSX.Element {
  const {children: render, onStart, onChange, onEnd} = props;

  const [scrolling, scrollingRef] = useScrolling(
    props.innerRef,
    !props.scrolling && !onStart && !onChange && !onEnd,
  );

  const [position, scrollPositionRef] = useScrollPosition(
    scrollingRef,
    !props.position && !onChange,
  );

  const [direction, scrollDirectionRef] = useScrollDirection(
    scrollPositionRef,
    !props.direction,
  );

  const [intersects, scrollRef] = useScrollIntersection(
    props.intersects,
    scrollDirectionRef,
  );

  // Call the `onStart` hook if the scroll container is scrolling.
  useEffect(() => {
    if (typeof onStart === 'function' && scrolling) {
      onStart();
    }
  }, [onStart, scrolling]);

  // Call the `onChange` hook if the scroll container is scrolling.
  useEffect(() => {
    if (typeof onChange === 'function' && scrolling) {
      onChange({
        scrolling,
        position,
        direction,
        intersects,
      });
    }
  }, [onChange, scrolling, position, direction, intersects]);

  // Keep track whether or not the scroll container
  // was scrolling during the previous `onEnd` effect.
  const [wasScrolling, setWasScrolling] = useState(false);

  // Call the `onEnd` hook if the scroll container is not scrolling.
  useEffect(() => {
    // Call the `onEnd` hook if scrolling just stopped.
    if (typeof onEnd === 'function' && wasScrolling && !scrolling) {
      onEnd();
    }
    // Set whether or not the scroll container was scrolling during this effect.
    setWasScrolling(scrolling);
  }, [onEnd, wasScrolling, scrolling]);

  return render({
    scrollRef,
    scrolling,
    position,
    direction,
    intersects,
  });
}

ScrollMonitor.propTypes = {
  children: PropTypes.func.isRequired,
  innerRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({
      current: PropTypes.node,
    }),
  ]),
  vertical: PropTypes.bool,
  horizontal: PropTypes.bool,
  direction: PropTypes.bool,
  position: PropTypes.bool,
  scrolling: PropTypes.bool,
  intersects: PropTypes.oneOfType([
    PropTypes.shape({
      top: PropTypes.number,
      right: PropTypes.number,
      bottom: PropTypes.number,
      left: PropTypes.number,
    }),
    PropTypes.arrayOf(
      PropTypes.shape({
        top: PropTypes.number,
        right: PropTypes.number,
        bottom: PropTypes.number,
        left: PropTypes.number,
      }),
    ),
  ]),
  onStart: PropTypes.func,
  onChange: PropTypes.func,
  onEnd: PropTypes.func,
};

export default ScrollMonitor;
