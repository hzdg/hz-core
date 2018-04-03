// @flow
import Debug from 'debug';
import {Observable, getViewportChanges} from './utils';

import type {ViewportConfig, ObserverSet} from './types';

type TargetMap = Map<Element, ObserverSet>;
type IntersectionConfig = {
  intersection: IntersectionObserver,
  targets: TargetMap,
};
type IntersectionConfigs = {[key: string]: IntersectionConfig};
type ElementMap = Map<Element, IntersectionConfigs>;

const debug = Debug('ScrollMonitor:viewport');

const elementMap: ElementMap = new Map();

export function create(element: Element, config: ViewportConfig): Observable {
  if (!elementMap.has(element)) {
    debug('Creating element intersection observer', element);
    elementMap.set(element, new Map());
  }
  let configs: IntersectionConfigs = elementMap.get(element);

  const {threshold, target} = config.viewport;

  const key =
    threshold === null
      ? null
      : Array.isArray(threshold) ? threshold.join() : threshold.toString();

  if (!(key in configs)) {
    debug(`Creating observer for threshold ${key}`, element);
    configs[key] = configIntersectionObserver(element, threshold);
  }

  let {intersection, targets} = configs[key];

  if (!targets.has(target)) {
    targets.set(target, new Set());
  }

  let observers = targets.get(target);

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
          observers = null;
          targets.delete(target);
          if (!targets.size) {
            debug('Disconnecting intersection', element, target, threshold);
            intersection.disconnect();
            delete configs[key];
            intersection = null;
            targets = null;
            if (!Object.keys(configs).length) {
              debug('Cleaning up element map', element);
              elementMap.delete(element);
              configs = null;
            }
          }
        }
      },
    };
  });
}

function configIntersectionObserver(
  element: Element,
  threshold: ?(Number | Number[]),
): IntersectionConfig {
  const targets = new Map();

  function handleIntersectionChange(entries) {
    getViewportChanges(entries).forEach(intersection => {
      const observers = targets.get(intersection.target);
      observers.forEach(observer => {
        // FIXME: no array needed here any more.
        observer.next({intersection});
      });
    });
  }

  return {
    targets,
    intersection: new IntersectionObserver(handleIntersectionChange, {
      threshold,
      root: element instanceof Element ? element : null,
    }),
  };
}

export default {create};
