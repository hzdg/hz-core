// @flow
export const DOWN = 'down';
export const UP = 'up';
export const LEFT = 'left';
export const RIGHT = 'right';

export const VERTICAL_DIRECTION_CHANGE = 'verticalDirectionChange'; // scrolling has changed vertical directions (up vs down)
export const HORIZONTAL_DIRECTION_CHANGE = 'horizontalDirectionChange'; // scrolling has changed horizontal directions (left vs right)
export const IN_BOUNDS = 'inBounds'; // Whether some bounds contains scroll position
export const IN_VIEWPORT = 'inViewport'; // Whether some part of a rect is now in the scrollable viewport

export type VerticalScrollDirection = typeof DOWN | typeof UP;

export type HorizontalScrollDirection = typeof LEFT | typeof RIGHT;

export type ScrollMonitorEvent =
  | typeof VERTICAL_DIRECTION_CHANGE
  | typeof HORIZONTAL_DIRECTION_CHANGE
  | typeof IN_BOUNDS
  | typeof IN_VIEWPORT;

export type ScrollMonitorEventState = {
  verticalDirection?: ?VerticalScrollDirection,
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
  threshold: ?(Number | Number[]),
};

export type ViewportChange = {
  target: Element,
  ratio: Number,
  inViewport: Boolean,
};

export type UpdatePayload = {
  rect?: ScrollRect,
  intersection?: ViewportChange,
};

export type ScrollMonitorEventConfig = {
  event: ScrollMonitorEvent,
  config: ?(BoundsConfig | ViewportConfig),
  update: ScrollMonitorChangeChecker,
};

export type ScrollMonitorState = ScrollState & ScrollMonitorEventState;

export type ScrollMonitorChangeChecker = (
  payload: UpdatePayload,
  scrollState: ScrollState,
  eventState: ScrollMonitorEventState,
) => ?boolean;

export type EventStateStore = {
  configs: ScrollMonitorEventConfig[],
  state: ScrollMonitorEventState,
};

export type ScrollMonitorConfig = {
  vertical: ?Boolean,
  horizontal: ?Boolean,
  direction: ?Boolean,
  viewport: ?(Boolean | Number | Number[]),
  bounds: ?BoundsConfig,
};

export type Observer = {
  next(value: any): void,
  error(error: Error): void,
  complete(): void,
};

export type ObserverSet = Set<Observer>;
