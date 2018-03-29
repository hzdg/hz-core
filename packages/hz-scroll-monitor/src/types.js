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
  viewportRatio?: ?Number,
  // TODO: figure out what info we actually need for viewport.
  // i.e., vertical offset (when 'below' vs. when 'above')
  // and horizontal offset (when 'right' vs when 'left')
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

export type BoundsConfig = BoundsRect | ((state: ScrollState) => BoundsRect);

export type ViewportConfig = {
  target: Element,
  threshold: Number | Number[],
};

export type ViewportChange = {
  target: Element,
  ratio: Number,
  inViewport: Boolean,
};

export type UpdatePayload = {
  rect?: ScrollRect,
  intersections?: ViewportChange[],
};

export type ScrollMonitorEventConfig =
  | ScrollMonitorEvent
  | [ScrollMonitorEvent, BoundsConfig]
  | [ScrollMonitorEvent, ViewportConfig];

export type ScrollMonitorState = ScrollState & ScrollMonitorEventState;

export type ScrollMonitorStateHandler = (state: ScrollMonitorState) => void;

export type ScrollMonitorStateHandlerWrapper = (
  payload: UpdatePayload,
  scrollState: ScrollState,
  eventState: ScrollMonitorEventState,
) => ?ScrollMonitorStateHandler;

export type CallbackGetterConfig = [
  ScrollMonitorStateHandlerWrapper,
  ScrollMonitorEventState,
];

export type CallbackConfig = [
  ScrollMonitorStateHandler,
  ScrollMonitorEventState,
];

export type PendingCallbackMap = Map<CallbackGetterConfig, CallbackConfig>;

export type EventMap = {
  [event: string]: Set<[ScrollMonitorStateHandler, ScrollMonitorEventState]>,
};

export type ObserverMap = {
  [threshold: ?string]: IntersectionObserver,
};

export type RegistrationConfig = {
  vertical: ?Boolean,
  horizontal: ?Boolean,
  direction: ?Boolean,
  viewport: ?(Boolean | Number | Number[]),
  bounds: ?BoundsConfig,
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
  observers: ObserverMap,
};

export type ElementRegistrar = Map<Element, EventRegistrar>;
