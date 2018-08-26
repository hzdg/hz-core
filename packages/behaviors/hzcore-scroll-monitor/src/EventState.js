/* eslint-disable max-lines */
// @flow
import warning from 'warning';
import Debug from 'debug';
import shallowEqual from 'shallowequal';
import {
  UP,
  DOWN,
  LEFT,
  RIGHT,
  SCROLLING_CHANGE,
  VERTICAL_DIRECTION_CHANGE,
  HORIZONTAL_DIRECTION_CHANGE,
  VERTICAL_POSITION_CHANGE,
  HORIZONTAL_POSITION_CHANGE,
  IN_BOUNDS,
  IN_VIEWPORT,
} from './types';

/* eslint-disable no-duplicate-imports */
import type {
  BoundsConfig,
  BoundsRect,
  EventStateStore,
  ScrollMonitorChangeChecker,
  ScrollMonitorConfig,
  ScrollMonitorEvent,
  ScrollMonitorEventConfig,
  ScrollMonitorEventState,
  ScrollRect,
  ScrollState,
  UpdatePayload,
  ViewportConfig,
  ChangeHandler,
} from './types';
/* eslint-enable no-duplicate-imports */

export function create(config: ScrollMonitorConfig): EventStateStore {
  const debug = Debug(`ScrollMonitor:uid:${config.uid}`);
  const configs = [];
  const initialEventState = {};
  const changeHandler = config.onChange
    ? createDebouncedChangeHandler(config.onChange)
    : null;
  const hasScrollingHandlers = Boolean(config.onStart || config.onEnd);

  if (hasScrollingHandlers || config.scrolling) {
    let scrollingChangeHandler = changeHandler;
    if (hasScrollingHandlers) {
      const {onStart, onEnd} = config;
      scrollingChangeHandler = state => {
        if (state.scrolling && typeof onStart === 'function') onStart(state);
        if (typeof changeHandler === 'function') changeHandler(state);
        if (!state.scrolling && typeof onEnd === 'function') onEnd(state);
      };
    }
    configs.push(
      createEventConfig(SCROLLING_CHANGE, null, scrollingChangeHandler, debug),
    );
    initialEventState.scrolling = null;
  }
  if (config.direction) {
    if (!config.vertical && !config.horizontal) {
      configs.push(
        createEventConfig(
          VERTICAL_DIRECTION_CHANGE,
          null,
          changeHandler,
          debug,
        ),
        createEventConfig(
          HORIZONTAL_DIRECTION_CHANGE,
          null,
          changeHandler,
          debug,
        ),
      );
      initialEventState.verticalDirection = null;
      initialEventState.horizontalDirection = null;
    } else {
      if (config.vertical) {
        configs.push(
          createEventConfig(
            VERTICAL_DIRECTION_CHANGE,
            null,
            changeHandler,
            debug,
          ),
        );
        initialEventState.verticalDirection = null;
      }
      if (config.horizontal) {
        configs.push(
          createEventConfig(
            HORIZONTAL_DIRECTION_CHANGE,
            null,
            changeHandler,
            debug,
          ),
        );
        initialEventState.horizontalDirection = null;
      }
    }
  }
  if (config.position) {
    if (!config.vertical && !config.horizontal) {
      configs.push(
        createEventConfig(VERTICAL_POSITION_CHANGE, null, changeHandler, debug),
        createEventConfig(
          HORIZONTAL_POSITION_CHANGE,
          null,
          changeHandler,
          debug,
        ),
      );
    } else {
      if (config.vertical) {
        configs.push(
          createEventConfig(
            VERTICAL_POSITION_CHANGE,
            null,
            changeHandler,
            debug,
          ),
        );
      }
      if (config.horizontal) {
        configs.push(
          createEventConfig(
            HORIZONTAL_POSITION_CHANGE,
            null,
            changeHandler,
            debug,
          ),
        );
      }
    }
  }
  if (config.bounds) {
    configs.push(
      createEventConfig(IN_BOUNDS, config.bounds, changeHandler, debug),
    );
    initialEventState.inBounds = null;
  }
  if (config.viewport) {
    configs.push(
      createEventConfig(IN_VIEWPORT, config.viewport, changeHandler, debug),
    );
    initialEventState.inViewport = null;
  }
  return {configs, state: initialEventState};
}

/*
 * An event config is an object that wraps a `ScrollMonitorEvent`
 * with config and  a `shouldUpdate` method.
 *
 * The `shouldUpdate` method should return `true` if
 * the given payload indicates that this particular event
 * should be dispatched. It should return `false` if the given payload
 * indicates that this particular event should not be dispatched.
 * Finally, it should return `undefined` if it cannot be determined
 * from the payload whether or not this particular event should be dispatched.
 */
function createEventConfig(
  event: ScrollMonitorEvent,
  config: ?(BoundsConfig | ViewportConfig),
  onUpdate: ?ChangeHandler,
  debug: Function,
): ScrollMonitorEventConfig {
  // Default shouldUpdate always does nothing.
  let shouldUpdate = () => void 0;

  switch (event) {
    case SCROLLING_CHANGE: {
      shouldUpdate = createScrollingChangeChecker(debug);
      break;
    }
    case VERTICAL_DIRECTION_CHANGE: {
      shouldUpdate = createVerticalDirectionChangeChecker(debug);
      break;
    }
    case HORIZONTAL_DIRECTION_CHANGE: {
      shouldUpdate = createHorizontalDirectionChangeChecker(debug);
      break;
    }
    case VERTICAL_POSITION_CHANGE: {
      shouldUpdate = createVerticalPositionChangeChecker(debug);
      break;
    }
    case HORIZONTAL_POSITION_CHANGE: {
      shouldUpdate = createHorizontalPositionChangeChecker(debug);
      break;
    }
    case IN_BOUNDS: {
      if (config)
        shouldUpdate = createBoundsChangeChecker(
          ((config: any): BoundsConfig),
          debug,
        );
      break;
    }
    case IN_VIEWPORT: {
      if (config)
        shouldUpdate = createViewportChangeChecker(
          ((config: any): ViewportConfig),
          debug,
        );
      break;
    }
    default: {
      warning(false, `Unsupported event type ${event}.`);
      break;
    }
  }

  return {event, config, shouldUpdate, onUpdate};
}

