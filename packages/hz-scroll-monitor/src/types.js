// @flow
import {UP, DOWN, LEFT, RIGHT} from './ScrollDirection';
import {
  VERTICAL_DIRECTION_CHANGE,
  HORIZONTAL_DIRECTION_CHANGE,
  IN_BOUNDS,
  IN_VIEWPORT,
} from './ScrollMonitorEvent';

export type VeritcalScrollDirection = typeof DOWN | typeof UP;

export type HorizontalScrollDirection = typeof LEFT | typeof RIGHT;

export type ScrollMonitorEvent =
  | typeof VERTICAL_DIRECTION_CHANGE
  | typeof HORIZONTAL_DIRECTION_CHANGE
  | typeof IN_BOUNDS
  | typeof IN_VIEWPORT;

export type ScrollMonitorEventState = {
  verticalDirection?: ?VeritcalScrollDirection,
  horizontalDirection?: ?HorizontalScrollDirection,
  inBounds?: ?Boolean,
  inViewport?: ?Boolean,
};

export type ScrollRect = {
  top: Number,
  left: Number,
  width: Number,
  height: Number,
};

export type ScrollState = {
  lastTop: ?Number,
  lastLeft: ?Number,
  lastWidth: ?Number,
  lastHeight: ?Number,
  ...ScrollRect,
};

export type BoundsRect = {
  top: ?Number,
  right: ?Number,
  bottom: ?Number,
  left: ?Number,
};

export type Bounds = BoundsRect | ((state: ScrollState) => BoundsRect);

export type ScrollMonitorEventConfig =
  | ScrollMonitorEvent
  | [ScrollMonitorEvent, Bounds];

export type ScrollMonitorState = ScrollState & ScrollMonitorEventState;

export type ScrollMonitorStateHandler = (state: ScrollMonitorState) => void;

export type ScrollMonitorStateHandlerGetter = (
  rect: ScrollRect,
  scrollState: ScrollState,
  eventState: ScrollMonitorEventState,
) => ?ScrollMonitorStateHandler;

export type EventMap = {
  [event: string]: Set<[ScrollMonitorStateHandler, ScrollMonitorEventState]>,
};

export type RegistrationConfig = {
  vertical: ?Boolean,
  horizontal: ?Boolean,
  direction: ?Boolean,
  viewport: ?Boolean,
  bounds: ?Bounds,
};

export type Registration = {unregister(): void};

export type EventRegistrar = {
  register(
    config: RegistrationConfig,
    callback: ScrollMonitorStateHandler,
  ): Registration,
  destroy(): void,
  forceUpdate(): void,
  events: EventMap,
};

export type ElementRegistrar = Map<HTMLElement, EventRegistrar>;
