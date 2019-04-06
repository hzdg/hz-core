import React from 'react';

export type ReactRef<T = React.ElementType> = React.Ref<T>;
export type ReactRefObject<T = React.ElementType> = {
  current: React.Ref<T> | null;
};
export type ReactRefCallback<T = React.ElementType> = (
  node: React.Ref<T> | null,
) => void;
export type ReactRefProp<T = React.ElementType> =
  | ReactRefObject<T>
  | ReactRefCallback<T>;

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
  | typeof VERTICAL_POSITION_CHANGE
  | typeof HORIZONTAL_POSITION_CHANGE
  | typeof IN_BOUNDS
  | typeof IN_VIEWPORT;

export type ScrollMonitorEventState = {
  scrolling?: boolean | null;
  verticalDirection?: VerticalScrollDirection | null;
  horizontalDirection?: HorizontalScrollDirection | null;
  inBounds?: boolean | boolean[] | null;
  inViewport?: boolean | null;
  viewportRatio?: number | null;
  // TODO: figure out what info we actually need for viewport.
  // i.e., vertical offset (when 'below' vs. when 'above')
  // and horizontal offset (when 'right' vs when 'left')
};

export type ScrollRect = {
  top?: number | null;
  left?: number | null;
  width?: number | null;
  height?: number | null;
};

export type ScrollState = ScrollRect & {
  lastTop?: number | null;
  lastLeft?: number | null;
  lastWidth?: number | null;
  lastHeight?: number | null;
};

export type BoundsRect = {
  top: number | null;
  right: number | null;
  bottom: number | null;
  left: number | null;
};

export type BoundsConfig = BoundsRect | BoundsRect[];

export type ViewportConfig = {
  target: HTMLElement;
  threshold: number | number[] | null;
};

export type ViewportChange = {
  target: Element;
  ratio: number;
  inViewport: boolean;
};

export type UpdatePayload = {
  rect?: ScrollRect;
  intersection?: ViewportChange;
  scrolling?: boolean;
};

export type ScrollMonitorEventConfig = {
  event: ScrollMonitorEvent;
  config: BoundsConfig | ViewportConfig | null;
  shouldUpdate: ScrollMonitorChangeChecker;
  onUpdate?: ChangeHandler | null;
};

export type ChangeHandler = (
  state: ScrollState & ScrollMonitorEventState,
) => void;

export type ScrollMonitorState = ScrollState & ScrollMonitorEventState;

export type ScrollMonitorProps = {
  children: (
    state: ScrollMonitorState & {scrollRef: ReactRefCallback; uid?: string},
  ) => React.ReactNode;
  innerRef: ReactRefProp | null;
  vertical: boolean | null;
  horizontal: boolean | null;
  direction: boolean | null;
  position: boolean | null;
  scrolling: boolean | null;
  viewport: boolean | number | number[] | null;
  bounds: BoundsConfig | null;
  onStart: ChangeHandler | null;
  onChange: ChangeHandler | null;
  onEnd: ChangeHandler | null;
};

export type ScrollMonitorDidChange = boolean | null | undefined;

export type ScrollMonitorChangeChecker = (
  payload: UpdatePayload,
  scrollState: ScrollState,
  eventState: ScrollMonitorEventState,
) => ScrollMonitorDidChange;

export type EventStateStore = {
  configs: ScrollMonitorEventConfig[];
  state: ScrollMonitorEventState;
};

export type ScrollMonitorConfig = {
  [key: string]:
    | ViewportConfig
    | BoundsConfig
    | ChangeHandler
    | ChangeHandler
    | ChangeHandler
    | string
    | boolean
    | null
    | undefined;
  vertical?: boolean | null;
  horizontal?: boolean | null;
  direction?: boolean | null;
  position?: boolean | null;
  scrolling?: boolean | null;
  viewport?: ViewportConfig | null;
  bounds?: BoundsConfig | null;
  onStart?: ChangeHandler | null;
  onChange?: ChangeHandler | null;
  onEnd?: ChangeHandler | null;
  uid: string;
};

export type Observer = {
  next(value: any): void;
  error(error: Error): void;
  complete(): void;
};

export type ObserverSet = Set<Observer>;

export type Subscription = {
  unsubscribe(): void;
};

export function isViewportConfig(config: any): config is ViewportConfig {
  return config && config.target;
}

export function isBoundsConfig(config: any): config is BoundsConfig {
  if (Array.isArray(config)) {
    return config.every(
      (rect: any) => !Array.isArray(rect) && isBoundsConfig(rect),
    );
  }
  return (
    'top' in config ||
    'right' in config ||
    'bottom' in config ||
    'left' in config
  );
}