function createDebouncedChangeHandler(handler: ChangeHandler): ChangeHandler {
  let called = false;
  return state => {
    if (!called) {
      handler(state);
      called = true;
      setTimeout(() => {
        called = false;
      });
    }
  };
}

function createScrollingChangeChecker(
  debug: Function,
): ScrollMonitorChangeChecker {
  return (
    payload: UpdatePayload,
    scrollState: ScrollState,
    eventState: ScrollMonitorEventState,
  ): ?boolean => {
    const {scrolling} = payload;
    if (scrolling == null) return false; // eslint-disable-line eqeqeq
    if (scrolling === eventState.scrolling) {
      return false;
    } else {
      eventState.scrolling = scrolling;
      debug('SCROLLING_CHANGE', scrolling);
      return true;
    }
  };
}

function createVerticalDirectionChangeChecker(
  debug: Function,
): ScrollMonitorChangeChecker {
  return (
    payload: UpdatePayload,
    scrollState: ScrollState,
    eventState: ScrollMonitorEventState,
  ): ?boolean => {
    const {rect} = payload;
    if (!rect) return false;
    const {top} = rect;
    if (top === void 0) return false;
    const verticalDirection =
      typeof scrollState.top === 'number' &&
      typeof top === 'number' &&
      top < scrollState.top
        ? UP
        : DOWN;
    if (verticalDirection === eventState.verticalDirection) {
      return false;
    } else {
      eventState.verticalDirection = verticalDirection;
      debug('VERTICAL_DIRECTION_CHANGE', verticalDirection);
      return true;
    }
  };
}

function createHorizontalDirectionChangeChecker(
  debug: Function,
): ScrollMonitorChangeChecker {
  return (
    payload: UpdatePayload,
    scrollState: ScrollState,
    eventState: ScrollMonitorEventState,
  ): ?boolean => {
    const {rect} = payload;
    if (!rect) return false;
    const {left} = rect;
    if (left === void 0) return false;
    const horizontalDirection =
      typeof scrollState.left === 'number' &&
      typeof left === 'number' &&
      left < scrollState.left
        ? RIGHT
        : LEFT;
    if (horizontalDirection === eventState.horizontalDirection) {
      return false;
    } else {
      eventState.horizontalDirection = horizontalDirection;
      debug('HORIZONTAL_DIRECTION_CHANGE', horizontalDirection);
      return true;
    }
  };
}

function createVerticalPositionChangeChecker(
  debug: Function,
): ScrollMonitorChangeChecker {
  return (payload: UpdatePayload, scrollState: ScrollState): ?boolean => {
    const {rect} = payload;
    if (!rect) return false;
    const {top} = rect;
    if (top === void 0) return false;
    if (top === scrollState.top) return false;
    debug('VERTICAL_POSITION_CHANGE', top);
    return true;
  };
}

function createHorizontalPositionChangeChecker(
  debug: Function,
): ScrollMonitorChangeChecker {
  return (payload: UpdatePayload, scrollState: ScrollState): ?boolean => {
    const {rect} = payload;
    if (!rect) return false;
    const {left} = rect;
    if (left === void 0) return false;
    if (left === scrollState.left) return false;
    debug('HORIZONTAL_POSITION_CHANGE', left);
    return true;
  };
}

function createBoundsChangeChecker(
  config: BoundsConfig,
  debug: Function,
): ScrollMonitorChangeChecker {
  return (
    payload: UpdatePayload,
    scrollState: ScrollState,
    eventState: ScrollMonitorEventState,
  ): ?boolean => {
    const {rect} = payload;
    if (!rect) return false;
    if (Array.isArray(config)) {
      const nowInBounds = config.map(c =>
        inBounds(typeof c === 'object' ? {...c} : c, rect),
      );
      if (!shallowEqual(eventState.inBounds, nowInBounds)) {
        eventState.inBounds = nowInBounds;
        debug('IN_BOUNDS', nowInBounds);
        return true;
      }
    } else {
      config = typeof config === 'object' ? {...config} : config;
      const nowInBounds = inBounds(config, rect);
      if (eventState.inBounds !== nowInBounds) {
        eventState.inBounds = nowInBounds;
        debug('IN_BOUNDS', nowInBounds);
        return true;
      }
    }
    return false;
  };
}

function inBounds(bounds: BoundsRect, rect: ScrollRect): boolean {
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

function createViewportChangeChecker(
  config: ViewportConfig,
  debug: Function,
): ScrollMonitorChangeChecker {
  config = typeof config === 'object' ? {...config} : config;
  return (
    payload: UpdatePayload,
    scrollState: ScrollState,
    eventState: ScrollMonitorEventState,
  ): ?boolean => {
    const {intersection} = payload;
    if (!intersection) return;
    if (eventState.inViewport !== intersection.inViewport) {
      eventState.inViewport = intersection.inViewport;
      eventState.viewportRatio = intersection.ratio;
      debug('IN_VIEWPORT', intersection.inViewport);
      return true;
    }
    return false;
  };
}

export default {create};
