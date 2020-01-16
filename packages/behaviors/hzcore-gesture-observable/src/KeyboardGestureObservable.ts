import {ensureDOMInstance} from '@hzcore/dom-utils';
import {Source} from 'callbag';
import share from 'callbag-share';
import pipe from 'callbag-pipe';
import merge from 'callbag-merge';
import filter from 'callbag-filter';
import fromEvent from 'callbag-from-event';
import scan from 'callbag-scan';
import asObservable, {DebugObservable} from './asObservable';
import {parseConfig, DebugConfig} from './ObservableConfig';

export const KEY_DOWN = 'keydown';
export const KEY_UP = 'keyup';

export const SPACE = 'Space';
export const PAGE_UP = 'PageUp';
export const PAGE_DOWN = 'PageDown';
export const END = 'End';
export const HOME = 'Home';
export const ARROW_LEFT = 'ArrowLeft';
export const ARROW_UP = 'ArrowUp';
export const ARROW_RIGHT = 'ArrowRight';
export const ARROW_DOWN = 'ArrowDown';

/**
 * Configuration for a KeyboardGestureObservable.
 */
export interface KeyboardGestureObservableConfig {
  /**
   * Whether or not to prevent the default action
   * for `keydown` or `keyup` events during a gesture.
   */
  preventDefault: boolean;
  /**
   * Whether or not to listen to keyboard events passively.
   * If `true`, then `preventDefault` will have no effect.
   */
  passive: boolean;
}

/**
 * An event assocated with a keyboard gesture.
 */
export interface KeyboardGestureEvent extends KeyboardEvent {
  type: typeof KEY_DOWN | typeof KEY_UP;
}

const CODES: [
  typeof SPACE,
  typeof PAGE_UP,
  typeof PAGE_DOWN,
  typeof END,
  typeof HOME,
  typeof ARROW_LEFT,
  typeof ARROW_UP,
  typeof ARROW_RIGHT,
  typeof ARROW_DOWN,
] = [
  SPACE,
  PAGE_UP,
  PAGE_DOWN,
  END,
  HOME,
  ARROW_LEFT,
  ARROW_UP,
  ARROW_RIGHT,
  ARROW_DOWN,
];

type Mutable<T> = {-readonly [P in keyof T]: T[P]};
type MembersOf<A> = Mutable<A> extends (infer T)[] ? T : never;

const KEY_CODES_2_CODES: Record<string, MembersOf<typeof CODES>> = {
  '32': SPACE,
  '33': PAGE_UP,
  '34': PAGE_DOWN,
  '35': END,
  '36': HOME,
  '37': ARROW_LEFT,
  '38': ARROW_UP,
  '39': ARROW_RIGHT,
  '40': ARROW_DOWN,
};

const getKeyCode = (event: KeyboardEvent): MembersOf<typeof CODES> =>
  KEY_CODES_2_CODES[event.keyCode];

const isGestureKey = (event: KeyboardEvent): event is KeyboardGestureEvent => {
  const code = getKeyCode(event);
  return CODES.some(v => code === v);
};

const isSameKey = (
  eventA: KeyboardGestureEvent,
  eventB: KeyboardGestureEvent,
): boolean => eventB && eventA && getKeyCode(eventA) === getKeyCode(eventB);

const isRepeatKey = (
  eventA: KeyboardGestureEvent,
  eventB: KeyboardGestureEvent,
): boolean =>
  isSameKey(eventA, eventB) &&
  eventB.type === eventA.type &&
  eventB.ctrlKey === eventA.ctrlKey &&
  eventB.shiftKey === eventA.shiftKey &&
  eventB.altKey === eventA.altKey &&
  eventB.metaKey === eventA.metaKey;

function getNearestFocusableNode(node: Node | null): Node {
  if (node instanceof Document) return node;
  if (!(node instanceof HTMLElement)) return document;
  if (node.tabIndex >= 0) return node;
  return getNearestFocusableNode(node.parentNode);
}

/**
 * An event type associated with a keyboard gesture.
 */
export type KeyboardGestureType = typeof KEY_DOWN | typeof KEY_UP;

interface KeyboardGestureBaseState {
  /** The latest x position for the gesture. */
  x: number;
  /** The latest y position for the gesture. */
  y: number;
  /** The cumulative change of the gesture in the x dimension. */
  xDelta: number;
  /** The cumulative change of the gesture in the y dimension. */
  yDelta: number;
  /** The initial x position for the gesture. */
  xInitial: number;
  /** The initial y position for the gesture. */
  yInitial: number;
  /** The previous x position for the gesture. */
  xPrev: number;
  /** The previous y position for the gesture. */
  yPrev: number;
  /** The latest velocity of the gesture in the x dimension. */
  xVelocity: number;
  /** The latest velocity of the gesture in the y dimension. */
  yVelocity: number;
  /** The key that triggered the gesture. */
  key: MembersOf<typeof CODES> | null;
  /** Whether or not the key that triggered the gesture is repeating. */
  repeat: boolean | null;
  /** Whether or not a gesture is ongoing. */
  gesturing: boolean;
  /** The type of event last associated with a gesture. */
  type: KeyboardGestureType | null;
  /** The timestamp of the event last associated with a gesture. */
  time: number;
  /** The initial timestamp for the gesture. */
  timeInitial: number;
  /** How long the latest update to the gesture state took. */
  duration: number;
  /** How long the gesture has been active. */
  elapsed: number;
}

