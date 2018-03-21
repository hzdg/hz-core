// @flow
import {UP, DOWN, LEFT, RIGHT} from './ScrollDirection';
import Debug from 'debug';

const debug = Debug('ScrollMonitor:events');

import type {
  RegistrationConfig,
  Bounds,
  ScrollRect,
  ScrollState,
  ScrollStateHandler,
} from './registrar';

export const VERTICAL_DIRECTION_CHANGE = 'verticalDirectionChange'; // scrolling has changed vertical directions (up vs down)
export const HORIZONTAL_DIRECTION_CHANGE = 'horizontalDirectionChange'; // scrolling has changed horizontal directions (left vs right)
export const IN_BOUNDS = 'inBounds'; // Whether some bounds contains scroll position
export const IN_VIEWPORT = 'inViewport'; // Whether some part of a rect is now in the scrollable viewport

export type MonitorEvent =
  | typeof VERTICAL_DIRECTION_CHANGE
  | typeof HORIZONTAL_DIRECTION_CHANGE
  | typeof IN_BOUNDS
  | typeof IN_VIEWPORT;

type EventConfig = MonitorEvent | [MonitorEvent, Bounds];

export function eventsFromConfig(config: RegistrationConfig): EventConfig[] {
  const events = [];
  if (config.direction) {
    if (!config.vertical && !config.horizontal) {
      events.push(VERTICAL_DIRECTION_CHANGE, HORIZONTAL_DIRECTION_CHANGE);
    } else {
      if (config.vertical) events.push(VERTICAL_DIRECTION_CHANGE);
      if (config.horizontal) events.push(HORIZONTAL_DIRECTION_CHANGE);
    }
  }
  if (config.bounds) events.push([IN_BOUNDS, config.bounds]);
  // if (config.viewport) events.push([IN_VIEWPORT, ???]);
  return events;
}

export function createHandler(
  event: MonitorEvent,
  config: ?Bounds,
  callback: ScrollStateHandler,
): (rect: ScrollRect, state: ScrollState) => ?ScrollStateHandler {
  return function getMonitorEventCallback(
    rect: ScrollRect,
    state: ScrollState,
  ): ?ScrollStateHandler {
    const {top, left, width, height} = rect;

    switch (event) {
      case VERTICAL_DIRECTION_CHANGE: {
        const verticalDirection = top < state.top ? UP : DOWN;
        if (verticalDirection === state.verticalDirection) {
          return null;
        } else {
          state.verticalDirection = verticalDirection;
          debug('VERTICAL_DIRECTION_CHANGE', verticalDirection);
          return callback;
        }
      }

      case HORIZONTAL_DIRECTION_CHANGE: {
        const horizontalDirection = left < state.left ? RIGHT : LEFT;
        if (horizontalDirection === state.horizontalDirection) {
          return null;
        } else {
          state.horizontalDirection = horizontalDirection;
          debug('HORIZONTAL_DIRECTION_CHANGE', horizontalDirection);
          return callback;
        }
      }

      case IN_BOUNDS: {
        if (!config) return null;
        const nowInBounds = inBounds(config, rect, state);
        if (state.inBounds !== nowInBounds) {
          state.inBounds = nowInBounds;
          debug('IN_BOUNDS', nowInBounds);
          return callback;
        }
        return null;
      }

      // case IN_VIEWPORT: {
      // }

      default: {
        return null;
      }
    }
  };
}

export function createHandlers(config, callback) {
  const eventHandlers = {};
  for (let eventName of eventsFromConfig(config)) {
    let eventConfig = null;
    if (Array.isArray(eventName)) [eventName, eventConfig] = eventName;
    debug('Creating handler for', eventName, 'with config', eventConfig);
    const handler = createHandler(eventName, eventConfig, callback);
    eventHandlers[eventName] = handler;
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
