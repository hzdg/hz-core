// @flow
import {UP, DOWN, LEFT, RIGHT} from './ScrollDirection';
import {
  VERTICAL_DIRECTION_CHANGE,
  HORIZONTAL_DIRECTION_CHANGE,
  IN_BOUNDS,
  IN_VIEWPORT,
} from './ScrollMonitorEvent';
import Debug from 'debug';

const debug = Debug('ScrollMonitor:events');

import type {
  Bounds,
  RegistrationConfig,
  ScrollMonitorEvent,
  ScrollMonitorEventConfig,
  ScrollMonitorEventState,
  ScrollMonitorStateHandler,
  ScrollMonitorStateHandlerGetter,
  ScrollRect,
  ScrollState,
} from './types';

export function eventsFromConfig(
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
  // if (config.viewport) events.push([IN_VIEWPORT, ???]);
  return [events, initialEventState];
}

export function createHandler(
  event: ScrollMonitorEvent,
  config: ?Bounds,
  callback: ScrollMonitorStateHandler,
): ScrollMonitorStateHandlerGetter {
  return function getMonitorEventCallback(
    rect: ScrollRect,
    scrollState: ScrollState,
    eventState: ScrollMonitorEventState,
  ): ?ScrollMonitorStateHandler {
    const {top, left, width, height} = rect;

    switch (event) {
      case VERTICAL_DIRECTION_CHANGE: {
        const verticalDirection = top < scrollState.top ? UP : DOWN;
        if (verticalDirection === eventState.verticalDirection) {
          return false;
        } else {
          eventState.verticalDirection = verticalDirection;
          debug('VERTICAL_DIRECTION_CHANGE', verticalDirection);
          return callback;
        }
      }

      case HORIZONTAL_DIRECTION_CHANGE: {
        const horizontalDirection = left < scrollState.left ? RIGHT : LEFT;
        if (horizontalDirection === eventState.horizontalDirection) {
          return false;
        } else {
          eventState.horizontalDirection = horizontalDirection;
          debug('HORIZONTAL_DIRECTION_CHANGE', horizontalDirection);
          return callback;
        }
      }

      case IN_BOUNDS: {
        if (!config) return false;
        const nowInBounds = inBounds(config, rect, scrollState);
        if (eventState.inBounds !== nowInBounds) {
          eventState.inBounds = nowInBounds;
          debug('IN_BOUNDS', nowInBounds);
          return callback;
        }
        return false;
      }

      // case IN_VIEWPORT: {
      // }

      default: {
        return false;
      }
    }
  };
}

export function createHandlers(config, callback) {
  const eventHandlers = {};
  const [eventNames, eventState] = eventsFromConfig(config);
  for (let eventName of eventNames) {
    let eventConfig = null;
    if (Array.isArray(eventName)) [eventName, eventConfig] = eventName;
    debug('Creating handler for', eventName, 'with config', eventConfig);
    const handler = createHandler(eventName, eventConfig, callback);
    eventHandlers[eventName] = [handler, eventState];
  }
  return eventHandlers;
}

function inBounds(bounds, rect, state) {
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
