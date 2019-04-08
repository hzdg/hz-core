/* eslint-disable react/no-multi-comp, max-lines */
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import GestureCatcher, {
  GestureSensorConfig,
  SPACE,
  PAGE_UP,
  PAGE_DOWN,
  END,
  HOME,
  ARROW_LEFT,
  ARROW_UP,
  ARROW_RIGHT,
  ARROW_DOWN,
  KEY_DOWN,
  WHEEL,
  GestureState,
  GestureCatcherConfig,
  GestureCatcherProps,
  GestureCatcherRenderProps,
  GestureType,
} from '@hzcore/gesture-catcher';
import {ReactRefCallback} from '@hzcore/gesture-catcher/src/types';

const GESTURE_THRESHOLD = 50;
const GESTURING = 'GESTURING';
const CANCELED = 'CANCELED';
const LEFT = 'LEFT';
const RIGHT = 'RIGHT';
const UP = 'UP';
const DOWN = 'DOWN';

// Orientations
export const HORIZONTAL = 'horizontal';
export const VERTICAL = 'vertical';

// Pagination actions
export const NEXT = 'next';
export const PREVIOUS = 'previous';
export const FIRST = 'first';
export const LAST = 'last';

export type PageGestureProps = GestureCatcherProps & {
  orientation: typeof VERTICAL | typeof HORIZONTAL;
  children: (
    props: GestureCatcherRenderProps & {action: GestureAction | null},
  ) => React.ReactNode;
  onNext?: (state: PageGestureState) => void;
  onPrevious?: (state: PageGestureState) => void;
  onFirst?: (state: PageGestureState) => void;
  onLast?: (state: PageGestureState) => void;
};

export type GestureAction =
  | typeof NEXT
  | typeof PREVIOUS
  | typeof FIRST
  | typeof LAST;

export type PageGestureState = GestureState & {action: GestureAction | null};

export type Orientation = typeof VERTICAL | typeof HORIZONTAL;

