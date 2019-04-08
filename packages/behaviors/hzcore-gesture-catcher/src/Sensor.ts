import pipe from 'callbag-pipe';
import share from 'callbag-share';
import subscribe from 'callbag-subscribe';
import {Callbag, Source, Sink} from 'callbag';

import {
  Observer,
  Subscription,
  SensorConfig,
  SensorInterface,
  implementsSensorInterface,
} from './types';

export default class Sensor {
  constructor(config: SensorConfig) {
    this.preventDefault = Boolean(config.preventDefault);
    this.passive = !this.preventDefault && Boolean(config.passive);
  }

  preventDefault: boolean = false;
  passive: boolean = false;
  source?: Source<any>;
  sensorStateReducer: (Source<any> & {sink: Sink<any>}) | null = null;

  static createSensorStateReducer(sensor: SensorInterface) {
    const reducer = share(
      pipe<Source<any>, Callbag<any, any>>(
        sensor.source,
        (source: Source<any>) => (start: 0 | 1 | 2, sink: Sink<any>) => {
          if (start !== 0) return;
          let talkback: Callbag<any, any>;
          reducer.sink = sink; // For `pushState`.
          (source as any)(0, (type: 0 | 1, data: any) => {
            if (type === 0) {
              talkback = data;
              sink(type, data);
            } else if (type === 1) {
              if (sensor.shouldPreventDefault(data)) data.preventDefault();
              const state = sensor.onData(data);
              if (state === null) return (talkback as any)(1);
              sink(1, state);
            } else {
              delete reducer.sink;
              sink(type, data);
            }
          });
        },
      ),
    ) as Source<any> & {sink: Sink<any>};
    return reducer;
  }

  shouldPreventDefault(event: Event) {
    return (
      this.preventDefault &&
      !event.defaultPrevented &&
      typeof event.preventDefault === 'function'
    );
  }

  updateConfig({preventDefault, passive}: SensorConfig) {
    this.preventDefault = Boolean(preventDefault);
    passive = !this.preventDefault && Boolean(passive);
    return passive === this.passive;
  }

  push(data: any) {
    if (this.sensorStateReducer && 'sink' in this.sensorStateReducer) {
      this.sensorStateReducer.sink(1, data);
    }
  }

  subscribe(
    observer: Partial<Observer> | ((value: any) => void),
    error?: (error: Error) => void,
    complete?: () => void,
  ): Subscription {
    if (typeof observer !== 'object' || observer === null) {
      observer = {next: observer, error, complete};
    }
    if (!this.sensorStateReducer && implementsSensorInterface(this)) {
      this.sensorStateReducer = (this
        .constructor as typeof Sensor).createSensorStateReducer(this);
    }
    return {
      unsubscribe: pipe(
        this.sensorStateReducer as Callbag<any, any>,
        subscribe(observer),
      ),
    };
  }
}
