// @flow
import {$$iterator} from 'symbol-iterator';

export default class GestureHistory {
  history: Event[] = [];
  error: ?Error = null;
  complete: boolean = false;
  next = (value: Event) => {
    this.history.push(value);
  };
  error = (error: Error) => {
    this.error = error;
  };
  complete = () => {
    this.complete = true;
  };
  nth(i: number): ?Event {
    return this.history[i - 1];
  }
  get size(): number {
    return this.history.length;
  }
  get first(): ?Event {
    return this.history[0];
  }
  get last(): ?Event {
    return this.history[this.history.length - 1];
  }
  // $FlowFixMe: Computed property keys not supported.
  *[$$iterator]() {
    let i = 0;
    while (i < this.history.length) {
      yield this.history[i++];
    }
  }
}
