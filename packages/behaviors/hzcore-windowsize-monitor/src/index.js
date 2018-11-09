// @flow

/* eslint-disable no-duplicate-imports */
// eslint-disable-next-line no-unused-vars
import React, {PureComponent} from 'react';

import type {Props, State} from './types';

const events = new Set();
const onResize = () => events.forEach(fn => fn());

const subscriber = {
  subscribe: handler => {
    if (events.size === 0) {
      window.addEventListener('resize', onResize);
    }
    events.add(handler);
    const subscription = {
      unsubscribe: () => {
        events.delete(handler);
        if (events.size === 0) {
          window.removeEventListener('resize', onResize);
        }
      },
    };
    return subscription;
  },
};

class WindowsizeMonitor extends PureComponent<Props, State> {
  state = {
    width: 0,
    height: 0,
  };

  componentDidMount() {
    // we need this for static site generators to not complain about
    // undefined window
    if (typeof window !== undefined) {
      this.updateDimensions();
      this.subscription = subscriber.subscribe(this.updateDimensions);
    }
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  // eslint-disable-next-line
  getDimensions() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    return {width, height};
  }

  subscription: any = null;

  updateDimensions = () => {
    this.setState(this.getDimensions());
  };

  render() {
    return this.props.children({
      ...this.state,
    });
  }
}

export default WindowsizeMonitor;
