/* eslint-disable react/no-unused-prop-types */
import React, {Component} from 'react';
import {findDOMNode} from 'react-dom';
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

  state = {
    ...initialState,
    uid: uuid().slice(0, 8),
  };

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
    this.ref = null;
    this.el = null;
    this.scrollEl = null;
  }

  mounted = false;
  subscription = null;

  unsubscribe() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  subscribeIfNecessary() {
    if (!this.subscription && this.mounted && this.scrollEl) {
      const config = getObservableConfig(this.props, this.state.uid, this.el);
      this.subscription = ScrollState.create(this.scrollEl, config).subscribe(
        this.handleUpdate,
      );
    }
  }

  findScrollNode = ref => {
    if (ref && ref !== this.ref) {
      this.ref = ref;
      // eslint-disable-next-line react/no-find-dom-node
      this.el = findDOMNode(ref);
      this.scrollEl = getNearestScrollNode(this.el);
      this.unsubscribe();
      this.subscribeIfNecessary();
    }
  };

  handleUpdate = state => {
    if (this.mounted) this.setState(state);
  };

  render() {
    // We wrap our render prop in a ScrollTarget so we can get a ref
    // to the rendered node. This allows the render prop to return
    // fragments.
    return (
      <ScrollTarget ref={this.findScrollNode}>
        {this.props.children(this.state)}
      </ScrollTarget>
    );
  }
}

function ScrollTarget({children}) {
  return children;
}

// eslint-disable-next-line no-unused-vars
function getObservableConfig({children: _, ...props}, uid, el) {
  // eslint-disable-next-line eqeqeq
  if (props.viewport !== false && props.viewport != null) {
    props.viewport = {
      target: el,
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
