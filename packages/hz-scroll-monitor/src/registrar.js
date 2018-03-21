// @flow
import {eventsFromConfig, createHandler} from './events';

const debug = Debug('ScrollMonitor:registrar');

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
  verticalDirection: ?('down' | 'up'),
  horizontalDirection: ?('left' | 'right'),
  inBounds: ?Boolean,
  inViewport: ?Boolean,
  lastTop: ?Number,
  lastLeft: ?Number,
  lastWidth: ?Number,
  lastHeight: ?Number,
  ...ScrollRect,
};

export type ScrollStateHandler = (state: ScrollState) => void;

type EventMap = {[event: string]: Set<ScrollStateHandler>};
type EventRegistrar = {destroy(): void, forceUpdate(): void, events: EventMap};
type ElementRegistrar = Map<HTMLElement, EventRegistrar>;
type Registration = {unregister(): void};

let defaultRegistrar: ElementRegistrar;

export function register(
  element: HTMLElement,
  config: RegistrationConfig,
  callback: ScrollStateHandler,
  elementRegistrar: ?ElementRegistrar,
): Registration {
  if (!elementRegistrar) {
    elementRegistrar = defaultRegistrar || (defaultRegistrar = new Map());
  }

  if (!elementRegistrar.has(element)) {
    elementRegistrar.set(
      element,
      createEventRegistrarAndScrollMonitor(element),
    );
  }

  const eventRegistrar = elementRegistrar.get(element);
  const eventHandlers = {};

  for (let eventName of eventsFromConfig(config)) {
    let eventConfig = null;
    if (Array.isArray(eventName)) [eventName, eventConfig] = eventName;
    const handler = createHandler(eventName, eventConfig, callback);
    eventHandlers[eventName] = handler;

    const registeredHandlers = eventRegistrar.events[eventName] || new Set();
    registeredHandlers.add(handler);
    eventRegistrar.events[eventName] = registeredHandlers;
  }

  const registration = {
    unregister() {
      for (const eventName in eventHandlers) {
        const registeredHandlers = eventRegistrar.events[eventName];
        registeredHandlers.delete(eventHandlers[eventName]);
        if (!registeredHandlers.size) {
          delete eventRegistrar.events[eventName];
        }
      }

      if (!Object.keys(eventRegistrar.events).length) {
        eventRegistrar.destroy();
        elementRegistrar.delete(element);
      }
    },
  };

  // Force an initial state update.
  eventRegistrar.forceUpdate();

  return registration;
}

function createEventRegistrarAndScrollMonitor(
  element: HTMLElement,
): EventRegistrar {
  const events = {};
  const scrollState = {};
  const callbacksToCall = new Set();
  let updatePending = false;

  function dispatchStateChange() {
    updatePending = false;
    for (const callback of callbacksToCall) {
      callback(scrollState); // eslint-disable-line callback-return
    }
    callbacksToCall.clear();
  }

  function updateScrollState(rect, immediate) {
    for (const event in events) {
      events[event].forEach(callbackGetter => {
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
    forceUpdate() {
      updateScrollState(getScrollRect(element), true);
    },
    destroy() {
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
