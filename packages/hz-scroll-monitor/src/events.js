// @flow
import {UP, DOWN, LEFT, RIGHT} from './ScrollDirection';
import {
  VERTICAL_DIRECTION_CHANGE,
  HORIZONTAL_DIRECTION_CHANGE,
  IN_BOUNDS,
  IN_VIEWPORT,
} from './ScrollMonitorEvent';
import Debug from 'debug';

import type {
  BoundsConfig,
  BoundsRect,
  RegistrationConfig,
  ScrollMonitorEvent,
  ScrollMonitorEventConfig,
  ScrollMonitorEventState,
  ScrollMonitorStateHandler,
  ScrollMonitorStateHandlerWrapper,
  ScrollState,
  UpdatePayload,
  ViewportConfig,
  ViewportChange,
} from './types';

export function createHandlers(
  config: RegistrationConfig,
  callback: ScrollMonitorStateHandler,
): {
  [key: string]: [ScrollMonitorStateHandlerWrapper, ScrollMonitorEventState],
} {
  const debug = Debug(`ScrollMonitor:uid:${config.uid}`);
  const eventHandlers = {};
  const [eventNames, eventState] = eventsFromConfig(config, debug);
  for (let eventName of eventNames) {
    let eventConfig = null;
    if (Array.isArray(eventName)) [eventName, eventConfig] = eventName;
    debug(`Creating handler for ${eventName}`, eventConfig);
    const handler = wrapHandler(eventName, eventConfig, callback, debug);
    eventHandlers[eventName] = [handler, eventState];
  }
  return eventHandlers;
}

function eventsFromConfig(
  config: RegistrationConfig,
): [ScrollMonitorEventConfig[], ScrollMonitorEventState] {
  const events = [];
  const initialEventState = {};
  if (config.direction) {
    if (!config.vertical && !config.horizontal) {
      events.push(VERTICAL_DIRECTION_CHANGE, HORIZONTAL_DIRECTION_CHANGE);
      initialEventState.verticalDirection = null;
      initialEventState.horizontDirection = null;
    } else {
      if (config.vertical) {
        events.push(VERTICAL_DIRECTION_CHANGE);
        initialEventState.verticalDirection = null;
      }
      if (config.horizontal) {
        events.push(HORIZONTAL_DIRECTION_CHANGE);
        initialEventState.horizontDirection = null;
      }
    }
  }
  if (config.bounds) {
    events.push([IN_BOUNDS, config.bounds]);
    initialEventState.inBounds = null;
  }
  if (config.viewport) {
    events.push([IN_VIEWPORT, {...config.viewport}]);
    initialEventState.inViewport = null;
  }
  return [events, initialEventState];
}

function wrapHandler(
  event: ScrollMonitorEvent,
  config: ?(BoundsConfig | ViewportConfig),
  callback: ScrollMonitorStateHandler,
  debug: Function,
): ScrollMonitorStateHandlerWrapper {
  // Default wrapper just always returns false (never handles anything).
  let wrapper = () => false;

  switch (event) {
    case VERTICAL_DIRECTION_CHANGE: {
      wrapper = wrapVerticalDirectionChange(callback, debug);
      break;
    }
    case HORIZONTAL_DIRECTION_CHANGE: {
      wrapper = wrapHorizontalDirectionChange(callback, debug);
      break;
    }
    case IN_BOUNDS: {
      if (config) wrapper = wrapBoundsChange(config, callback, debug);
      break;
    }
    case IN_VIEWPORT: {
      if (config) wrapper = wrapViewportChange(config, callback, debug);
      break;
    }
  }

  return wrapper;
}

function wrapVerticalDirectionChange(
  callback: ScrollMonitorStateHandler,
  debug: Function,
): ScrollMonitorStateHandlerWrapper {
  return (
    payload: UpdatePayload,
    scrollState: ScrollState,
    eventState: ScrollMonitorEventState,
  ): ?ScrollMonitorStateHandler => {
    const {rect} = payload;
    if (!rect) return false;
    const {top} = rect;
    if (top === void 0) return false;
    const verticalDirection = top < scrollState.top ? UP : DOWN;
    if (verticalDirection === eventState.verticalDirection) {
      return false;
    } else {
      eventState.verticalDirection = verticalDirection;
      debug('VERTICAL_DIRECTION_CHANGE', verticalDirection);
      return callback;
    }
  };
}

function wrapHorizontalDirectionChange(
  callback: ScrollMonitorStateHandler,
  debug: Function,
): ScrollMonitorStateHandlerWrapper {
  return (
    payload: UpdatePayload,
    scrollState: ScrollState,
    eventState: ScrollMonitorEventState,
  ): ?ScrollMonitorStateHandler => {
    const {rect} = payload;
    if (!rect) return false;
    const {left} = rect;
    if (left === void 0) return false;
    const horizontalDirection = left < scrollState.left ? RIGHT : LEFT;
    if (horizontalDirection === eventState.horizontalDirection) {
      return false;
    } else {
      eventState.horizontalDirection = horizontalDirection;
      debug('HORIZONTAL_DIRECTION_CHANGE', horizontalDirection);
      return callback;
    }
  };
}

function wrapBoundsChange(
  config: BoundsConfig,
  callback: ScrollMonitorStateHandler,
  debug: Function,
): ScrollMonitorStateHandlerWrapper {
  return (
    payload: UpdatePayload,
    scrollState: ScrollState,
    eventState: ScrollMonitorEventState,
  ): ?ScrollMonitorStateHandler => {
    const {rect} = payload;
    if (!rect) return false;
    const nowInBounds = inBounds(config, rect, scrollState);
    if (eventState.inBounds !== nowInBounds) {
      eventState.inBounds = nowInBounds;
      debug('IN_BOUNDS', nowInBounds);
      return callback;
    }
    return false;
  };
}

function inBounds(
  bounds: BoundsConfig,
  rect: BoundsRect,
  state: ScrollState,
): Boolean {
  const {
    top = rect.top,
    right = rect.width,
    bottom = rect.height,
    left = rect.left,
  } =
    typeof bounds === 'function' ? bounds(state) : bounds;

  const inRangeVertical = top <= rect.top && bottom >= rect.top;
  const inRangeHorizontal = left <= rect.left && right >= rect.left;

  return inRangeVertical && inRangeHorizontal;
}

function wrapViewportChange(
  config: ViewportConfig,
  callback: ScrollMonitorStateHandler,
  debug: Function,
): ScrollMonitorStateHandlerWrapper {
  return (
    payload: UpdatePayload,
    scrollState: ScrollState,
    eventState: ScrollMonitorEventState,
  ): ?ScrollMonitorStateHandler => {
    const {intersections} = payload;
    if (!intersections) return;
    const intersection = getViewportChange(config, intersections);
    if (!intersection) return;
    if (eventState.inViewport !== intersection.inViewport) {
      eventState.inViewport = intersection.inViewport;
      eventState.viewportRatio = intersection.ratio;
      debug('IN_VIEWPORT', intersection.inViewport);
      return callback;
    }
    return false;
  };
}

function getViewportChange(
  config: ViewportConfig,
  intersections: ViewportChange[],
): ?ViewportChange {
  return intersections.find(({target}) => target === config.target);
}
