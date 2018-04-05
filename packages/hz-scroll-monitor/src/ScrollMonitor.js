/* eslint-disable react/no-unused-prop-types */
import React, {Component} from 'react';
import invariant from 'invariant';
import PropTypes from 'prop-types';
import uuid from 'uuid/v1';
import ScrollState from './ScrollState';

const scrollMonitorConfigTypes = {
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

const keyNotEqual = (a, b) => k => a[k] !== b[k];

const CONFIG_KEYS = ['vertical', 'horizontal', 'direction', 'viewport'];
const configChanged = (a, b) => CONFIG_KEYS.some(keyNotEqual(a, b));

const BOUNDS_KEYS = ['top', 'right', 'bottom', 'left'];
const boundsChanged = (a, b) => BOUNDS_KEYS.some(keyNotEqual(a, b));

export default class ScrollMonitor extends Component {
  static propTypes = scrollMonitorConfigTypes;
  static defaultProps = defaultScrollMonitorConfig;

  state = {...initialState};

  componentDidMount() {
    this.mounted = true;
    this.subscribeIfNecessary();
  }

  componentWillReceiveProps(nextProps) {
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

  uid = uuid().slice(0, 8);
  node = null;
  scrollNode = null;
  mounted = false;
  subscription = null;

  unsubscribe() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  subscribeIfNecessary() {
    if (!this.subscription && this.mounted && this.scrollNode) {
      const config = getObservableConfig(this.props, this.uid, this.node);
      this.subscription = ScrollState.create(this.scrollNode, config).subscribe(
        this.handleUpdate,
      );
    }
  }

  findScrollNode = node => {
    invariant(
      node === null || node instanceof HTMLElement,
      `Expected an HTMLElement node, but got ${node}.`,
    );
    if (node && node !== this.node) {
      this.node = node;
      this.scrollNode = getNearestScrollNode(this.node);
      this.unsubscribe();
      this.subscribeIfNecessary();
    }
  };

  handleUpdate = state => {
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

// eslint-disable-next-line no-unused-vars
function getObservableConfig({children: _, ...props}, uid, node) {
  // eslint-disable-next-line eqeqeq
  if (props.viewport !== false && props.viewport != null) {
    props.viewport = {
      target: node,
      threshold: props.viewport === true ? 0 : props.viewport,
    };
  }
  return {...props, uid};
}

function getNearestScrollNode(node) {
  if (!(node instanceof HTMLElement)) return null;

  const {overflowX, overflowY} = window.getComputedStyle(node);
  if (overflowX === 'scroll' || overflowY === 'scroll') return node;

  return getNearestScrollNode(node.parentNode) || document;
}
