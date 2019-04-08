import {Callbag, Sink, Source, SourceFactory} from 'callbag';

type MapFunction<T, R> = (value: T) => R;

export default function mapChanged(
  fn: MapFunction<any, any>,
): SourceFactory<any> {
  let lastResult: any;
  return (source: Source<any>): Callbag<any, any> => (
    start: 0 | 1 | 2,
    sink: Sink<any>,
  ) => {
    if (start !== 0) return;
    let talkback: any;
    source(0, (type: 0 | 1 | 2, data: any) => {
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
