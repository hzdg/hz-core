// @flow
import Debug from 'debug';
import ScrollObservable from './ScrollObservable';
import ViewportObservable from './ViewportObservable';
import EventState from './Eventstate';
import {
  Observable,
  hasScrollBoundEvent,
  hasIntersectionBoundEvent,
} from './utils';

import type {
  ObserverSet,
  ScrollMonitorConfig,
  ScrollMonitorEventConfig,
  ScrollState,
  UpdatePayload,
} from './types';

export function create(
  element: Element,
  config: ScrollMonitorConfig,
): Observable {
  const debug = Debug(`ScrollMonitor:uid:${config.uid}`);
  const observers: ObserverSet = new Set();
  const subscriptionMap = new Map();
  const eventsToDispatch: Set<ScrollMonitorEventConfig> = new Set();
  const eventState = EventState.create(config);

  let scrollState: ScrollState = {};
  let updatePending: boolean = false;

  function reset() {
    window.cancelAnimationFrame(updatePending);
    updatePending = false;
    eventsToDispatch.clear();
    scrollState = {};
  }

  function dispatch() {
    if (!eventsToDispatch.size) return;
    const nextState = {...scrollState, ...eventState.state};
    debug(
      `dispatching ${eventsToDispatch.size} events to ${observers.size} observers`,
    );
    observers.forEach(observer => {
      observer.next(nextState);
    });
    eventsToDispatch.clear();
  }

  function update(payload: UpdatePayload, immediate?: Boolean) {
    // Update the callbacks that care about the impending state change.
    // Note that dispatches are asynchronous by default. This means that
    // some changes might add a callback to the map, while subsequent
    // changes might remove it without it ever being called,
    // which is generally an optimal tradeoff, performance-wise
    // (mitigates update thrashing).
    for (const eventConfig of eventState.configs) {
      const result = eventConfig.shouldUpdate(
        payload,
        scrollState,
        eventState.state,
      );
      if (result) {
        debug(`schedule update`)
        eventsToDispatch.add(eventConfig);
      } else if (result === false) {
        eventsToDispatch.delete(eventConfig);
      }
    }

    if (eventsToDispatch.size) {
      debug(`${eventsToDispatch.size} updates scheduled`);
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
      dispatch();
    } else if (!updatePending) {
      updatePending = window.requestAnimationFrame(() => {
        if (updatePending) {
          updatePending = false;
          dispatch();
        }
      });
    }
  }

  return new Observable(observer => {
    if (!observers.size) {
      if (hasScrollBoundEvent(config)) {
        const scrollObservable = ScrollObservable.create(element, config);
        subscriptionMap.set(
          scrollObservable,
          scrollObservable.subscribe(update),
        );
      }
      if (hasIntersectionBoundEvent(config)) {
        const viewportObservable = ViewportObservable.create(element, config);
        subscriptionMap.set(
          viewportObservable,
          viewportObservable.subscribe(update),
        );
      }
    }

    debug('Subscribing to scroll state', element, config);
    observers.add(observer);

    return {
      unsubscribe() {
        debug('Unsubscribing from scroll state', element, config);
        observers.remove(observer);
        if (!observers.size) {
          subscriptionMap.values().forEach(unsubscribe => unsubscribe());
          subscriptionMap.clear();
          reset();
        }
      },
    };
  });
}

export default {create};
