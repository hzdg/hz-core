// @flow
import warning from 'warning';
import Debug from 'debug';
import {
  UP,
  DOWN,
  LEFT,
  RIGHT,
  VERTICAL_DIRECTION_CHANGE,
  HORIZONTAL_DIRECTION_CHANGE,
  IN_BOUNDS,
  IN_VIEWPORT,
} from './types';

/* eslint-disable no-duplicate-imports */
import type {
  BoundsConfig,
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
} from './types';
/* eslint-enable no-duplicate-imports */

export function create(config: ScrollMonitorConfig): EventStateStore {
  const debug = Debug(`ScrollMonitor:uid:${config.uid}`);
  const configs = [];
  const initialEventState = {};
  if (config.direction) {
    if (!config.vertical && !config.horizontal) {
      configs.push(
        createEventConfig(VERTICAL_DIRECTION_CHANGE, null, debug),
        createEventConfig(HORIZONTAL_DIRECTION_CHANGE, null, debug),
      );
      initialEventState.verticalDirection = null;
      initialEventState.horizontalDirection = null;
    } else {
      if (config.vertical) {
        configs.push(createEventConfig(VERTICAL_DIRECTION_CHANGE, null, debug));
        initialEventState.verticalDirection = null;
      }
      if (config.horizontal) {
        configs.push(
          createEventConfig(HORIZONTAL_DIRECTION_CHANGE, null, debug),
        );
        initialEventState.horizontalDirection = null;
      }
    }
  }
  if (config.bounds) {
    configs.push(createEventConfig(IN_BOUNDS, config.bounds, debug));
    initialEventState.inBounds = null;
  }
  if (config.viewport) {
    configs.push(createEventConfig(IN_VIEWPORT, config.viewport, debug));
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
  debug: Function,
): ScrollMonitorEventConfig {
  // Default shouldUpdate always does nothing.
  let shouldUpdate = () => void 0;

  switch (event) {
    case VERTICAL_DIRECTION_CHANGE: {
      shouldUpdate = createVerticalDirectionChangeChecker(debug);
      break;
    }
    case HORIZONTAL_DIRECTION_CHANGE: {
      shouldUpdate = createHorizontalDirectionChangeChecker(debug);
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

  return {event, config, shouldUpdate};
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

function createBoundsChangeChecker(
  config: BoundsConfig,
  debug: Function,
): ScrollMonitorChangeChecker {
  config = typeof config === 'object' ? {...config} : config;
  return (
    payload: UpdatePayload,
    scrollState: ScrollState,
    eventState: ScrollMonitorEventState,
  ): ?boolean => {
    const {rect} = payload;
    if (!rect) return false;
    const nowInBounds = inBounds(config, rect, scrollState);
    if (eventState.inBounds !== nowInBounds) {
      eventState.inBounds = nowInBounds;
      debug('IN_BOUNDS', nowInBounds);
      return true;
    }
    return false;
  };
}

function inBounds(
  bounds: BoundsConfig,
  rect: ScrollRect,
  state: ScrollState,
): ?boolean {
  const {
    top = rect.top,
    right = rect.width,
    bottom = rect.height,
    left = rect.left,
  } =
    typeof bounds === 'function' ? bounds(state) : bounds;

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
