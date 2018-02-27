import React, {Component} from 'react';
import {findDOMNode} from 'react-dom';
import PropTypes from 'prop-types';
import {eventsFromConfig, handlerForMonitorEvent} from './events';
import {getScrollRect, getNearestScrollNode} from './utils';

export const scrollProviderContextTypes = {
  scrollProvider: PropTypes.shape({
    register: PropTypes.func.isRequired,
  }).isRequired,
};

export default class ScrollProvider extends Component {
  static childContextTypes = scrollProviderContextTypes;
  static propTypes = {
    children: PropTypes.node,
  };
  static defaultProps = {
    children: undefined,
  };

  getChildContext() {
    return {
      scrollProvider: {
        register: this.register,
      },
    };
  }

  componentDidMount() {
    this.startMonitoringIfNecessary();
  }

  componentWillUnmount() {
    this.stopMonitoring();
    this.registrar = {};
    this.ref = null;
    this.el = null;
  }

  startMonitoring() {
    if (!this.scrollHandler && this.el) {
      this.scrollHandler = createScrollHandler(this.registrar, this.el);
    }
  }

  stopMonitoring() {
    if (this.scrollHandler) {
      this.scrollHandler.destroy();
      this.scrollHandler = null;
    }
  }

  startMonitoringIfNecessary() {
    if (Object.keys(this.registrar).length && !this.scrollHandler) {
      this.startMonitoring();
    }
  }

  stopMonitoringIfPossible() {
    if (!Object.keys(this.registrar).length && this.scrollHandler) {
      this.stopMonitoring();
    }
  }

  registrar = {};

  register = (config, callback) => {
    for (const event of eventsFromConfig(config)) {
      const registrations = this.registrar[event] || new Map();
      const registration = {
        unregister() {
          registrations.delete(registration);
          if (!registrations.size) {
            delete this.registrar[event];
          }
          this.stopMonitoringIfPossible();
        },
      };

      registrations.set(registration, handlerForMonitorEvent(event, callback));
      this.registrar[event] = registrations;

      this.startMonitoringIfNecessary();
      return registration;
    }
  };

  findScrollNode = ref => {
    if (ref && ref !== this.ref) {
      this.ref = ref;
      // eslint-disable-next-line react/no-find-dom-node
      this.el = getNearestScrollNode(findDOMNode(ref));
      this.stopMonitoring();
      this.startMonitoringIfNecessary();
    }
  };

  render() {
    return React.cloneElement(this.props.children, {ref: this.findScrollNode});
  }
}

function createScrollHandler(registrar, element) {
  const scrollState = {};
  const callbacksToCall = new Set();
  let updatePending = false;

  function handleScroll(scrollEvent) {
    const rect = getScrollRect(scrollEvent);

    for (const event in registrar) {
      registrar[event].forEach(callbackGetter => {
        const callback = callbackGetter(rect, scrollState);
        if (callback) callbacksToCall.add(callback);
      });
    }

    scrollState.lastTop = scrollState.top;
    scrollState.lastLeft = scrollState.left;
    scrollState.lastWidth = scrollState.width;
    scrollState.lastHeight = scrollState.height;
    scrollState.top = rect.top;
    scrollState.left = rect.left;
    scrollState.width = rect.width;
    scrollState.height = rect.height;

    if (!updatePending) {
      updatePending = window.requestAnimationFrame(() => {
        updatePending = false;
        for (const callback of callbacksToCall) {
          callback(scrollState); // eslint-disable-line callback-return
        }
        callbacksToCall.clear();
      });
    }
  }

  element.addEventListener('scroll', handleScroll);

  return {
    destroy() {
      element.removeEventListener('scroll', handleScroll);
      window.cancelAnimationFrame(updatePending);
    },
  };
}
