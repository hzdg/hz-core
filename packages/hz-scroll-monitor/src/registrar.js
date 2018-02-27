// @flow
import {eventsFromConfig, createHandler} from './events';

export type Bounds = {
  top: ?Number,
  right: ?Number,
  bottom: ?Number,
  left: ?Number,
};

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
type EventRegistrar = {destroy(): void, events: EventMap};
type Registrar = Map<HTMLElement, EventRegistrar>;
type Registration = {unregister(): void};

let defaultRegistrar: Registrar;

export function register(
  el: HTMLElement,
  config: RegistrationConfig,
  callback: ScrollStateHandler,
  registrar: ?Registrar,
): Registration {
  if (!registrar) {
    registrar = defaultRegistrar || (defaultRegistrar = new Map());
  }

  if (!registrar.has(el)) {
    registrar.set(el, createEventRegistrarAndScrollMonitor(el));
  }

  const eventRegistrar = registrar.get(el).events;
  const eventHandlers = {};

  for (let eventName of eventsFromConfig(config)) {
    let eventConfig = null;
    if (Array.isArray(eventName)) [eventName, eventConfig] = eventName;
    const handler = createHandler(eventName, eventConfig, callback);
    eventHandlers[eventName] = handler;

    const registeredHandlers = eventRegistrar[eventName] || new Set();
    registeredHandlers.add(handler);
    eventRegistrar[eventName] = registeredHandlers;
  }

  const registration = {
    unregister() {
      for (const eventName in eventHandlers) {
        const registeredHandlers = eventRegistrar[eventName];
        registeredHandlers.remove(eventHandlers[eventName]);
        if (!registeredHandlers.size) {
          delete eventRegistrar[eventName];
        }
      }

      if (!Object.keys(eventRegistrar).length) {
        registrar.get(el).destroy();
        registrar.delete(el);
      }
    },
  };

  return registration;
}

function createEventRegistrarAndScrollMonitor(
  element: HTMLElement,
): EventRegistrar {
  const events = {};
  const scrollState = {};
  const callbacksToCall = new Set();
  let updatePending = false;

  function handleScroll(scrollEvent) {
    const rect = getScrollRect(scrollEvent);

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

  const eventRegistrar = {
    events,
    destroy() {
      element.removeEventListener('scroll', handleScroll);
      window.cancelAnimationFrame(updatePending);
    },
  };

  return eventRegistrar;
}

function getScrollRect(event: UIEvent): ScrollRect {
  const {scrollingElement = event.currentTarget} = event.currentTarget;
  const {
    scrollTop: top,
    scrollLeft: left,
    scrollWidth: width,
    scrollHeight: height,
  } = scrollingElement;
  return {top, left, width, height};
}