export default class PageGesture extends Component<PageGestureProps> {
  static propTypes = {
    // eslint-disable-next-line react/require-default-props, react/no-typos
    children: PropTypes.func.isRequired,
    orientation: PropTypes.oneOf([VERTICAL, HORIZONTAL]),
    disabled: PropTypes.bool,
    passive: PropTypes.bool,
    preventDefault: PropTypes.bool,
    touch: GestureSensorConfig,
    mouse: GestureSensorConfig,
    wheel: GestureSensorConfig,
    keyboard: GestureSensorConfig,
    innerRef: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.shape({
        current: PropTypes.node,
      }),
    ]),
    onStart: PropTypes.func,
    onMove: PropTypes.func,
    onEnd: PropTypes.func,
    onNext: PropTypes.func,
    onPrevious: PropTypes.func,
    onFirst: PropTypes.func,
    onLast: PropTypes.func,
  };

  static defaultProps = {
    orientation: HORIZONTAL,
    disabled: false,
    passive: false,
    preventDefault: false,
    touch: void 0,
    mouse: void 0,
    wheel: void 0,
    keyboard: void 0,
    innerRef: void 0,
    onStart: void 0,
    onMove: void 0,
    onEnd: void 0,
    onNext: void 0,
    onPrevious: void 0,
    onFirst: void 0,
    onLast: void 0,
  };

  static VERTICAL = VERTICAL;
  static HORIZONTAL = HORIZONTAL;
  static NEXT = NEXT;
  static PREVIOUS = PREVIOUS;
  static FIRST = FIRST;
  static LAST = LAST;

  get action(): GestureAction | null {
    switch (this.props.orientation) {
      case HORIZONTAL: {
        switch (this.gestureState) {
          case LEFT:
          case ARROW_RIGHT:
            return NEXT;
          case RIGHT:
          case ARROW_LEFT:
            return PREVIOUS;
          case END:
            return LAST;
          case HOME:
            return FIRST;
        }
        break;
      }
      case VERTICAL: {
        switch (this.gestureState) {
          case UP:
          case ARROW_DOWN:
          case PAGE_DOWN:
          case SPACE:
            return NEXT;
          case DOWN:
          case ARROW_UP:
          case PAGE_UP:
            return PREVIOUS;
          case END:
            return LAST;
          case HOME:
            return FIRST;
        }
        break;
      }
    }
    return null;
  }

  gestureState:
    | GestureState
    | typeof GESTURING
    | typeof CANCELED
    | string
    | null = null;
  prevGestureState:
    | GestureState
    | typeof GESTURING
    | typeof CANCELED
    | string
    | null = null;
  prevOrientation: Orientation | null = null;
  prevDelta: number = 0;

  dispatchAction(gestureProps: GestureState) {
    const {onNext, onPrevious, onFirst, onLast} = this.props;
    const state: PageGestureState = {
      ...gestureProps,
      action: this.action,
    };
    switch (this.action) {
      case NEXT:
        if (typeof onNext === 'function') onNext(state);
        break;
      case PREVIOUS:
        if (typeof onPrevious === 'function') onPrevious(state);
        break;
      case FIRST:
        if (typeof onFirst === 'function') onFirst(state);
        break;
      case LAST:
        if (typeof onLast === 'function') onLast(state);
        break;
    }
    this.prevGestureState = null;
    this.prevDelta = 0;
  }

  handleGestureEnd = (gestureProps: GestureState) => {
    const {key} = gestureProps;
    this.gestureState = this.prevGestureState || key || CANCELED;
    this.dispatchAction(gestureProps);
    if (typeof this.props.onEnd === 'function') {
      this.props.onEnd(gestureProps);
    }
  };

  handleGestureMove = (gestureProps: GestureState) => {
    const {type, key, repeat, xDelta, yDelta} = gestureProps;
    this.gestureState = GESTURING;

    if (type === KEY_DOWN && repeat) {
      this.gestureState = key;
      return this.dispatchAction(gestureProps);
    }

    const threshold = getThreshold(type, this.props);

    const {orientation} = this.props;
    const hDelta = Math.abs(xDelta);
    const vDelta = Math.abs(yDelta);
    const direction =
      orientation === VERTICAL
        ? yDelta < 0
          ? UP
          : DOWN
        : xDelta < 0
        ? LEFT
        : RIGHT;
    let state = null;
    let delta;
    if (orientation === this.prevOrientation) {
      // Orientation has not changed, so compare to previous state
      // to determine if direction has changed.
      switch (orientation) {
        case VERTICAL:
          delta = yDelta;
          switch (direction) {
            case DOWN:
              state =
                yDelta < this.prevDelta ||
                (this.prevDelta < 0 && vDelta < threshold)
                  ? CANCELED
                  : DOWN;
              break;
            case UP:
              state =
                yDelta > this.prevDelta ||
                (this.prevDelta > 0 && vDelta < threshold)
                  ? CANCELED
                  : UP;
              break;
          }
          break;
        case HORIZONTAL:
          delta = xDelta;
          switch (direction) {
            case RIGHT:
              state =
                xDelta < this.prevDelta ||
                (this.prevDelta < 0 && hDelta < threshold)
                  ? CANCELED
                  : RIGHT;
              break;
            case LEFT:
              state =
                xDelta > this.prevDelta ||
                (this.prevDelta > 0 && hDelta < threshold)
                  ? CANCELED
                  : LEFT;
              break;
          }
          break;
      }
    } else {
      // Orientation has changed, so previous state doesn't matter.
      switch (orientation) {
        case VERTICAL:
          delta = yDelta;
          state = vDelta >= threshold ? direction : CANCELED;
          break;
        case HORIZONTAL:
          delta = xDelta;
          state = hDelta >= threshold ? direction : CANCELED;
          break;
      }
    }
    delta = delta || 0;
    this.prevOrientation = orientation;
    this.prevGestureState = Math.abs(delta) >= threshold ? state : CANCELED;
    if (this.prevGestureState !== CANCELED) this.prevDelta = delta;
    if (typeof this.props.onMove === 'function') {
      this.props.onMove(gestureProps);
    }
  };

  renderGesture = (gestureProps: GestureCatcherRenderProps) => {
    const {children} = this.props;
    return children({
      ...gestureProps,
      action: this.action,
    });
  };

  render() {
    const config = getGestureConfig(this.props);
    return (
      <GestureCatcher
        {...config}
        onStart={this.props.onStart}
        onMove={this.handleGestureMove}
        onEnd={this.handleGestureEnd}
      >
        {this.renderGesture}
      </GestureCatcher>
    );
  }
}

function getThreshold(type: GestureType | null, props: PageGestureProps) {
  switch (type) {
    case WHEEL:
      return (
        (typeof props.wheel === 'object' && props.wheel.threshold) ||
        GESTURE_THRESHOLD
      );
    default:
      return GESTURE_THRESHOLD;
  }
}

function getGestureConfig(props: PageGestureProps): GestureCatcherConfig {
  const {
    orientation,
    disabled,
    innerRef,
    passive,
    preventDefault,
    keyboard,
    mouse,
    touch,
    wheel,
  } = props;
  const config = {
    orientation,
    disabled,
    innerRef,
    passive,
    preventDefault,
    horizontal: orientation === HORIZONTAL,
    vertical: orientation === VERTICAL,
  };
  if (keyboard || mouse || touch || wheel) {
    return {...config, keyboard, mouse, touch, wheel};
  } else {
    return config;
  }
}
