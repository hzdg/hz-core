/* eslint-disable no-duplicate-imports */
// @flow
import type {Callbag} from './types';

export default function fromEvent(
  node: Node,
  name: string,
  options: any,
): Callbag {
  return (start, sink) => {
    if (start !== 0) return;
    const handler = ev => sink(1, ev);
    sink(0, t => {
      if (t === 2) node.removeEventListener(name, handler, options);
    });
    node.addEventListener(name, handler, options);
  };
}
