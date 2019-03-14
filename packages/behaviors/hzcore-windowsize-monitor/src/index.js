// @flow

/* eslint-disable no-duplicate-imports */
// eslint-disable-next-line no-unused-vars
import React, {PureComponent, useState, useEffect} from 'react';

import {throttle} from './utils';

import type {Props, State} from './types';

const events = new Set();
const onResize = () => events.forEach(fn => fn());
const isClient = typeof window !== undefined;

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

export const useWindowSize = (
  options: {throttleMs?: number} = {},
  initialWidth: number = Infinity,
  initialHeight: number = Infinity,
): State => {
  const {throttleMs = 100} = options;

  const [size, setSize] = useState({
    width: isClient ? window.innerWidth : initialWidth,
    height: isClient ? window.innerHeight : initialHeight,
  });

  const handle = throttle(() => {
    setSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, throttleMs);

  useEffect(() => {
    const subscription = subscriber.subscribe(handle);
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return size;
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
