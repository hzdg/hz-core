/* eslint-disable no-duplicate-imports */
// @flow
import pipe from 'callbag-pipe';
import share from 'callbag-share';
import subscribe from 'callbag-subscribe';
import invariant from 'invariant';

import type {
  Callbag,
  Observer,
  Subscription,
  SensorConfig,
  SensorInterface,
} from './types';

export default class Sensor {
  constructor(config: SensorConfig) {
    this.preventDefault = Boolean(config.preventDefault);
    this.passive = !this.preventDefault && Boolean(config.passive);
  }

  preventDefault: boolean = false;
  passive: boolean = false;
  source: Callbag;
  sensorStateReducer: Callbag = null;

  static createSensorStateReducer(sensor: Sensor & SensorInterface) {
    invariant(
      typeof sensor.onData === 'function',
      `Expected ${sensor.constructor.name} to have a onData method.`,
    );
    invariant(
      typeof sensor.source === 'function',
      `Expected ${sensor.constructor.name} to have a source callbag.`,
    );
    invariant(
      typeof sensor.shouldPreventDefault === 'function',
      `Expected ${
        sensor.constructor.name
      } to have a shouldPreventDefault method.`,
    );
    const reducer = share(
      pipe(
        sensor.source,
        (source: Callbag) => (start: 0, sink: Callbag) => {
          if (start !== 0) return;
          let talkback;
          reducer.sink = sink; // For `pushState`.
          source(0, (type, data) => {
            if (type === 0) {
              talkback = data;
              sink(type, data);
            } else if (type === 1) {
              if (sensor.shouldPreventDefault(data)) data.preventDefault();
              const state = sensor.onData(data);
              if (state === null) return talkback(1);
              sink(1, state);
            } else {
              delete reducer.sink;
              sink(type, data);
            }
          });
        },
      ),
    );
    return reducer;
  }

  +shouldPreventDefault = (event: Event) =>
    this.preventDefault &&
    !event.defaultPrevented &&
    typeof event.preventDefault === 'function';

  push(data: any) {
    if (this.sensorStateReducer && this.sensorStateReducer.sink) {
      this.sensorStateReducer.sink(1, data);
    }
  }

  subscribe(
    observer: ?(Observer | Function),
    error: ?Function,
    complete: ?Function,
  ): Subscription {
    if (typeof observer !== 'object' || observer === null) {
      observer = {next: observer, error, complete};
    }
    if (!this.sensorStateReducer) {
      this.sensorStateReducer = this.constructor.createSensorStateReducer(
        (this: any),
      );
    }
    return {
      unsubscribe: pipe(
        this.sensorStateReducer,
        subscribe(observer),
      ),
    };
  }
}
