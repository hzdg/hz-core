import {useState, useCallback, useRef} from 'react';
import {
  KeyPressHandler,
  KeyPressState,
  KeyPressPhase,
  pickHandlers,
  getPhase,
  getTimeStamp,
  isKeyboardEvent,
  assertUnreachable,
} from './handler';
import {
  WhitespaceKeyPressUserHandlers,
  applyWhitespaceHandlers,
} from './whitespace';
import {UIKeyPressUserHandlers, applyUIHandlers} from './ui';
import {
  NavigationKeyPressUserHandlers,
  applyNavigationHandlers,
} from './navigation';
import useValueObject from '@hzcore/hook-value-object';

type AtLeastOneOf<T, U = {[K in keyof T]: Pick<T, K>}> = Partial<T> &
  U[keyof U];

type DomTarget = EventTarget | React.RefObject<EventTarget>;

interface EventOptions {
  /** If `true`, keyboard events will be captured.*/
  capture?: boolean;
  /** If `true`, the listener should not call `preventDefault()`. */
  passive?: boolean;
}

export interface UseKeyPressConfig {
  /**
   * Whether or not key presses are enabled. Useful for toggling
   * keyboard behavior on or off.
   *
   * Default is `true`.
   */
  enabled?: boolean;
  /**
   * Optional config for the key event listener.
   * These options reflect the same DOM `addEventListener` options.
   */
  eventOptions?: Partial<EventOptions>;
  /**
   * An optional target element or React ref. If defined,
   * the `bind()` function should be run as an effect,
   * not spread as props on a React component.
   */
  domTarget?: DomTarget;
}

type UseKeyPressWithDomTargetConfig = UseKeyPressConfig & {
  domTarget: DomTarget;
};

interface GenericKeyPressUserHandlers {
  onKeyPress?: KeyPressHandler;
  onKeyRelease?: KeyPressHandler;
  onKey?: KeyPressHandler;
}

type KeyPressUserHandlers = GenericKeyPressUserHandlers &
  WhitespaceKeyPressUserHandlers &
  UIKeyPressUserHandlers &
  NavigationKeyPressUserHandlers;

type KeyPressUserHandlersPartial = AtLeastOneOf<KeyPressUserHandlers>;

interface ReactEventHandlers {
  onKeyDown?: React.KeyboardEventHandler;
  onKeyUp?: React.KeyboardEventHandler;
}

type Bind<
  T extends UseKeyPressConfig
> = T extends UseKeyPressWithDomTargetConfig
  ? () => () => void
  : () => ReactEventHandlers;

type Subscription =
  | {
      target: EventTarget;
      unsubscribe: () => void;
    }
  | {target: null};

function applyGenericHandlers(
  state: KeyPressState,
  phase: KeyPressPhase,
  handlers: GenericKeyPressUserHandlers,
): void {
  pickHandlers(handlers, 'onKeyPress', 'onKey', 'onKeyRelease')(phase)?.(state);
}

function hasDomTarget(
  config?: UseKeyPressConfig,
): config is UseKeyPressWithDomTargetConfig {
  return Boolean(config?.domTarget);
}

function getDomTarget(
  config: UseKeyPressWithDomTargetConfig,
): EventTarget | null {
  return 'current' in config.domTarget
    ? config.domTarget.current
    : config.domTarget;
}

type KeyPressStateInternal = KeyPressState & {activeKeys: Set<string>};

type KeyPressAction = React.KeyboardEvent | KeyboardEvent;

function updateState(
  state: KeyPressStateInternal,
  action: KeyPressAction,
): void {
  const phase = getPhase(action);
  const timeStamp = getTimeStamp(action);
  state.event = action;
  state.key = action.key;
  state.shiftKey = action.shiftKey;
  state.ctrlKey = action.ctrlKey;
  state.altKey = action.altKey;
  state.metaKey = action.metaKey;
  state.first = phase === KeyPressPhase.Press;
  state.last = phase === KeyPressPhase.Release;
  state.down = phase === KeyPressPhase.Press || phase === KeyPressPhase.Repeat;
  state.active = state.down;
  state.repeat = phase === KeyPressPhase.Repeat ? state.repeat + 1 : 0;
  state.startTime = state.first ? timeStamp : state.startTime;
  state.elapsedTime = timeStamp - state.startTime;
  state.timeStamp = timeStamp;

  if (state.active && !state.activeKeys.has(state.key)) {
    state.activeKeys.add(state.key);
  } else if (state.activeKeys.has(state.key)) {
    state.activeKeys.delete(state.key);
  }
}

function snapshotChord(state: KeyPressStateInternal): string[] {
  const chord = [];
  for (const key of state.activeKeys) {
    if (key === state.key) continue;
    chord.push(key);
  }
  return chord;
}

