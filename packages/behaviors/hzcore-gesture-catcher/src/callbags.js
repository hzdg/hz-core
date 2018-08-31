/* eslint-disable no-duplicate-imports */
// @flow
import map from 'callbag-map';

import type {GestureEvent, Callbag} from './types';

export function fromEvent(node: Node, name: string, options: any): Callbag {
  return (start, sink) => {
    if (start !== 0) return;
    const handler = ev => sink(1, ev);
    sink(0, t => {
      if (t === 2) node.removeEventListener(name, handler, options);
    });
    node.addEventListener(name, handler, options);
  };
}

export function preventDefault(
  predicate: ?(event: GestureEvent) => boolean,
): Callbag {
  return map((event: GestureEvent) => {
    if (typeof predicate !== 'function' || predicate(event)) {
      if (typeof event.preventDefault === 'function') {
        event.preventDefault();
      }
    }
    return event;
  });
}
