import ResizeObserver from 'resize-observer-polyfill';
import Observable from 'zen-observable';
import {ensureDOMInstance} from '@hzcore/dom-utils';

type Observer = ZenObservable.SubscriptionObserver<DOMRect>;
const resizeObservers = new Map<Element, Set<Observer>>();

let resizeObserver: ResizeObserver;

function createResizeObserver(): void {
  resizeObserver = new ResizeObserver(entries => {
    for (const entry of entries) {
      const {target: element, contentRect: payload} = entry;
      const observers = resizeObservers.get(element);
      if (observers) {
        observers.forEach(observer => observer.next(payload as DOMRect));
      }
    }
  });
}

export function create(element: Element): Observable<DOMRect> {
  ensureDOMInstance(element, Element);
  return new Observable((observer: Observer) => {
    if (!resizeObserver) createResizeObserver();
    let observers = resizeObservers.get(element);
    if (observers) {
      observers.add(observer);
    } else {
      observers = new Set<Observer>([observer]);
      resizeObservers.set(element, observers);
      resizeObserver.observe(element);
    }
    return () => {
      if (observers) {
        observers.delete(observer);
        if (observers.size === 0) {
          resizeObservers.delete(element);
          resizeObserver.unobserve(element);
        }
      }
    };
  });
}

export default {create};
