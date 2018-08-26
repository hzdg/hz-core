// @flow
import type {Node as ReactNode} from 'react';

export const DOWN = 'down';
export const UP = 'up';
export const LEFT = 'left';
export const RIGHT = 'right';

export const SCROLLING_CHANGE = 'scrollingChange'; // scrolling has changed (scrolling or not)
export const VERTICAL_DIRECTION_CHANGE = 'verticalDirectionChange'; // scrolling has changed vertical directions (up vs down)
export const HORIZONTAL_DIRECTION_CHANGE = 'horizontalDirectionChange'; // scrolling has changed horizontal directions (left vs right)
export const VERTICAL_POSITION_CHANGE = 'verticalPositionChange'; // scrolling has changed vertical directions (up vs down)
export const HORIZONTAL_POSITION_CHANGE = 'horizontalPositionChange'; // scrolling has changed horizontal directions (left vs right)
export const IN_BOUNDS = 'inBounds'; // Whether some bounds contains scroll position
export const IN_VIEWPORT = 'inViewport'; // Whether some part of a rect is now in the scrollable viewport

export const DIRECTION_PROPS = ['vertical', 'horizontal'];
export const SCROLL_PROPS = ['direction', 'position', 'bounds', 'scrolling'];
export const CONFIG_SHAPE = [...DIRECTION_PROPS, ...SCROLL_PROPS, 'viewport'];

export type VerticalScrollDirection = typeof DOWN | typeof UP;

export type HorizontalScrollDirection = typeof LEFT | typeof RIGHT;

export type ScrollMonitorEvent =
  | typeof SCROLLING_CHANGE
  | typeof VERTICAL_DIRECTION_CHANGE
  | typeof HORIZONTAL_DIRECTION_CHANGE
  | typeof IN_BOUNDS
  | typeof IN_VIEWPORT;

export type ScrollMonitorEventState = {
  scrolling?: ?boolean,
  verticalDirection?: ?VerticalScrollDirection,
  horizontalDirection?: ?HorizontalScrollDirection,
  inBounds?: ?(boolean | boolean[]),
  inViewport?: ?boolean,
  viewportRatio?: ?number,
  // TODO: figure out what info we actually need for viewport.
  // i.e., vertical offset (when 'below' vs. when 'above')
  // and horizontal offset (when 'right' vs when 'left')
};

export type ScrollRect = {
  top?: ?number,
  left?: ?number,
  width?: ?number,
  height?: ?number,
};

export type ScrollState = {
  lastTop?: ?number,
  lastLeft?: ?number,
  lastWidth?: ?number,
  lastHeight?: ?number,
  ...ScrollRect,
};

export type BoundsRect = {
  top: ?number,
  right: ?number,
  bottom: ?number,
  left: ?number,
};

export type BoundsConfig = BoundsRect | BoundsRect[];

export type ViewportConfig = {
  target: Node,
  threshold: ?(number | number[]),
};

export type ViewportChange = {
  target: HTMLElement,
  ratio: number,
  inViewport: boolean,
};

export type UpdatePayload = {
  rect?: ScrollRect,
  intersection?: ViewportChange,
  scrolling?: boolean,
};

export type ScrollMonitorEventConfig = {
  event: ScrollMonitorEvent,
  config: ?(BoundsConfig | ViewportConfig),
  shouldUpdate: ScrollMonitorChangeChecker,
  onUpdate?: ?ChangeHandler,
};

export type ScrollMonitorState = ScrollState & ScrollMonitorEventState;
export type ChangeHandler = (
  state: ScrollState & ScrollMonitorEventState,
) => void;


export type ScrollMonitorProps = {
  children: (state: ScrollMonitorState) => ReactNode,
  vertical: ?boolean,
  horizontal: ?boolean,
  direction: ?boolean,
  position: ?boolean,
  scrolling: ?boolean,
  viewport: ?(boolean | number | number[]),
  bounds: ?BoundsConfig,
  onStart: ?ChangeHandler,
  onChange: ?ChangeHandler,
  onEnd: ?ChangeHandler,
};

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
  vertical?: ?boolean,
  horizontal?: ?boolean,
  direction?: ?boolean,
  position?: ?boolean,
  scrolling?: ?boolean,
  viewport?: ?ViewportConfig,
  bounds?: ?BoundsConfig,
  onStart?: ?ChangeHandler,
  onChange?: ?ChangeHandler,
  onEnd?: ?ChangeHandler,
  uid: string,
};

export type Observer = {
  next(value: any): void,
  error(error: Error): void,
  complete(): void,
};

export type ObserverSet = Set<Observer>;

export type Subscription = {
  unsubscribe(): void,
};
