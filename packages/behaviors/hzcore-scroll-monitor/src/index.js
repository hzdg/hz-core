// @flow
/* eslint-disable no-duplicate-imports, react/no-unused-prop-types */
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import shallowEqual from 'shallowequal';
import {uuid} from './utils';
import ScrollState from './ScrollState';

import {UP, RIGHT, DOWN, LEFT, CONFIG_SHAPE} from './types';

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
  position: PropTypes.bool,
  scrolling: PropTypes.bool,
  viewport: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.number,
    PropTypes.arrayOf(PropTypes.number),
  ]),
  bounds: PropTypes.oneOfType([
    PropTypes.shape({
      top: PropTypes.number,
      right: PropTypes.number,
      bottom: PropTypes.number,
      left: PropTypes.number,
    }),
    PropTypes.arrayOf(
      PropTypes.shape({
        top: PropTypes.number,
        right: PropTypes.number,
        bottom: PropTypes.number,
        left: PropTypes.number,
      }),
    ),
  ]),
  onStart: PropTypes.func,
  onChange: PropTypes.func,
  onEnd: PropTypes.func,
};

const defaultScrollMonitorConfig = {
  vertical: false,
  horizontal: false,
  direction: false,
  position: false,
  scrolling: false,
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
  scrolling: null,
};

const configChanged = (a, b) =>
  CONFIG_SHAPE.some(k => !shallowEqual(a[k], b[k]));

export default class ScrollMonitor extends Component<
  ScrollMonitorProps,
  ScrollMonitorState,
> {
  static propTypes = scrollMonitorPropTypes;
  static defaultProps = {
    ...defaultScrollMonitorConfig,
    onStart: void 0,
    onChange: void 0,
    onEnd: void 0,
  };

  state = {...initialState};

  componentDidMount() {
    this.mounted = true;
    this.subscribeIfNecessary();
    this.prevScrollRef = this.scrollRef.current;
  }

  componentDidUpdate(
    prevProps: ScrollMonitorProps,
    prevState: ScrollMonitorState,
  ) {
    if (
      this.prevScrollRef !== this.scrollRef.current ||
      configChanged(prevProps, this.props)
    ) {
      this.unsubscribe();
      this.subscribeIfNecessary();
      this.prevScrollRef = this.scrollRef.current;
    }
  }

  componentWillUnmount() {
    this.mounted = false;
    this.scrollRef = null;
    this.prevScrollRef = null;
    this.unsubscribe();
  }

  uid: string = uuid().slice(0, 8);
  mounted: boolean = false;
  subscription: any = null;
  scrollRef: any = React.createRef();
  prevScrollRef: any = null;

  unsubscribe() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  subscribeIfNecessary() {
    if (!this.subscription && this.mounted) {
      const node = getNearestScrollNode(this.scrollRef.current);
      if (node) {
        const config = getObservableConfig(
          this.props,
          this.uid,
          getNode(this.scrollRef.current),
        );
        this.subscription = ScrollState.create(node, config).subscribe(
          this.handleUpdate,
        );
      }
    }
  }

  handleUpdate = (state: ScrollMonitorState) => {
    if (this.mounted) this.setState(state);
  };

  render() {
    return this.props.children({
      ...this.state,
      uid: this.uid,
      scrollRef: this.scrollRef,
    });
  }
}

function getObservableConfig(
  {
    vertical,
    horizontal,
    direction,
    position,
    scrolling,
    viewport,
    bounds,
    onStart,
    onChange,
    onEnd,
  }: ScrollMonitorProps,
  uid: string,
  node: Node,
): ScrollMonitorConfig {
  const config: ScrollMonitorConfig = {
    vertical,
    horizontal,
    onStart,
    onChange,
    onEnd,
    uid,
  };

  if (direction || position || scrolling || bounds || viewport) {
    config.direction = direction;
    config.position = position;
    config.scrolling = scrolling;
    config.bounds = bounds;
    // eslint-disable-next-line eqeqeq
    if (
      viewport === true ||
      typeof viewport === 'number' ||
      Array.isArray(viewport)
    ) {
      config.viewport = {
        target: node,
        threshold: viewport === true ? 0 : viewport,
      };
    }
  } else {
    config.position = true;
  }
  return config;
}

function getNode(node: any): ?Node {
  ({node = node.element || node} = node);
  return node;
}

function getNearestScrollNode(node): ?(HTMLElement | Document) {
  node = getNode(node);
  if (node instanceof Document) return node;
  if (!(node instanceof HTMLElement)) return null;

  const {overflowX, overflowY} = window.getComputedStyle(node);
  if (overflowX === 'scroll' || overflowY === 'scroll') return node;

  return getNearestScrollNode(node.parentNode) || document;
}
