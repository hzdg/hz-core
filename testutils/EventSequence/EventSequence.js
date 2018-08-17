// @flow
/* eslint-env jest */
export default class EventSequence {
  constructor(node: HTMLElement | Document) {
    this.node = node;
    this.eventQueue = [];
  }
  node: HTMLElement | Document;
  eventQueue: [string, any][];
  static create(node: HTMLElement | Document) {
    return new this.prototype.constructor(node);
  }
  // eslint-disable-next-line no-unused-vars
  static createNextEvent(type: string, init: any, lastEvent: any): Event {
    return new Event(type, init);
  }
  dispatch(type: string, init: any): any {
    this.eventQueue.push([type, init]);
    return this;
  }
  expose(extensions: {[key: string]: ?(Function | false)}): any {
    const extended = Object.assign(Object.create(this), extensions);
    for (const key in extensions) {
      if (
        key === 'dispatch' ||
        key === 'expose' ||
        key === 'run' ||
        key === 'then'
      ) {
        continue;
      }
      if (!Object.prototype.hasOwnProperty.call(extensions, key)) continue;
      if (!extensions[key]) {
        extended[key] = void 0;
      }
    }
    return extended;
  }
  run(): Promise<Event[]> {
    const eventSequence = this.eventQueue.reduce(
      (lastEvent, [eventType, eventInit]) =>
        lastEvent.then(async dispatched => {
          const nextEvent = this.constructor.createNextEvent(
            eventType,
            eventInit,
            dispatched[dispatched.length - 1],
          );
          this.node.dispatchEvent(nextEvent);
          dispatched.push(nextEvent);
          return dispatched;
        }),
      Promise.resolve([]),
    );
    this.eventQueue = [];
    return eventSequence;
  }
  then(resolved: Function, rejected?: Function): Promise<any> {
    return this.run().then(resolved, rejected);
  }
}
