// @flow
import Debug from 'debug';
import {Observable, getScrollRect} from './utils';

import type {ObserverSet} from './types';

const SCROLL = 'scroll';
const LISTENER_OPTIONS = {passive: true};

const debug = Debug('ScrollMonitor:scroll');

const elements: Map<
  HTMLElement | Document,
  {observers: ObserverSet, handler(event: Event): void},
> = new Map();

function createScrollHandler(element) {
  const handleScroll = (scrollEvent: Event) => {
    const target = scrollEvent.currentTarget;
    const elementConfig = elements.get(element);
    if (
      elementConfig &&
      (target instanceof HTMLElement || target instanceof Document)
    ) {
      elementConfig.observers.forEach(observer => {
        observer.next({rect: getScrollRect(target)});
      });
    }
  };
  return handleScroll;
}

export function create(element: HTMLElement | Document): Observable {
  return new Observable(observer => {
    let elementConfig = elements.get(element);
    if (!elementConfig) {
      debug('Creating scroll event listener', element);
      const observers = new Set();
      const handler = createScrollHandler(element);
      elementConfig = {observers, handler};
      element.addEventListener(SCROLL, handler, LISTENER_OPTIONS);
      elements.set(element, elementConfig);
    }
    debug('Subscribing to scroll events', element, observer);
    elementConfig.observers.add(observer);

    return {
      unsubscribe() {
        if (elementConfig) {
          debug('Unsubscribing from scroll events', element, observer);
          const {observers, handler} = elementConfig;
          observers.delete(observer);
          if (!observers.size) {
            debug('No observers left! Cleaning up scroll listener...', element);
            element.removeEventListener(SCROLL, handler, LISTENER_OPTIONS);
            elements.delete(element);
          }
        }
      },
    };
  });
}

export default {create};
