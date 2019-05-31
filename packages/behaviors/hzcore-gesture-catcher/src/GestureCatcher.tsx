import React, {
  useState,
  useMemo,
  useRef,
  useLayoutEffect,
  MutableRefObject,
} from 'react';
import PropTypes from 'prop-types';
import useKeyboardGesture, {KeyboardGestureConfig} from './useKeyboardGesture';
import useMouseGesture, {MouseGestureConfig} from './useMouseGesture';
import useTouchGesture, {TouchGestureConfig} from './useTouchGesture';
import useWheelGesture, {WheelGestureConfig} from './useWheelGesture';
import {GestureState, GestureEndState} from './useGesture';

export interface GestureCatcherProps<T extends HTMLElement> {
  /**
   * A function that takes gesture state and returns a React element.
   * Also known as a 'render prop'.
   */
  children: (state: GestureCatcherRenderProps<T>) => JSX.Element;
  /**
   * An optional ref object or callback ref.
   * Useful when the owner component needs to handle ref forwarding.
   */
  innerRef?: React.Ref<T>;
  /**
   * Whether or not gesture detection is enabled.
   */
  disabled?: boolean | null;
  /**
   * Whether or not to listen to gesture events passively.
   * If `true`, then `preventDefault` will have no effect.
   */
  passive?: boolean | null;
  /**
   * Whether or not to prevent the default action
   * for events during a gesture.
   */
  preventDefault?: boolean | null;
  /**
   * Either a boolean determining whether or not to detect keyboard gestures,
   * or configuration for detecting keyboard gestures. This configuration
   * inherits `passive` and `preventDefault` props.
   */
  keyboard?: KeyboardGestureConfig | boolean | null;
  /**
   * Either a boolean determining whether or not to detect mouse gestures,
   * or configuration for detecting mouse gestures. This configuration
   * inherits `passive` and `preventDefault` props.
   */
  mouse?: MouseGestureConfig | boolean | null;
  /**
   * Either a boolean determining whether or not to detect touch gestures,
   * or configuration for detecting touch gestures. This configuration
   * inherits `passive` and `preventDefault` props.
   */
  touch?: TouchGestureConfig | boolean | null;
  /**
   * Either a boolean determining whether or not to detect wheel gestures,
   * or configuration for detecting wheel gestures. This configuration
   * inherits `passive` and `preventDefault` props.
   */
  wheel?: WheelGestureConfig | boolean | null;
  /**
   * A callback for when gesturing starts.
   * Receives the initializing gesture state.
   */
  onStart?: ((state: GestureState) => void) | null;
  /**
   * A callback for when an ongoing gesture updates.
   * Receives the latest gesture state.
   */
  onMove?: ((state: GestureState) => void) | null;
  /**
   * A callback for when a gesture has completed.
   * Receives the ending gesture state.
   */
  onEnd?: ((state: GestureEndState) => void) | null;
}

export type GestureCatcherState = GestureState | GestureEndState;

/**
 * Gesture state passed to the GestureCatcher render prop (children function).
 */
export type GestureCatcherRenderProps<T extends HTMLElement> =
  | (GestureCatcherState & {
      /**
       * A ref object that should be passed to an underlying DOM node.
       */
      gestureRef: React.RefObject<T>;
    })
  | {
      /**
       * A ref object that should be passed to an underlying DOM node.
       */
      gestureRef: React.RefObject<T>;
    };

function shouldUseConfigFor<T extends HTMLElement>(
  input: 'keyboard' | 'mouse' | 'touch' | 'wheel',
  props: GestureCatcherProps<T>,
): boolean {
  const {keyboard, mouse, touch, wheel} = props;
  if (keyboard || mouse || touch || wheel) {
    return Boolean(props[input]);
  } else {
    return true;
  }
}

/**
 * `useConfigFor` will extract and return a config
 * for the specified input from the given props.
 */
