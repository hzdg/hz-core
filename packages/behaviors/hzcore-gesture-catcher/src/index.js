// @flow
/* eslint-disable no-duplicate-imports */
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import shallowEqual from 'shallowequal';
import GestureObservable from './GestureObservable';
import {CONFIG_SHAPE} from './types';

export {
  SPACE,
  PAGE_UP,
  PAGE_DOWN,
  END,
  HOME,
  ARROW_LEFT,
  ARROW_UP,
  ARROW_RIGHT,
  ARROW_DOWN,
  WHEEL,
  MOUSE_DOWN,
  MOUSE_MOVE,
  MOUSE_UP,
  TOUCH_START,
  TOUCH_MOVE,
  TOUCH_END,
  KEY_DOWN,
  KEY_UP,
  GESTURE_END,
} from './types';

import type {
  GestureState,
  GestureCatcherState,
  GestureCatcherProps,
  GestureCatcherConfig,
} from './types';

export type {GestureState} from './types';

const gestureCatcherPropTypes = {
  gestureRef: PropTypes.shape({
    current: PropTypes.any,
  }),
  children: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  preventDefault: PropTypes.bool,
  keyboard: PropTypes.bool,
  mouse: PropTypes.bool,
  touch: PropTypes.bool,
  wheel: PropTypes.bool,
  onStart: PropTypes.func,
  onMove: PropTypes.func,
  onEnd: PropTypes.func,
};

const defaultGestureCatcherProps = {
  preventDefault: false,
  disabled: false,
  gestureRef: null,
  keyboard: void 0,
  mouse: void 0,
  touch: void 0,
  wheel: void 0,
  onStart: void 0,
  onMove: void 0,
  onEnd: void 0,
};

const initialState = {
  x: 0,
  y: 0,
  xDelta: 0,
  yDelta: 0,
  xInitial: 0,
  yInitial: 0,
  xPrev: 0,
  yPrev: 0,
  xVelocity: 0,
  yVelocity: 0,
  gesturing: false,
  key: null,
  repeat: null,
  type: null,
  gestureRef: (React: any).createRef(),
};

const configChanged = (a, b) =>
  CONFIG_SHAPE.some(k => !shallowEqual(a[k], b[k]));

export default class GestureCatcher extends Component<
  GestureCatcherProps,
  GestureCatcherState,
> {
  static propTypes = gestureCatcherPropTypes;
  static defaultProps = defaultGestureCatcherProps;
  static getDerivedStateFromProps = (
    props: GestureCatcherProps,
    state: GestureCatcherState,
  ) => {
    if (props.gestureRef && props.gestureRef !== state.gestureRef) {
      return {gestureRef: props.gestureRef};
    }
    return null;
  };

  state: GestureCatcherState = {...initialState};

  componentDidMount() {
    this.mounted = true;
    this.subscribeIfNecessary();
  }

  componentDidUpdate(
    prevProps: GestureCatcherProps,
    prevState: GestureCatcherState,
  ) {
    if (
      prevState.gestureRef !== this.state.gestureRef ||
      configChanged(prevProps, this.props)
    ) {
      this.unsubscribe();
      this.subscribeIfNecessary();
    }
  }

  componentWillUnmount() {
    this.mounted = false;
    this.unsubscribe();
  }

  mounted: boolean = false;
  subscription: any = null;
  updateScheduled: boolean | AnimationFrameID = false;
  nextState: ?GestureState;

  unsubscribe() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  subscribeIfNecessary() {
    if (!this.subscription && this.mounted && !this.props.disabled) {
      const node = getNode(this.state.gestureRef.current);
      if (node) {
        const config = getObservableConfig(this.props);
        this.subscription = GestureObservable.create(
          node,
          config,
          initialState,
        ).subscribe(this.handleUpdate);
      }
    }
  }

  updateNow = () => {
    this.updateScheduled = false;
    if (this.mounted) {
      const nextState = {...this.nextState};
      this.setState(({gesturing}, {onStart, onMove, onEnd}) => {
        if (typeof onStart === 'function' && !gesturing && nextState.gesturing)
          onStart(nextState);
        if (typeof onEnd === 'function' && gesturing && !nextState.gesturing)
          onEnd(nextState);
        if (typeof onMove === 'function' && gesturing && nextState.gesturing)
          onMove(nextState);
        return nextState;
      });
    }
  };

  handleUpdate = (state: GestureState) => {
    this.nextState = state;
    if (!this.updateScheduled) {
      this.updateScheduled = requestAnimationFrame(this.updateNow);
    }
  };

  render() {
    const {children} = this.props;
    return children(this.state);
  }
}

function getNode(node) {
  ({node = node.element || node} = node);
  return node;
}

function getObservableConfig(props: GestureCatcherProps): GestureCatcherConfig {
  const {preventDefault, keyboard, mouse, touch, wheel} = props;
  if (keyboard || mouse || touch || wheel) {
    return {
      preventDefault,
      keyboard,
      mouse,
      touch,
      wheel,
    };
  } else {
    return {preventDefault};
  }
}