function snapshotState(state: KeyPressStateInternal): KeyPressState {
  return {
    event: state.event,
    key: state.key,
    shiftKey: state.shiftKey,
    ctrlKey: state.ctrlKey,
    altKey: state.altKey,
    metaKey: state.metaKey,
    first: state.first,
    last: state.last,
    down: state.down,
    active: state.active,
    repeat: state.repeat,
    startTime: state.startTime,
    elapsedTime: state.elapsedTime,
    timeStamp: state.timeStamp,
    chord: snapshotChord(state),
  };
}

function useKeyPress(
  handlers: KeyPressUserHandlersPartial,
  config: UseKeyPressWithDomTargetConfig,
): Bind<UseKeyPressWithDomTargetConfig>;
function useKeyPress(
  handlers: KeyPressUserHandlersPartial,
  config?: UseKeyPressConfig,
): Bind<UseKeyPressConfig>;
function useKeyPress<Config extends UseKeyPressConfig>(
  handlersProp: KeyPressUserHandlersPartial,
  configProp?: Config,
): Bind<Config> {
  const handlers = useRef(handlersProp);
  handlers.current = handlersProp;

  const config = useRef(configProp);
  config.current = configProp;

  const eventOptions = useValueObject(config.current?.eventOptions);

  const [state] = useState<KeyPressStateInternal>(() => ({
    event: null,
    key: null,
    down: false,
    repeat: 0,
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    startTime: 0,
    elapsedTime: 0,
    timeStamp: 0,
    first: true,
    last: false,
    active: false,
    chord: [],
    activeKeys: new Set(),
  }));

  const dispatch = useCallback(
    (nextState: KeyPressState, phase: KeyPressPhase) => {
      applyUIHandlers(nextState, phase, handlers.current);
      applyNavigationHandlers(nextState, phase, handlers.current);
      applyWhitespaceHandlers(nextState, phase, handlers.current);
      applyGenericHandlers(nextState, phase, handlers.current);
    },
    [],
  );

  const dispatchRepeat = useCallback(
    (nextState: KeyPressState) => dispatch(nextState, KeyPressPhase.Repeat),
    [dispatch],
  );

  const dispatchPress = useCallback(
    (nextState: KeyPressState) => dispatch(nextState, KeyPressPhase.Press),
    [dispatch],
  );

  const dispatchRelease = useCallback(
    (nextState: KeyPressState) => {
      return dispatch(nextState, KeyPressPhase.Release);
    },
    [dispatch],
  );

  const eventHandler = useCallback(
    (event: React.KeyboardEvent | KeyboardEvent | Event) => {
      if (!isKeyboardEvent(event)) return;
      const phase = getPhase(event);
      updateState(state, event);
      switch (phase) {
        case KeyPressPhase.Press: {
          return dispatchPress(snapshotState(state));
        }
        case KeyPressPhase.Repeat: {
          return dispatchRepeat(snapshotState(state));
        }
        case KeyPressPhase.Release: {
          return dispatchRelease(snapshotState(state));
        }
        default: {
          assertUnreachable(phase, false);
        }
      }
    },
    [state, dispatchPress, dispatchRepeat, dispatchRelease],
  );

  const [subscription] = useState<Subscription>(() => ({target: null}));

  const subscribeIfNecessary = useCallback(() => {
    if (config.current?.enabled === false) {
      if (subscription.target) {
        subscription.unsubscribe();
        Object.assign(subscription, {target: null, unsubscribe: null});
      }
      return;
    }

    if (hasDomTarget(config.current)) {
      const domTarget = getDomTarget(config.current);
      if (subscription.target && subscription.target !== domTarget) {
        subscription.unsubscribe();
        Object.assign(subscription, {target: null, unsubscribe: null});
      }
      if (domTarget && subscription.target !== domTarget) {
        domTarget.addEventListener('keydown', eventHandler, eventOptions);
        domTarget.addEventListener('keyup', eventHandler, eventOptions);
        const unsubscribe = (): void => {
          domTarget.removeEventListener('keydown', eventHandler, eventOptions);
          domTarget.removeEventListener('keyup', eventHandler, eventOptions);
        };
        Object.assign(subscription, {target: domTarget, unsubscribe});
      }
    }
  }, [subscription, eventHandler, eventOptions]);

  const bind = useCallback(() => {
    if (hasDomTarget(config.current)) {
      return subscribeIfNecessary;
    } else {
      return {onKeyDown: eventHandler, onKeyUp: eventHandler};
    }
  }, [eventHandler, subscribeIfNecessary]);

  return bind as Bind<Config>;
}

export default useKeyPress;
