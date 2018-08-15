// @flow
/* eslint-disable no-duplicate-imports */
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import shallowEqual from 'shallowequal';
import GestureObservable from './GestureObservable';
import {CONFIG_SHAPE} from './types';

import type {
  GestureState,
  GestureCatcherState,
  GestureCatcherProps,
  GestureCatcherConfig,
} from './types';

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
  onStop: PropTypes.func,
};

// TODO: Make default config based on initial props,
// i.e., if none of the inputs are explicit, assume all or true,
// otherwise if any of them are explict, assume all others are false.
const defaultGestureCatcherConfig = {
  preventDefault: false,
  keyboard: true,
  mouse: true,
  touch: true,
  wheel: true,
};

const defaultGestureCatcherProps = {
  ...defaultGestureCatcherConfig,
  disabled: false,
  gestureRef: null,
  onStart: void 0,
  onMove: void 0,
  onStop: void 0,
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

  handleUpdate = (state: GestureState) => {
    // TODO: Use onStart/onStop/onMove cbs
    // if (this.mounted) this.setState(state);
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
  const config: GestureCatcherConfig = {
    preventDefault: props.preventDefault,
    keyboard: props.keyboard,
    mouse: props.mouse,
    touch: props.touch,
    wheel: props.wheel,
  };
  return config;
}
