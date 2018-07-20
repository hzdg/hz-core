// @flow
import Debug from 'debug';
import {Observable, getScrollRect} from './utils';

import type {ObserverSet} from './types';

const debug = Debug('ScrollMonitor:scroll');

const elements: Map<HTMLElement | Document, ObserverSet> = new Map();

export function create(element: HTMLElement | Document): Observable {
  const handleScroll = (scrollEvent: Event) => {
    const observers = elements.get(element);
    const target = scrollEvent.currentTarget;
    if (
      (target instanceof HTMLElement || target instanceof Document) &&
      observers
    ) {
      observers.forEach(observer => {
        observer.next({rect: getScrollRect(target)});
      });
    }
  };

  return new Observable(observer => {
    const observers: ObserverSet = elements.get(element) || new Set();
    if (!elements.has(element)) {
      debug('Creating scroll event listener', element);
      element.addEventListener('scroll', handleScroll, {passive: true});
      elements.set(element, observers);
    }

    debug('Subscribing to scroll events', element, observer);
    observers.add(observer);

    return {
      unsubscribe() {
        debug('Unsubscribing from scroll events', element, observer);
        observers.delete(observer);
        if (!observers.size) {
          elements.delete(element);
          if (!elements.get(element)) {
            debug('No observers left! Cleaning up scroll listener...', element);
            element.removeEventListener('scroll', handleScroll);
            elements.delete(element);
          }
        }
      },
    };
  });
}

export default {create};
