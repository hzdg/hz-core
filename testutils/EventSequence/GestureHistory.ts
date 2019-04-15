import {$$iterator} from 'symbol-iterator';

export default class GestureHistory {
  history: Event[] = [];
  _error: Error | null = null;
  _complete: boolean = false;
  next = (value: Event) => {
    this.history.push(value);
  };
  error = (error: Error) => {
    this._error = error;
  };
  complete = () => {
    this._complete = true;
  };
  nth(i: number): Event | null {
    return this.history[i - 1];
  }
  get size(): number {
    return this.history.length;
  }
  get first(): Event | null {
    return this.history[0];
  }
  get last(): Event | null {
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
