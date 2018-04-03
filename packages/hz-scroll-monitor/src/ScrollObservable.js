// @flow
import Debug from 'debug';
import {Observable, getScrollRect} from './utils';

import type {ObserverSet} from './types';

const debug = Debug('ScrollMonitor:scroll');

const elements: Map<Element, ObserverSet> = new Map();

export function create(element: Element): Observable {
  const handleScroll = scrollEvent => {
    elements.get(element).forEach(observer => {
      observer.next({rect: getScrollRect(scrollEvent.currentTarget)});
    });
  };

  return new Observable(observer => {
    if (!elements.has(element)) {
      debug('Creating scroll event listener', element);
      element.addEventListener('scroll', handleScroll);
      elements.set(element, new Set());
    }

    debug('Subscribing to scroll events', element, observer);
    elements.get(element).add(observer);

    return {
      unsubscribe() {
        debug('Unsubscribing from scroll events', element, observer);
        const observers = elements.get(element);
        observers.remove(observer);
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
