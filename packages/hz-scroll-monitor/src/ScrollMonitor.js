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
  bounds: PropTypes.shape({
    top: PropTypes.number,
    right: PropTypes.number,
    bottom: PropTypes.number,
    left: PropTypes.number,
  }),
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

export default class ScrollMonitor extends Component {
  static propTypes = scrollMonitorConfigTypes;
  static defaultProps = defaultScrollMonitorConfig;

  state = {...initialState};

  componentDidMount() {
    this.mounted = true;
    this.registerIfNecessary();
  }

  // componentWillReceiveProps() {
    // TODO: Determine if re-registration is necessary.
    // this.unregister();
    // this.registerIfNecessary();
  // }

  componentWillUnmount() {
    this.mounted = false;
    this.unregister();
    this.ref = null;
    this.el = null;
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
    if (!this.registration && this.el) {
      this.registration = register(this.el, this.props, this.handleUpdate);
    }
  }

  findScrollNode = ref => {
    if (ref && ref !== this.ref) {
      this.ref = ref;
      // eslint-disable-next-line react/no-find-dom-node
      this.el = getNearestScrollNode(findDOMNode(ref));
      this.unregister();
      this.registerIfNecessary();
    }
  };

  handleUpdate = state => {
    if (this.mounted) this.setState(state);
  };

  render() {
    return React.cloneElement(this.props.children(this.state), {
      ref: this.findScrollNode,
    });
  }
}

function getNearestScrollNode(node) {
  if (!(node instanceof HTMLElement)) return null;

  const {overflowX, overflowY} = window.getComputedStyle(node);
  if (overflowX === 'scroll' || overflowY === 'scroll') return node;

  return getNearestScrollNode(node.parentNode) || document;
}
