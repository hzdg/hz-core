/* eslint-disable react/no-multi-comp, no-duplicate-imports */
// @flow
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import GestureCatcher, {
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
} from '@hzcore/gesture-catcher';

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

import type {Node as ReactNode} from 'react';
import type {GestureState} from '@hzcore/gesture-catcher';

type PageGestureProps = {
  children: (state: PageGestureState) => ReactNode,
  orientation: typeof VERTICAL | typeof HORIZONTAL,
  disabled?: ?boolean,
  preventDefault?: ?boolean,
  gestureRef?: any,
  onNext?: ?(state: PageGestureState) => void,
  onPrevious?: ?(state: PageGestureState) => void,
  onFirst?: ?(state: PageGestureState) => void,
  onLast?: ?(state: PageGestureState) => void,
};

export type GestureAction =
  | typeof NEXT
  | typeof PREVIOUS
  | typeof FIRST
  | typeof LAST;

export type PageGestureState = GestureState & {action: GestureAction};

type Orientation = typeof VERTICAL | typeof HORIZONTAL;

export default class PageGesture extends Component<PageGestureProps> {
  static propTypes = {
    // eslint-disable-next-line react/require-default-props, react/no-typos
    children: PropTypes.func.isRequired,
    orientation: PropTypes.oneOf([VERTICAL, HORIZONTAL]),
    disabled: PropTypes.bool,
    preventDefault: PropTypes.bool,
    gestureRef: PropTypes.any,
    onNext: PropTypes.func,
    onPrevious: PropTypes.func,
    onFirst: PropTypes.func,
    onLast: PropTypes.func,
  };

  static defaultProps = {
    orientation: HORIZONTAL,
    disabled: false,
    preventDefault: false,
    gestureRef: void 0,
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

  get action(): ?GestureAction {
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

  gestureState: ?GestureAction = null;
  prevGestureState: ?GestureAction = null;
  prevOrientation: ?Orientation = null;
  prevDelta: number = 0;

  dispatchAction(gestureProps: GestureState) {
    const {onNext, onPrevious, onFirst, onLast} = this.props;
    const state = {...gestureProps, action: this.action};
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
  };

  handleGestureMove = (gestureProps: GestureState) => {
    const {type, key, repeat, xDelta, yDelta} = gestureProps;
    this.gestureState = GESTURING;

    if (type === KEY_DOWN && repeat) {
      this.gestureState = key;
      return this.dispatchAction(gestureProps);
    }

    const {orientation} = this.props;
    const hDelta = Math.abs(xDelta);
    const vDelta = Math.abs(yDelta);
    const direction =
      orientation === VERTICAL
        ? yDelta < 0 ? UP : DOWN
        : xDelta < 0 ? LEFT : RIGHT;
    let state;
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
                (this.prevDelta < 0 && vDelta < GESTURE_THRESHOLD)
                  ? CANCELED
                  : DOWN;
              break;
            case UP:
              state =
                yDelta > this.prevDelta ||
                (this.prevDelta > 0 && vDelta < GESTURE_THRESHOLD)
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
                (this.prevDelta < 0 && hDelta < GESTURE_THRESHOLD)
                  ? CANCELED
                  : RIGHT;
              break;
            case LEFT:
              state =
                xDelta > this.prevDelta ||
                (this.prevDelta > 0 && hDelta < GESTURE_THRESHOLD)
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
          state = vDelta > GESTURE_THRESHOLD ? direction : CANCELED;
          break;
        case HORIZONTAL:
          delta = xDelta;
          state = hDelta > GESTURE_THRESHOLD ? direction : CANCELED;
          break;
      }
    }
    delta = delta || 0;
    this.prevOrientation = orientation;
    this.prevGestureState =
      Math.abs(delta) > GESTURE_THRESHOLD ? state : CANCELED;
    if (this.prevGestureState !== CANCELED) this.prevDelta = delta;
  };

  renderGesture = (gestureProps: GestureState) => {
    const {children} = this.props;
    return children({...gestureProps, action: this.action});
  };

  render() {
    const {orientation, disabled, preventDefault, gestureRef} = this.props;
    return (
      <GestureCatcher
        disabled={disabled}
        preventDefault={preventDefault}
        horizontal={orientation === HORIZONTAL}
        vertical={orientation === VERTICAL}
        gestureRef={gestureRef}
        onMove={this.handleGestureMove}
        onEnd={this.handleGestureEnd}
      >
        {this.renderGesture}
      </GestureCatcher>
    );
  }
}
