import {UP, DOWN, LEFT, RIGHT} from './ScrollDirection';

export const VERTICAL_DIRECTION_CHANGE = 'verticalDirectionChange'; // scrolling has changed vertical directions (up vs down)
export const HORIZONTAL_DIRECTION_CHANGE = 'horizontalDirectionChange'; // scrolling has changed horizontal directions (left vs right)
export const ENTER_VIEWPORT = 'enterViewport'; // some part of a rect is now in the scrollable viewport
export const EXIT_VIEWPORT = 'exitViewport'; // some part of a rect is not in the scrollable viewport
export const AREA_VISBLE = 'areaVisible'; // 'area' is some rect that contains scroll position
export const AREA_NOT_VISIBLE = 'areaNotVisible'; // 'area' is some rect that excludes scroll position

export function eventsFromConfig(config) {
  const events = [];
  if (config.direction) {
    if (!config.vertical && !config.horizontal) {
      events.push(VERTICAL_DIRECTION_CHANGE, HORIZONTAL_DIRECTION_CHANGE);
    } else {
      if (config.vertical) events.push(VERTICAL_DIRECTION_CHANGE);
      if (config.horizontal) events.push(HORIZONTAL_DIRECTION_CHANGE);
    }
  }
  if (config.viewport) events.push(ENTER_VIEWPORT, EXIT_VIEWPORT);
  if (config.area) events.push(AREA_VISBLE, AREA_NOT_VISIBLE);
  return events;
}

export function createHandler(event, callback) {
  return function getMonitorEventCallback(rect, state) {
    const {top, left, width, height} = rect;

    switch (event) {
      case VERTICAL_DIRECTION_CHANGE: {
        const verticalDirection = top < state.top ? UP : DOWN;
        if (verticalDirection === state.verticalDirection) {
          return null;
        } else {
          state.verticalDirection = verticalDirection;
          return callback;
        }
      }

      case HORIZONTAL_DIRECTION_CHANGE: {
        const horizontalDirection = left < state.left ? RIGHT : LEFT;
        if (horizontalDirection === state.horizontalDirection) {
          return null;
        } else {
          state.horizontalDirection = horizontalDirection;
          return callback;
        }
      }

      // case ENTER_VIEWPORT: {
      // }
      //
      // case EXIT_VIEWPORT: {
      // }
      //
      // case AREA_VISBLE: {
      // }
      //
      // case AREA_NOT_VISIBLE: {
      // }

      default: {
        return null;
      }
    }
  };
}
