import React, {PureComponent, useState, useEffect} from 'react';

import {throttle} from './utils';

import {Props, State} from './types';

export * from './types';

const events = new Set();
const onResize = (): void => events.forEach(fn => fn());
const isClient = typeof window !== undefined || typeof window !== 'undefined';

const subscriber = {
  subscribe: (handler: () => void) => {
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
  initialWidth: number = 0,
  initialHeight: number = 0,
): State | undefined => {
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
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  return size;
};

class WindowsizeMonitor extends PureComponent<Props, State> {
  state = {
    width: 0,
    height: 0,
  };

  componentDidMount(): void {
    // we need this for static site generators to not complain about
    // undefined window
    if (typeof window !== undefined) {
      this.updateDimensions();
      this.subscription = subscriber.subscribe(this.updateDimensions);
    }
  }

  componentWillUnmount(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  getDimensions(): State {
    const width = window.innerWidth;
    const height = window.innerHeight;
    return {width, height};
  }

  subscription: null | {unsubscribe: () => void} = null;

  updateDimensions = () => {
    this.setState(this.getDimensions());
  };

  render(): JSX.Element {
    return this.props.children({
      ...this.state,
    });
  }
}

export default WindowsizeMonitor;
