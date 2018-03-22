// @flow
import {createHandlers} from './events';
import Debug from 'debug';

const debug = Debug('ScrollMonitor:registrar');

import type {EventState} from './events';

type BoundsRect = {
  top: ?Number,
  right: ?Number,
  bottom: ?Number,
  left: ?Number,
};

export type Bounds = BoundsRect | ((state: ScrollState) => BoundsRect);

export type RegistrationConfig = {
  vertical: ?Boolean,
  horizontal: ?Boolean,
  direction: ?Boolean,
  viewport: ?Boolean,
  bounds: ?Bounds,
};

export type ScrollRect = {
  top: Number,
  left: Number,
  width: Number,
  height: Number,
};

export type ScrollState = {
  lastTop: ?Number,
  lastLeft: ?Number,
  lastWidth: ?Number,
  lastHeight: ?Number,
  ...ScrollRect,
};

type ScrollMonitorState = ScrollState & EventState;

export type ScrollMonitorStateHandler = (state: ScrollMonitorState) => void;

type EventMap = {[event: string]: Set<ScrollMonitorStateHandler>};
type EventRegistrar = {
  register(
    config: RegistrationConfig,
    callback: ScrollMonitorStateHandler,
  ): Registration,
  destroy(): void,
  forceUpdate(): void,
  events: EventMap,
};
type ElementRegistrar = Map<HTMLElement, EventRegistrar>;
type Registration = {unregister(): void};

let defaultRegistrar: ElementRegistrar;

export function register(
  element: HTMLElement,
  config: RegistrationConfig,
  callback: ScrollMonitorStateHandler,
  elementRegistrar: ?ElementRegistrar,
): Registration {
  if (!elementRegistrar) {
    elementRegistrar = defaultRegistrar || (defaultRegistrar = new Map());
  }

  debug('Registering element', element, 'with config', config);

  if (!elementRegistrar.has(element)) {
    debug(element, 'is a new element to the registrar!');
    elementRegistrar.set(
      element,
      createEventRegistrarAndScrollMonitor(element),
    );
  }

  const eventRegistrar = elementRegistrar.get(element);
  const eventRegistration = eventRegistrar.register(config, callback);

  // Force an initial state update.
  eventRegistrar.forceUpdate();

  return createRegistration(() => {
    eventRegistration.unregister();
    if (!Object.keys(eventRegistrar.events).length) {
      debug('Event registrar for', element, 'is now empty! Cleaning up...');
      eventRegistrar.destroy();
      elementRegistrar.delete(element);
    }
  });
}

function createRegistration(unregister) {
  return {unregister};
}

function createEventRegistrarAndScrollMonitor(
  element: HTMLElement,
): EventRegistrar {
  const events = {};
  const scrollState = {};
  const callbacksToCall = new Map();
  let updatePending = false;

  function registerConfig(config, callback) {
    const eventHandlers = createHandlers(config, callback);

    for (const eventName in eventHandlers) {
      const registeredHandlers = events[eventName] || new Set();
      registeredHandlers.add(eventHandlers[eventName]);
      events[eventName] = registeredHandlers;
    }

    return createRegistration(() => {
      for (const eventName in eventHandlers) {
        const registeredHandlers = events[eventName];
        debug('Unregistering', eventName, 'for config', config);
        registeredHandlers.delete(eventHandlers[eventName]);
        if (!registeredHandlers.size) {
          delete events[eventName];
        }
      }
    });
  }

  function dispatchStateChange() {
    updatePending = false;
    for (const [callback, eventState] of callbacksToCall.values()) {
      callback({...scrollState, ...eventState}); // eslint-disable-line callback-return
    }
    callbacksToCall.clear();
  }

  function updateScrollState(rect, immediate) {
    for (const event in events) {
      events[event].forEach(callbackConfig => {
        const [callbackGetter, eventState] = callbackConfig;
        const callback = callbackGetter(rect, scrollState, eventState);
        if (callback)
          callbacksToCall.set(callbackConfig, [callback, eventState]);
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

    if (immediate) {
      dispatchStateChange();
    } else if (!updatePending) {
      updatePending = window.requestAnimationFrame(dispatchStateChange);
    }
  }

  function handleScroll(scrollEvent) {
    updateScrollState(getScrollRect(scrollEvent.currentTarget));
  }

  element.addEventListener('scroll', handleScroll);

  const eventRegistrar = {
    events,
    register(config, callback) {
      return registerConfig(config, callback);
    },
    forceUpdate() {
      debug('Forcing update for', element);
      updateScrollState(getScrollRect(element), true);
    },
    destroy() {
      debug('Destroying event registrar for', element);
      element.removeEventListener('scroll', handleScroll);
      window.cancelAnimationFrame(updatePending);
    },
  };

  return eventRegistrar;
}

function getScrollRect(element: HTMLElement): ScrollRect {
  const {scrollingElement = element} = element;
  const {
    scrollTop: top,
    scrollLeft: left,
    scrollWidth: width,
    scrollHeight: height,
  } = scrollingElement;
  return {top, left, width, height};
}