/**
 * A snapshot of an in-progress keyboard gesture.
 */
export interface KeyboardGestureState extends KeyboardGestureBaseState {
  /** Indicates a gesture is ongoing. */
  gesturing: true;
  /** The type of event associated with the gesture. */
  type: typeof KEY_DOWN;
}

/**
 * The last snapshot of a completed keyboard gesture.
 */
export interface KeyboardGestureEndState extends KeyboardGestureBaseState {
  /** Indicates a gesture is no longer ongoing. */
  gesturing: false;
  /** The type of event associated with the end of a gesture. */
  type: typeof KEY_UP;
}

const DEFAULT_INITIAL_STATE: KeyboardGestureBaseState = {
  x: 0,
  y: 0,
  xDelta: 0,
  yDelta: 0,
  xInitial: 0,
  yInitial: 0,
  xPrev: 0,
  yPrev: 0,
  xVelocity: 0,
  yVelocity: 0,
  gesturing: false,
  key: null,
  repeat: null,
  type: null,
  time: Infinity,
  timeInitial: Infinity,
  duration: 0,
  elapsed: 0,
};

function reduceGestureState(
  state: KeyboardGestureBaseState,
  event: KeyboardGestureEvent,
): KeyboardGestureBaseState | KeyboardGestureState | KeyboardGestureEndState {
  const {timeStamp: time} = event;
  switch (event.type) {
    case KEY_DOWN:
      if (state.gesturing) {
        return {
          ...state,
          time,
          duration: time - state.time,
          elapsed: time - state.timeInitial,
          gesturing: true,
          type: event.type,
          key: getKeyCode(event),
          repeat: event.repeat,
        };
      } else {
        return {
          ...state,
          time,
          timeInitial: time,
          gesturing: true,
          xDelta: 0,
          yDelta: 0,
          xVelocity: 0,
          yVelocity: 0,
          type: event.type,
          key: getKeyCode(event),
          repeat: event.repeat,
        };
      }
    case KEY_UP:
      return {
        ...state,
        time,
        duration: time - state.time,
        elapsed: time - state.timeInitial,
        gesturing: false,
        type: event.type,
        key: getKeyCode(event),
        repeat: event.repeat,
      };
  }
  throw new Error(`Could not handle event ${event}`);
}

/**
 * A keyboard gesture callbag source.
 */
export function createSource(
  /** The DOM element to observe for keyboard events. */
  element: Element,
  /** Configuration for the keyboard gesture source. */
  config?: Partial<KeyboardGestureObservableConfig> | null,
): Source<KeyboardGestureState | KeyboardGestureEndState>;
export function createSource(
  /** The DOM element to observe for keyboard events. */
  element: Element,
  /** Configuration for debugging the keyboard gesture source. */
  config: DebugConfig,
): Source<KeyboardGestureEvent>;
export function createSource(
  element: Element,
  config?: Partial<KeyboardGestureObservableConfig> | DebugConfig | null,
):
  | Source<KeyboardGestureState | KeyboardGestureEndState>
  | Source<KeyboardGestureEvent> {
  ensureDOMInstance(element, Element);
  const {preventDefault, __debug: isDebug} = parseConfig(config);

  const eventSource = merge(
    fromEvent(getNearestFocusableNode(element), KEY_DOWN),
    fromEvent(document, KEY_UP),
  );

  if (isDebug) {
    return share(eventSource);
  }

  let gesturingKey: KeyboardGestureEvent | null = null;

  const shouldPreventDefault = (event: KeyboardGestureEvent): boolean => {
    return (
      event instanceof KeyboardEvent &&
      isGestureKey(event) &&
      preventDefault &&
      !event.defaultPrevented &&
      typeof event.preventDefault === 'function'
    );
  };

  const filterEvents = (event: KeyboardEvent): boolean => {
    if (!isGestureKey(event)) return false;
    if (shouldPreventDefault(event)) event.preventDefault();
    switch (event.type) {
      case KEY_DOWN: {
        if (gesturingKey) {
          if (isRepeatKey(gesturingKey, event)) {
            return true;
          }
        } else {
          gesturingKey = event;
          return true;
        }
        break;
      }
      case KEY_UP: {
        if (gesturingKey && isSameKey(gesturingKey, event)) {
          gesturingKey = null;
          return true;
        }
        break;
      }
    }
    return false;
  };

  return share(
    pipe(
      eventSource,
      filter(filterEvents),
      scan(reduceGestureState, DEFAULT_INITIAL_STATE),
    ),
  );
}

/**
 * An Observable of keyboard gestures.
 */
export function create(
  /** The DOM element to observe for keyboard events. */
  element: Element,
  /** Configuration for the KeyboardGestureObservable. */
  config?: Partial<KeyboardGestureObservableConfig> | null,
): DebugObservable<
  KeyboardGestureState | KeyboardGestureEndState,
  KeyboardGestureEvent
> {
  return asObservable(
    createSource(element, config),
    createSource(element, {__debug: true}),
  );
}

export default {create, createSource};
