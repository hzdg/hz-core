// @flow
/* eslint-disable no-duplicate-imports */
import Debug from 'debug';
import ScrollObservable from './ScrollObservable';
import ViewportObservable from './ViewportObservable';
import EventState from './EventState';
import {Observable} from './utils';
import {SCROLL_PROPS} from './types';

import type {
  ObserverSet,
  Subscription,
  ScrollMonitorConfig,
  ScrollMonitorEventConfig,
  ScrollState,
  UpdatePayload,
} from './types';

export function create(
  element: HTMLElement | Document,
  config: ScrollMonitorConfig,
): Observable {
  const debug = Debug(`ScrollMonitor:uid:${config.uid}`);
  const observers: ObserverSet = new Set();
  const subscriptions: Set<Subscription> = new Set();
  const eventsToDispatch: Set<ScrollMonitorEventConfig> = new Set();
  const eventState = EventState.create(config);

  let scrollState: ScrollState = {};
  let updatePending: boolean = false;

  function reset() {
    debug(`canceling update; clearing ${eventsToDispatch.size} events`);
    window.cancelAnimationFrame(updatePending);
    updatePending = false;
    eventsToDispatch.clear();
    scrollState = {};
  }

  function dispatch() {
    if (!eventsToDispatch.size) return;
    const nextState = {...scrollState, ...eventState.state};
    debug(
      `dispatching ${eventsToDispatch.size} events to ${
        observers.size
      } observers`,
    );
    observers.forEach(observer => {
      observer.next(nextState);
    });
    eventsToDispatch.forEach(eventConfig => {
      if (typeof eventConfig.onUpdate === 'function') {
        eventConfig.onUpdate(nextState);
      }
    });
    eventsToDispatch.clear();
  }

  function update(payload: UpdatePayload, immediate?: boolean) {
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
        debug(`schedule update`);
        eventsToDispatch.add(eventConfig);
      } else if (result === false && eventsToDispatch.has(eventConfig)) {
        debug(`unschedule update`);
        eventsToDispatch.delete(eventConfig);
      }
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
      if (SCROLL_PROPS.some(p => Boolean(config[p]))) {
        subscriptions.add(ScrollObservable.create(element).subscribe(update));
      }

      if (config.viewport) {
        subscriptions.add(
          ViewportObservable.create(element, config.viewport).subscribe(update),
        );
      }
    }

    debug('Subscribing to scroll state', element, config);
    observers.add(observer);

    return {
      unsubscribe() {
        debug('Unsubscribing from scroll state', element, config);
        observers.delete(observer);
        if (!observers.size) {
          for (const sub of subscriptions) {
            sub.unsubscribe();
          }
          subscriptions.clear();
          reset();
        }
      },
    };
  });
}

export default {create};
