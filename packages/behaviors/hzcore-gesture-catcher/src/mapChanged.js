// @flow
import type {Callbag} from './types';

export default function mapChanged(fn: Function): Callbag {
  let lastResult;
  return (source: Callbag) => (start: 0, sink: Callbag) => {
    if (start !== 0) return;
    source(0, (type: 0 | 1 | 2, data: any) => {
      let talkback;
      switch (type) {
        case 0: {
          talkback = data;
          sink(type, data);
          break;
        }
        case 2: {
          lastResult = null;
          sink(type, data);
          break;
        }
        case 1: {
          const nextResult = fn(data);
          if (nextResult === lastResult) {
            if (typeof talkback === 'function') talkback(1);
            break;
          }
          lastResult = nextResult;
          sink(type, lastResult);
          break;
        }
      }
    });
  };
}
