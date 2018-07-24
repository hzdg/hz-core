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

const configChanged = (a, b) =>
  CONFIG_SHAPE.some(k => !shallowEqual(a[k], b[k]));

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
    this.prevScrollRef = this.scrollRef.current;
  }

  componentDidUpdate(prevProps: ScrollMonitorProps) {
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

function getNode(node) {
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
