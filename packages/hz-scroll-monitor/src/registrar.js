// @flow
import {createHandlers} from './events';
import Debug from 'debug';

const debug = Debug('ScrollMonitor:registrar');
const debugDispatch = Debug('ScrollMonitor:dispatch');

import type {
  ElementRegistrar,
  EventMap,
  EventRegistrar,
  ObserverMap,
  PendingCallbackMap,
  Registration,
  RegistrationConfig,
  ScrollMonitorStateHandler,
  ScrollRect,
  ScrollState,
  UpdatePayload,
  ViewportChange,
} from './types';

let defaultRegistrar: ElementRegistrar;

export function register(
  element: HTMLElement,
  config: RegistrationConfig,
  callback: ScrollMonitorStateHandler,
  elementRegistrar: ?ElementRegistrar,
): Registration {
  if (!elementRegistrar) {
    if (!defaultRegistrar) {
      debug('No element registrar provided! Creating default (global)...');
      defaultRegistrar = new Map();
    }
    elementRegistrar = defaultRegistrar;
  }

  if (!elementRegistrar.has(element)) {
    debug('Registering new element', element);
    elementRegistrar.set(
      element,
      createEventRegistrarAndScrollMonitor(element),
    );
  }

  const eventRegistrar = elementRegistrar.get(element);
  const eventRegistration = eventRegistrar.register(config, callback);

  // Force an initial state update.
  // FIXME: Is there a heuristic we can use to decide whether or not to do this?
  // It's very expensive during scaffolding/ initial render phase.
  // eventRegistrar.forceUpdate();

  return createRegistration(() => {
    eventRegistration.unregister();
    if (
      !Object.keys(eventRegistrar.events).length &&
      !Object.keys(eventRegistrar.observers).length
    ) {
      debug('Event registrar is now empty!', element);
      eventRegistrar.destroy();
      elementRegistrar.delete(element);
    }
  });
}

function createEventRegistrarAndScrollMonitor(
  element: HTMLElement,
): EventRegistrar {
  const events: EventMap = {};
  const observers: ObserverMap = {};
  const scrollState: ScrollState = {};
  const callbacksToCall: PendingCallbackMap = new Map();
  let updatePending: Boolean = false;
  let intersectionObserver: ?IntersectionObserver;

  function updateScrollState(payload: UpdatePayload, immediate?: Boolean) {
    // Update the callbacks that care about the impending state change.
    // Note that  dispatches are asynchronous. This means that some changes
    // might add a callback to the map, while subsequence changes might
    // remove it without it ever being called, which is generally
    // an optimal tradeoff, performance-wise (mitigates update thrashing).
    updateCallbacksToCall(callbacksToCall, events, scrollState, payload);

    if (callbacksToCall.size) {
      debugDispatch(`${callbacksToCall.size} updates scheduled`);
    }

    if (payload.rect) {
      // Update the scroll state.
      scrollState.lastTop = scrollState.top;
      scrollState.lastLeft = scrollState.left;
      scrollState.lastWidth = scrollState.width;
      scrollState.lastHeight = scrollState.height;
      scrollState.top = payload.rect.top;
      scrollState.left = payload.rect.left;
      scrollState.width = payload.rect.width;
      scrollState.height = payload.rect.height;
    }

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
    updateScrollState({rect: getScrollRect(scrollEvent.currentTarget)});
  }

  function handleIntersectionChange(entries) {
    updateScrollState({intersections: getViewportChanges(entries)});
  }

  function updateObservers(config) {
    if (hasScrollBoundEvent(config)) {
      if (!observers.scroll) {
        debug('Subscribing to scroll events', element);
        element.addEventListener('scroll', handleScroll);
        observers.scroll = {
          disconnect() {
            element.removeEventListener('scroll', handleScroll);
          },
        };
      }
    }

    if (hasIntersectionBoundEvent(config)) {
      const {threshold} = config.viewport;
      const key =
        threshold === null
          ? null
          : Array.isArray(threshold) ? threshold.join() : threshold.toString();
      intersectionObserver = observers[key];
      if (!intersectionObserver) {
        debug(`Creating Observer for intersection threshold ${key}`, element);
        intersectionObserver = new IntersectionObserver(
          handleIntersectionChange,
          {
            threshold,
            root: element instanceof Element ? element : null,
          },
        );
        observers[key] = intersectionObserver;
      }
      debug(`Observing intersection threshold ${key}`, config.viewport.target);
      intersectionObserver.observe(config.viewport.target);
    }
  }

  function destroyObservers() {
    for (const key in observers) {
      observers[key].disconnect();
      delete observers[key];
    }
  }

  debug('Creating event registrar', element);

  return {
    events,
    observers,
    register(config, callback) {
      const registration = registerConfig(events, config, callback);
      updateObservers(config);
      return registration;
    },
    forceUpdate() {
      debug('Forcing update', element);
      updateScrollState(
        {
          rect: getScrollRect(element),
          intersections: getViewportChanges(intersectionObserver.takeRecords()),
        },
        true,
      );
    },
    destroy() {
      debug('Destroying event registrar', element);
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
    debug(`Registering event ${eventName}`);
    registeredHandlers.add(eventHandlers[eventName]);
    events[eventName] = registeredHandlers;
  }

  return createRegistration(() => {
    for (const eventName in eventHandlers) {
      const registeredHandlers = events[eventName];
      debug(`Unregistering event ${eventName}`);
      registeredHandlers.delete(eventHandlers[eventName]);
      if (!registeredHandlers.size) {
        delete events[eventName];
      }
    }
  });
}

function dispatchStateChange(
  callbacksToCall: PendingCallbackMap,
  scrollState: ScrollState,
) {
  if (!callbacksToCall.size) return;
  debugDispatch(`dispatching ${callbacksToCall.size} changes`);
  for (const [callback, eventState] of callbacksToCall.values()) {
    callback({...scrollState, ...eventState}); // eslint-disable-line callback-return
  }
  callbacksToCall.clear();
}

function updateCallbacksToCall(
  callbacksToCall: PendingCallbackMap,
  events: EventMap,
  scrollState: ScrollState,
  payload: UpdatePayload,
) {
  for (const event in events) {
    for (const callbackConfig of events[event]) {
      const [callbackGetter, eventState] = callbackConfig;
      const callback = callbackGetter(payload, scrollState, eventState);
      if (callback) {
        callbacksToCall.set(callbackConfig, [callback, eventState]);
      } else if (callback === false) {
        callbacksToCall.delete(callbackConfig);
      }
    }
  }
}

function hasScrollBoundEvent(config: RegistrationConfig): Boolean {
  return Object.keys(config).length > 2 || !hasIntersectionBoundEvent(config);
}

function hasIntersectionBoundEvent(config: RegistrationConfig): Boolean {
  // eslint-disable-next-line eqeqeq
  return config.viewport !== false && config.viewport != null;
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

function getViewportChanges(
  entries: IntersectionObserverEntry[],
): ViewportChange[] {
  return entries.map(({target, isIntersecting: inViewport}) => ({
    target,
    inViewport,
  }));
}
