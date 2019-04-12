import Debug from 'debug';
import {Observable, getScrollRect} from './utils';

import {
  ScrollRect,
  Observer,
  /* eslint-disable import/named */
  ObserverSet,
  /* eslint-enable import/named */
} from './types';

// TODO: Find the smallest timeout that won't ever get tricked by inertia.
const SCROLL_TIMEOUT = 60;
const SCROLL = 'scroll';
const LISTENER_OPTIONS: AddEventListenerOptions = {passive: true};

const debug = Debug('ScrollMonitor:scroll');

const elements: Map<
  HTMLElement | Document,
  {observers: ObserverSet; handler(event: Event): void}
> = new Map();

function createScrollHandler(
  element: HTMLElement | Document,
): (scrollEvent: Event) => void {
  let scrollTimeoutPending: NodeJS.Timeout | false | null;

  const handleScrollTimeout = (): void => {
    if (scrollTimeoutPending) {
      clearTimeout(scrollTimeoutPending);
      scrollTimeoutPending = false;
    }
    const elementConfig = elements.get(element);
    if (elementConfig) {
      elementConfig.observers.forEach(observer => {
        observer.next({scrolling: false});
      });
    }
  };

  const handleScroll = (scrollEvent: Event): void => {
    const target = scrollEvent.currentTarget;
    const elementConfig = elements.get(element);
    if (scrollTimeoutPending) {
      clearTimeout(scrollTimeoutPending);
      scrollTimeoutPending = false;
    }
    if (
      elementConfig &&
      (target instanceof HTMLElement || target instanceof Document)
    ) {
      elementConfig.observers.forEach(observer => {
        observer.next({
          scrolling: true,
          rect: getScrollRect(target),
        });
      });
      scrollTimeoutPending = setTimeout(handleScrollTimeout, SCROLL_TIMEOUT);
    }
  };
  return handleScroll;
}

export function create(
  element: HTMLElement | Document,
): Observable<{rect: ScrollRect}> {
  return new Observable<{rect: ScrollRect}>((observer: Observer) => {
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

    // Give the observer the current value;
    observer.next({scrolling: false, rect: getScrollRect(element)});

    return function unsubscribe() {
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
    };
  });
}

export default {create};