function useConfigFor<T extends HTMLElement>(
  input: 'keyboard',
  props: GestureCatcherProps<T>,
): KeyboardGestureConfig | undefined;
function useConfigFor<T extends HTMLElement>(
  input: 'mouse',
  props: GestureCatcherProps<T>,
): MouseGestureConfig | undefined;
function useConfigFor<T extends HTMLElement>(
  input: 'touch',
  props: GestureCatcherProps<T>,
): TouchGestureConfig | undefined;
function useConfigFor<T extends HTMLElement>(
  input: 'wheel',
  props: GestureCatcherProps<T>,
): WheelGestureConfig | undefined;
function useConfigFor<T extends HTMLElement>(
  input: 'keyboard' | 'mouse' | 'touch' | 'wheel',
  props: GestureCatcherProps<T>,
):
  | KeyboardGestureConfig
  | MouseGestureConfig
  | TouchGestureConfig
  | WheelGestureConfig
  | undefined {
  const shouldUse = shouldUseConfigFor(input, props);
  const config = props[input];
  const {disabled, preventDefault, passive} = props;
  return useMemo(() => {
    if (!disabled && shouldUse) {
      return {
        preventDefault: preventDefault || false,
        passive: passive || false,
        ...(typeof config === 'object' ? config : {}),
      };
    }
    return undefined;
  }, [disabled, preventDefault, passive, config, shouldUse]);
}

export {useConfigFor};

/**
 * A React component for monitoring and interacting with gestures.
 *
 * `GestureCatcher` is a headless component, meaning
 * it accepts a child render prop, and returns the result
 * of calling that render prop with the latest state of
 * an ongoing or completed gesture.
 */
function GestureCatcher<T extends HTMLElement>(
  props: GestureCatcherProps<T>,
): JSX.Element {
  const gestureRef = useRef<T>(null);
  const [state, setState] = useState<GestureCatcherState | null>(null);
  const {onStart, onMove, onEnd} = props;

  const gestureHandler = useMemo(
    () => ({
      onStart(state: GestureState) {
        if (typeof onStart === 'function') onStart(state);
        setState(state);
      },
      onMove(state: GestureState) {
        if (typeof onMove === 'function') onMove(state);
        setState(state);
      },
      onEnd(state: GestureEndState) {
        if (typeof onEnd === 'function') onEnd(state);
        setState(state);
      },
    }),
    [onStart, onMove, onEnd],
  );

  const keyboardConfig = useConfigFor('keyboard', props);
  const mouseConfig = useConfigFor('mouse', props);
  const touchConfig = useConfigFor('touch', props);
  const wheelConfig = useConfigFor('wheel', props);

  const keyboardRef = useRef<T | null>(null);
  const mouseRef = useRef<T | null>(null);
  const touchRef = useRef<T | null>(null);
  const wheelRef = useRef<T | null>(null);

  useLayoutEffect(
    /**
     * `updateRefs` will sync the `gestureRef` render prop with the
     * `innerRef` `GestureCatcher` prop, and any of the configured
     * gesture refs.
     */
    function updateRefs() {
      const {innerRef} = props;
      if (typeof innerRef === 'function') {
        innerRef(gestureRef.current);
      } else if (innerRef && 'current' in innerRef) {
        (innerRef as MutableRefObject<unknown>).current = gestureRef.current;
      }
      keyboardRef.current = keyboardConfig ? gestureRef.current : null;
      mouseRef.current = mouseConfig ? gestureRef.current : null;
      touchRef.current = touchConfig ? gestureRef.current : null;
      wheelRef.current = wheelConfig ? gestureRef.current : null;
    },
  );

  useKeyboardGesture(keyboardRef, gestureHandler, keyboardConfig);
  useMouseGesture(mouseRef, gestureHandler, mouseConfig);
  useTouchGesture(touchRef, gestureHandler, touchConfig);
  useWheelGesture(wheelRef, gestureHandler, wheelConfig);

  const {children: render} = props;
  return render({...state, gestureRef});
}

const GestureSensorConfigPropType = PropTypes.oneOfType([
  PropTypes.shape({
    passive: PropTypes.bool,
    preventDefault: PropTypes.bool,
    threshold: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
  }),
  PropTypes.bool,
]);

GestureCatcher.propTypes = {
  innerRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({
      current: PropTypes.node,
    }),
  ]),
  children: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  passive: PropTypes.bool,
  preventDefault: PropTypes.bool,
  keyboard: GestureSensorConfigPropType,
  mouse: GestureSensorConfigPropType,
  touch: GestureSensorConfigPropType,
  wheel: GestureSensorConfigPropType,
  onStart: PropTypes.func,
  onMove: PropTypes.func,
  onEnd: PropTypes.func,
};

export default GestureCatcher;
