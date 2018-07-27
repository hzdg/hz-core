// @flow
import Debug from 'debug';
import {Observable, getViewportChanges} from './utils';

import type {ViewportConfig, ObserverSet} from './types';

type TargetMap = Map<Element, ObserverSet>;
type IntersectionConfig = {
  intersection: IntersectionObserver,
  targets: TargetMap,
};
type IntersectionConfigs = {[key: ?string]: IntersectionConfig};
type ElementMap = Map<HTMLElement | Document, IntersectionConfigs>;

const debug = Debug('ScrollMonitor:viewport');

const elementMap: ElementMap = new Map();

export function create(
  element: HTMLElement | Document,
  config: ViewportConfig,
): Observable {
  const {threshold, target} = config;
  const configs: IntersectionConfigs = elementMap.get(element) || {};

  if (!elementMap.has(element) && configs) {
    debug('Creating element intersection observer', element);
    elementMap.set(element, configs);
  }

  const key =
    threshold === null
      ? null
      : Array.isArray(threshold)
        ? threshold.join()
        : typeof threshold === 'number' ? threshold.toString() : null;

  if (!configs[key]) {
    debug(`Creating observer for threshold ${(key: any)}`, element);
    configs[key] = createIntersectionConfig(element, threshold);
  }

  const {intersection, targets} = configs[key];
  const observers: ObserverSet = targets.get(target) || new Set();

  if (!targets.has(target)) {
    targets.set(target, observers);
  }

  return new Observable(observer => {
    if (!observers.size) {
      debug(`Observing intersection`, element, target, threshold);
      intersection.observe(target);
    }
    debug('Subscribing to viewport events', element, observer);
    observers.add(observer);
    return {
      unsubscribe() {
        debug('Unsubscribing from viewport events', element, observer);
        observers.delete(observer);
        if (!observers.size) {
          targets.delete(target);
          if (!targets.size) {
            debug('Disconnecting intersection', element, target, threshold);
            intersection.disconnect();
            delete configs[key];
            if (!Object.keys(configs).length) {
              debug('Cleaning up element map', element);
              elementMap.delete(element);
            }
          }
        }
      },
    };
  });
}

function createIntersectionConfig(
  element: HTMLElement | Document,
  threshold: ?(number | number[]),
): IntersectionConfig {
  const targets = new Map();

  function handleIntersectionChange(entries) {
    getViewportChanges(entries).forEach(intersection => {
      const observers = targets.get(intersection.target);
      if (observers) {
        observers.forEach(observer => {
          // FIXME: no array needed here any more.
          observer.next({intersection});
        });
      }
    });
  }

  return {
    targets,
    intersection: new IntersectionObserver(handleIntersectionChange, {
      threshold: threshold || void 0,
      root: element instanceof HTMLElement ? element : null,
      // TODO: add rootMargin support?
      // rootMargin?: string
    }),
  };
}

export default {create};
