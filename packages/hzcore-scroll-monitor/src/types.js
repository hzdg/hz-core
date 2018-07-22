// @flow
import type {Node as ReactNode} from 'react';

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
  target: HTMLElement,
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
};

export type ScrollMonitorEventConfig = {
  event: ScrollMonitorEvent,
  config: ?(BoundsConfig | ViewportConfig),
  shouldUpdate: ScrollMonitorChangeChecker,
};

export type ScrollMonitorState = ScrollState & ScrollMonitorEventState;

export type ScrollMonitorProps = {
  children: (state: ScrollMonitorState) => ReactNode,
  vertical: ?boolean,
  horizontal: ?boolean,
  direction: ?boolean,
  viewport: ?(boolean | number | number[]),
  bounds: ?BoundsConfig,
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
  viewport?: ?ViewportConfig,
  bounds?: ?BoundsConfig,
  uid: string,
};

export type Observer = {
  next(value: any): void,
  error(error: Error): void,
  complete(): void,
};

export type ObserverSet = Set<Observer>;
