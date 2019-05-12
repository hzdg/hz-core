import React, {useState, useMemo, useCallback} from 'react';
import PropTypes from 'prop-types';
import useKeyboardGesture, {KeyboardGestureConfig} from './useKeyboardGesture';
import useMouseGesture, {MouseGestureConfig} from './useMouseGesture';
import useTouchGesture, {TouchGestureConfig} from './useTouchGesture';
import useWheelGesture, {WheelGestureConfig} from './useWheelGesture';
import {GestureState, GestureEndState} from './useGesture';

export interface GestureCatcherProps {
  /**
   * A function that takes gesture state and returns a React element.
   * Also known as a 'render prop'.
   */
  children: (state: GestureCatcherRenderProps) => JSX.Element;
  /**
   * An optional ref object or callback ref.
   * Useful when the owner component needs to handle ref forwarding.
   */
  innerRef?: React.Ref<HTMLElement | null>;
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
export type GestureCatcherRenderProps =
  | (GestureCatcherState & {
      /**
       * A callback ref that should be passed to an underlying DOM node.
       */
      gestureRef: (node: HTMLElement | null) => void;
    })
  | {
      /**
       * A callback ref that should be passed to an underlying DOM node.
       */
      gestureRef: (node: HTMLElement | null) => void;
    };

function shouldUseConfigFor(
  input: 'keyboard' | 'mouse' | 'touch' | 'wheel',
  props: GestureCatcherProps,
): boolean {
  const {keyboard, mouse, touch, wheel} = props;
  if (keyboard || mouse || touch || wheel) {
    return Boolean(props[input]);
  } else {
    return true;
  }
}

function useConfigFor(
  input: 'keyboard',
  props: GestureCatcherProps,
): KeyboardGestureConfig | null;
function useConfigFor(
  input: 'mouse',
  props: GestureCatcherProps,
): MouseGestureConfig | null;
function useConfigFor(
  input: 'touch',
  props: GestureCatcherProps,
): TouchGestureConfig | null;
function useConfigFor(
  input: 'wheel',
  props: GestureCatcherProps,
): WheelGestureConfig | null;
function useConfigFor(
  input: 'keyboard' | 'mouse' | 'touch' | 'wheel',
  props: GestureCatcherProps,
):
  | KeyboardGestureConfig
  | MouseGestureConfig
  | TouchGestureConfig
  | WheelGestureConfig
  | null {
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
    return null;
  }, [disabled, preventDefault, passive, config, shouldUse]);
}

/**
 * A React component for monitoring and interacting with gestures.
 *
 * `GestureCatcher` is a headless component, meaning
 * it accepts a child render prop, and returns the result
 * of calling that render prop with the latest state of
 * an ongoing or completed gesture.
 */
function GestureCatcher(props: GestureCatcherProps): JSX.Element {
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

  const keyboardRef = useKeyboardGesture(gestureHandler, keyboardConfig);
  const mouseRef = useMouseGesture(gestureHandler, mouseConfig);
  const touchRef = useTouchGesture(gestureHandler, touchConfig);
  const wheelRef = useWheelGesture(gestureHandler, wheelConfig);

  const gestureRef = useCallback(
    (node: HTMLElement | null): void => {
      if (keyboardConfig) keyboardRef(node);
      if (mouseConfig) mouseRef(node);
      if (touchConfig) touchRef(node);
      if (wheelConfig) wheelRef(node);
    },
    [
      keyboardConfig,
      mouseConfig,
      touchConfig,
      wheelConfig,
      keyboardRef,
      mouseRef,
      touchRef,
      wheelRef,
    ],
  );

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
