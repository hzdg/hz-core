import React, {
  PureComponent,
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {throttle} from './utils';

import {Props, State} from './types';

export * from './types';

export interface WindowSize {
  width: number;
  height: number;
}

export interface WindowSizeOptions {
  /**
   * How frequently window size updates are dispatched.
   * Default is `0`, meaning, every update is dispatched.
   */
  throttleMs?: number;
  /**
   * The initial window width. Used before a measurement has been taken.
   * Default is `0`.
   */
  initialWidth?: number;
  /**
   * The initial window height. Used before a measurement has been taken.
   * Default is `0`.
   */
  initialHeight?: number;
}

export interface WindowSizeMonitorProps {
  children: (windowSize: WindowSize) => JSX.Element;
}

const isClient = typeof window !== undefined && typeof window !== 'undefined';

const getWindowSize = ({
  initialWidth,
  initialHeight,
}: Required<WindowSizeOptions>): WindowSize => {
  if (isClient) return {width: window.innerWidth, height: window.innerHeight};
  return {width: initialWidth, height: initialHeight};
};

const windowSizeSubscribers = new Set();

const dispatchWindowSizeChange = (): void => {
  windowSizeSubscribers.forEach(cb => cb());
};

const subscribeToWindowSizeChange = (callback: () => void): (() => void) => {
  const shouldAddListener = !windowSizeSubscribers.size && isClient;
  windowSizeSubscribers.add(callback);
  if (shouldAddListener) {
    window.addEventListener('resize', dispatchWindowSizeChange);
  }
  return function unsubscribeFromWindowSizeChange() {
    windowSizeSubscribers.delete(callback);
    if (!windowSizeSubscribers.size && isClient) {
      window.removeEventListener('resize', dispatchWindowSizeChange);
    }
  };
};

function useWindowSizeOptions({
  throttleMs = 0,
  initialWidth = 0,
  initialHeight = 0,
}: WindowSizeOptions = {}): Required<WindowSizeOptions> {
  return useMemo(() => {
    return {throttleMs, initialWidth, initialHeight};
  }, [throttleMs, initialWidth, initialHeight]);
}

/**
 * `useWindowSize` is a React hook for components that care about
 * the window size. It can be used statefully or not.
 *
 * @see https://hz-core.netlify.com/use-windowsize
 */
function useWindowSize(
  /**
   * `handler` will receive a `WindowSize` object each time
   * the window size changes.
   */
  handler: (size: WindowSize) => void,
  /**
   * `options` for window size handling.
   */
  options?: WindowSizeOptions,
): void;
/**
 * `useWindowSize` is a React hook for components that care about
 * the window size. It can be used statefully or not.
 *
 * @see https://hz-core.netlify.com/use-windowsize
 */
function useWindowSize(
  /**
   * `options` for window size handling.
   */
  options?: WindowSizeOptions,
): WindowSize;
function useWindowSize(
  handlerOrOptions?: ((size: WindowSize) => void) | WindowSizeOptions,
  windowSizeOptions?: WindowSizeOptions,
): WindowSize | void {
  const changeHandler = useRef<((size: WindowSize) => void) | null>(null);
  if (typeof handlerOrOptions === 'function') {
    changeHandler.current = handlerOrOptions;
  } else {
    windowSizeOptions = handlerOrOptions;
  }

  const options = useWindowSizeOptions(windowSizeOptions);
  const [size, setSize] = useState<WindowSize>(() => getWindowSize(options));

  const handleSizeChange = useMemo(() => {
    /**
     * `handleSizeChange` will update the current change handler
     * with a new `WindowSize` whenever the window's size changes.
     */
    function handleSizeChange(): void {
      const cb = changeHandler.current;
      const size = getWindowSize(options);
      if (typeof cb === 'function') {
        cb(size);
      } else {
        setSize(size);
      }
    }
    return options.throttleMs
      ? throttle(handleSizeChange, options.throttleMs)
      : handleSizeChange;
  }, [options]);

  useEffect(() => subscribeToWindowSizeChange(handleSizeChange), [
    handleSizeChange,
  ]);

  if (!changeHandler.current) {
    return size;
  }
}

export {useWindowSize};

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
      this.subscription = subscribeToWindowSizeChange(this.updateDimensions);
    }
  }

  componentWillUnmount(): void {
    if (this.subscription) {
      this.subscription();
      this.subscription = null;
    }
  }

  getDimensions(): State {
    const width = window.innerWidth;
    const height = window.innerHeight;
    return {width, height};
  }

  subscription: null | (() => void) = null;

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
