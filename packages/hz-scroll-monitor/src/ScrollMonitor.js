/* eslint-disable react/no-unused-prop-types */
import React, {Component} from 'react';
import {findDOMNode} from 'react-dom';
import PropTypes from 'prop-types';
import {register} from './registrar';

const scrollMonitorConfigTypes = {
  children: PropTypes.func.isRequired,
  vertical: PropTypes.bool,
  horizontal: PropTypes.bool,
  direction: PropTypes.bool,
  viewport: PropTypes.bool,
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
    this.registerIfNecessary();
  }

  componentWillReceiveProps(nextProps) {
    let shouldReregister = configChanged(this.props, nextProps);
    if (!shouldReregister && nextProps.bounds) {
      shouldReregister = boundsChanged(this.props.bounds, nextProps.bounds);
    }
    if (shouldReregister) {
      this.unregister();
      this.registerIfNecessary();
    }
  }

  componentWillUnmount() {
    this.mounted = false;
    this.unregister();
    this.ref = null;
    this.el = null;
    this.scrollEl = null;
  }

  mounted = false;
  registration = null;

  unregister() {
    if (this.registration) {
      this.registration.unregister();
      this.registration = null;
    }
  }

  registerIfNecessary() {
    if (!this.registration && this.mounted && this.scrollEl) {
      this.registration = register(
        this.scrollEl,
        getRegistrationProps(this.props, this.el),
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
      this.unregister();
      this.registerIfNecessary();
    }
  };

  handleUpdate = state => {
    if (this.mounted) this.setState(state);
  };

  render() {
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
function getRegistrationProps({children: _, ...props}, el) {
  // eslint-disable-next-line eqeqeq
  if (props.viewport !== false && props.viewport != null) {
    props.viewport = {
      target: el,
      threshold: props.viewport === true ? 0 : props.viewport,
    };
  }
  return props;
}

function getNearestScrollNode(node) {
  if (!(node instanceof HTMLElement)) return null;

  const {overflowX, overflowY} = window.getComputedStyle(node);
  if (overflowX === 'scroll' || overflowY === 'scroll') return node;

  return getNearestScrollNode(node.parentNode) || document;
}
