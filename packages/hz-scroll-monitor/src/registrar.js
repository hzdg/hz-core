// @flow
import {createHandlers, IN_VIEWPORT} from './events';
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

function createEventRegistrarAndScrollMonitor(
  element: HTMLElement,
): EventRegistrar {
  const events = {};
  const scrollState = {};
  const callbacksToCall = new Map();
  let updatePending = false;

  function updateScrollState(rect, immediate) {
    // Update the callbacks that care about the impending state change.
    // Note that  dispatches are asynchronous. This means that some changes
    // might add a callback to the map, while subsequence changes might
    // remove it without it ever being called, which is generally
    // an optimal tradeoff, performance-wise (mitigates update thrashing).
    updateCallbacksToCall(callbacksToCall, events, scrollState, rect);

    // Update the scroll state.
    scrollState.lastTop = scrollState.top;
    scrollState.lastLeft = scrollState.left;
    scrollState.lastWidth = scrollState.width;
    scrollState.lastHeight = scrollState.height;
    scrollState.top = rect.top;
    scrollState.left = rect.left;
    scrollState.width = rect.width;
    scrollState.height = rect.height;

    // Dispatch the state change, or schedule a dispatch,
    // if not updating asynchronously (default).
    if (immediate) {
      window.cancelAnimationFrame(updatePending);
      updatePending = false;
      dispatchStateChange(callbacksToCall, scrollState);
    } else if (!updatePending) {
      updatePending = window.requestAnimationFrame(() => {
        if (updatePending) {
          updatePending = false;
          dispatchStateChange(callbacksToCall, scrollState);
        }
      });
    }
  }

  function handleScroll(scrollEvent) {
    updateScrollState(getScrollRect(scrollEvent.currentTarget));
  }

  function updateObservers() {
    element.removeEventListener('scroll', handleScroll);
    if (hasScrollBoundEvent(events)) {
      element.addEventListener('scroll', handleScroll);
    }
    if (hasIntersectionBoundEvent(events)) {
      debug('need intersection!')
    }
  }

  function destroyObservers() {
    element.removeEventListener('scroll', handleScroll);
  }

  return {
    events,
    register(config, callback) {
      const registration = registerConfig(events, config, callback);
      updateObservers();
      return registration;
    },
    forceUpdate() {
      debug('Forcing update for', element);
      updateScrollState(getScrollRect(element), true);
    },
    destroy() {
      debug('Destroying event registrar for', element);
      window.cancelAnimationFrame(updatePending);
      destroyObservers();
    },
  };
}

function createRegistration(unregister) {
  return {unregister};
}

function registerConfig(events, config, callback) {
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

function dispatchStateChange(callbacksToCall, scrollState) {
  for (const [callback, eventState] of callbacksToCall.values()) {
    callback({...scrollState, ...eventState}); // eslint-disable-line callback-return
  }
}

function updateCallbacksToCall(callbacksToCall, events, scrollState, rect) {
  for (const event in events) {
    for (const callbackConfig of events[event]) {
      const [callbackGetter, eventState] = callbackConfig;
      const callback = callbackGetter(rect, scrollState, eventState);
      if (callback) {
        callbacksToCall.set(callbackConfig, [callback, eventState]);
      }
    }
  }
}

function hasScrollBoundEvent(events) {
  return Object.keys(events).length > 2 || !hasIntersectionBoundEvent(events);
}

function hasIntersectionBoundEvent(events) {
  return IN_VIEWPORT in events;
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
