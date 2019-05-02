/* eslint-env jest */

interface Extensions {
  [key: string]: Function | false | null;
}

/**
 * Pick only the members of base type `B`
 * that extend the predicate type `T`.
 */
type PickType<B, T> = Pick<
  B,
  {[K in keyof B]: B[K] extends T ? K : never}[keyof B]
>;

export default class EventSequence<
  EventType extends Event = Event,
  EventInitType extends EventInit = EventInit
> implements PromiseLike<EventType[]> {
  constructor(node: HTMLElement | Document) {
    this.node = node;
    this.eventQueue = [];
  }

  node: HTMLElement | Document;
  eventQueue: [string, EventInitType?][];

  static create<T extends typeof EventSequence>(
    this: T,
    node: HTMLElement | Document,
  ): InstanceType<T> {
    return new this(node) as InstanceType<T>;
  }

  createNextEvent(
    type: string,
    init?: EventInitType,
    lastEvent?: EventType, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): EventType {
    return new Event(type, init) as EventType;
  }

  dispatch<T extends EventSequence<EventType, EventInitType>>(
    this: T,
    type: string,
    init?: EventInitType,
  ): T {
    this.eventQueue.push([type, init]);
    return this;
  }

  expose<E extends Extensions>(
    extensions: E,
  ): Pick<this, Exclude<keyof this, keyof E>> & PickType<E, Function> {
    const extended = Object.assign(Object.create(this), extensions);
    for (const key in extensions) {
      if (key === 'dispatch' || key === 'expose' || key === 'run') continue;
      if (!Object.prototype.hasOwnProperty.call(extensions, key)) continue;
      if (!extensions[key]) extended[key] = undefined;
    }
    return extended;
  }

  run(): Promise<EventType[]> {
    const eventSequence = this.eventQueue.reduce(
      (lastEvent, [eventType, eventInit]) =>
        lastEvent.then(async dispatched => {
          const nextEvent = this.createNextEvent(
            eventType,
            eventInit,
            dispatched[dispatched.length - 1],
          ) as EventType;
          this.node.dispatchEvent(nextEvent);
          dispatched.push(nextEvent);
          return dispatched;
        }),
      Promise.resolve<EventType[]>([]),
    );
    this.eventQueue = [];
    return eventSequence;
  }

  async then<Result = EventType[], Reason = never>(
    resolve: (value: EventType[]) => Result | PromiseLike<Result>,
    reject?: ((reason: unknown) => Reason | PromiseLike<Reason>) | null,
  ): Promise<Result | Reason> {
    try {
      const result = await this.run();
      return resolve(result);
    } catch (error) {
      if (reject) return reject(error);
      throw error;
    }
  }
}
