import merge from 'callbag-merge';
import Sensor from './Sensor';
import fromEvent from './fromEvent';
import {MOUSE_DOWN, MOUSE_MOVE, MOUSE_UP, SensorConfig} from './types';

export default class MouseSensor extends Sensor {
  constructor(node: HTMLElement, config: SensorConfig) {
    super(config);
    this.source = merge(
      fromEvent(node, MOUSE_DOWN),
      fromEvent(document, MOUSE_UP),
      fromEvent(document, MOUSE_MOVE, {passive: this.passive}),
    );
  }

  gesturing: boolean = false;

  shouldPreventDefault(event: Event) {
    return (
      event instanceof MouseEvent &&
      event.type === MOUSE_MOVE &&
      super.shouldPreventDefault(event)
    );
  }

  onData(data: MouseEvent) {
    switch (data.type) {
      case MOUSE_DOWN: {
        if (this.gesturing) return null;
        this.gesturing = true;
        return data;
      }
      case MOUSE_MOVE: {
        if (!this.gesturing) return null;
        return data;
      }
      case MOUSE_UP: {
        if (!this.gesturing) return null;
        this.gesturing = false;
        return data;
      }
    }
  }
}
