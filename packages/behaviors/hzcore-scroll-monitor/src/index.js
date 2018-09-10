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
  innerRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({
      current: PropTypes.node,
    }),
  ]),
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
  scrollRef: null,
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
  }

  componentDidUpdate(prevProps: ScrollMonitorProps) {
    if (configChanged(prevProps, this.props)) {
      this.unsubscribe();
      this.subscribeIfNecessary();
    }
  }

  componentWillUnmount() {
    this.mounted = false;
    this.unsubscribe();
  }

  uid: string = uuid().slice(0, 8);
  mounted: boolean = false;
  subscription: any = null;
  scrollRef = React.createRef();

  handleRef = (node: any) => {
    if (this.scrollRef.current !== node) {
      this.scrollRef.current = node;
      this.unsubscribe();
    }
    if (this.props.innerRef) {
      if (typeof this.props.innerRef === 'function') {
        this.props.innerRef(node);
      } else {
        this.props.innerRef.current = node;
      }
    }
    if (node) {
      this.subscribeIfNecessary();
    }
  };

  unsubscribe() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  subscribeIfNecessary() {
    if (!this.subscription && this.mounted && this.scrollRef.current) {
      const target = getNode(this.scrollRef.current);
      const scrollingElement = getNearestScrollNode(target);
      if (scrollingElement && target) {
        this.subscription = ScrollState.create(
          scrollingElement,
          getObservableConfig(this.props, this.uid, target),
        ).subscribe(this.handleUpdate);
      }
    }
  }

  handleUpdate = (state: ScrollMonitorState) => {
    if (this.mounted) this.setState(state);
  };

  render() {
    return this.props.children({
      ...this.state,
      scrollRef: this.handleRef,
      uid: this.uid,
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
