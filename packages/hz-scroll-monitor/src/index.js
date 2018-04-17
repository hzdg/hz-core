// @flow
/* eslint-disable no-duplicate-imports, react/no-unused-prop-types */
import {Component} from 'react';
import invariant from 'invariant';
import PropTypes from 'prop-types';
import uuid from 'uuid/v1';
import ScrollState from './ScrollState';

import {UP, RIGHT, DOWN, LEFT} from './types';

import type {
  ScrollMonitorConfig,
  ScrollMonitorProps,
  ScrollMonitorState,
} from './types';

// Uncomment to enable debugging.
// TODO: Babel plugin to DCE debug statements in production.
// require('debug').enable('ScrollMonitor:*');
// require('debug').enable('ScrollMonitor:uid*');
// require('debug').enable('ScrollMonitor:scroll');
// require('debug').enable('ScrollMonitor:viewport');

export const ScrollDirection = {UP, RIGHT, DOWN, LEFT};

const scrollMonitorPropTypes = {
  children: PropTypes.func.isRequired,
  vertical: PropTypes.bool,
  horizontal: PropTypes.bool,
  direction: PropTypes.bool,
  viewport: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.number,
    PropTypes.arrayOf(PropTypes.number),
  ]),
  bounds: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({
      top: PropTypes.number,
      right: PropTypes.number,
      bottom: PropTypes.number,
      left: PropTypes.number,
    }),
  ]),
};

const defaultScrollMonitorConfig = {
  vertical: false,
  horizontal: false,
  direction: false,
  viewport: false,
  bounds: null,
};

const initialState = {
  top: null,
  left: null,
  width: null,
  height: null,
  lastTop: null,
  lastLeft: null,
  lastWidth: null,
  lastHeight: null,
  horizontalDirection: null,
  verticalDirection: null,
};

const keyNotEqual = (a: any, b: any) => k => a[k] !== b[k];

const CONFIG_KEYS = ['vertical', 'horizontal', 'direction', 'viewport'];
const configChanged = (a, b) => CONFIG_KEYS.some(keyNotEqual(a, b));

const BOUNDS_KEYS = ['top', 'right', 'bottom', 'left'];
const boundsChanged = (a, b) => BOUNDS_KEYS.some(keyNotEqual(a, b));

export default class ScrollMonitor extends Component<
  ScrollMonitorProps,
  ScrollMonitorState,
> {
  static propTypes = scrollMonitorPropTypes;
  static defaultProps = defaultScrollMonitorConfig;

  state = {...initialState};

  componentDidMount() {
    this.mounted = true;
    this.subscribeIfNecessary();
  }

  componentWillReceiveProps(nextProps: ScrollMonitorProps) {
    let shouldReregister = configChanged(this.props, nextProps);
    if (!shouldReregister && nextProps.bounds) {
      shouldReregister = boundsChanged(this.props.bounds, nextProps.bounds);
    }
    if (shouldReregister) {
      this.unsubscribe();
      this.subscribeIfNecessary();
    }
  }

  componentWillUnmount() {
    this.mounted = false;
    this.unsubscribe();
    this.node = null;
    this.scrollNode = null;
  }

  uid: string = uuid().slice(0, 8);
  node: ?HTMLElement = null;
  scrollNode: ?(HTMLElement | Document) = null;
  mounted = false;
  subscription: any = null;

  unsubscribe() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  subscribeIfNecessary() {
    if (!this.subscription && this.mounted && this.scrollNode && this.node) {
      this.subscription = ScrollState.create(
        this.scrollNode,
        getObservableConfig(this.props, this.uid, this.node),
      ).subscribe(this.handleUpdate);
    }
  }

  findScrollNode = (node: ?Element) => {
    invariant(
      node === null || node instanceof HTMLElement,
      `Expected an HTMLElement node, but got ${((node: any): string)}.`,
    );
    if (node && node !== this.node) {
      this.node = node;
      this.scrollNode = getNearestScrollNode(this.node);
      this.unsubscribe();
      this.subscribeIfNecessary();
    }
  };

  handleUpdate = (state: ScrollMonitorState) => {
    if (this.mounted) this.setState(state);
  };

  render() {
    return this.props.children({
      ...this.state,
      uid: this.uid,
      scrollRef: this.findScrollNode,
    });
  }
}

function getObservableConfig(
  props: ScrollMonitorProps,
  uid: string,
  node: HTMLElement,
): ScrollMonitorConfig {
  const config: ScrollMonitorConfig = {
    vertical: props.vertical,
    horizontal: props.horizontal,
    direction: props.direction,
    bounds: props.bounds,
    uid,
  };
  // eslint-disable-next-line eqeqeq
  if (
    props.viewport === true ||
    typeof props.viewport === 'number' ||
    Array.isArray(props.viewport)
  ) {
    config.viewport = {
      target: node,
      threshold: props.viewport === true ? 0 : props.viewport,
    };
  }
  return config;
}

function getNearestScrollNode(node): ?(HTMLElement | Document) {
  if (!(node instanceof HTMLElement)) return null;

  const {overflowX, overflowY} = window.getComputedStyle(node);
  if (overflowX === 'scroll' || overflowY === 'scroll') return node;

  return getNearestScrollNode(node.parentNode) || document;
}
