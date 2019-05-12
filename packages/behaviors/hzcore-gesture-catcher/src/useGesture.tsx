import useMouseGesture, {
  MouseGestureConfig,
  MouseGestureState,
  MouseGestureEndState,
} from './useMouseGesture';
import useWheelGesture, {
  WheelGestureConfig,
  WheelGestureState,
  WheelGestureEndState,
} from './useWheelGesture';
import useTouchGesture, {
  TouchGestureConfig,
  TouchGestureState,
  TouchGestureEndState,
} from './useTouchGesture';
import useKeyboardGesture, {
  KeyboardGestureConfig,
  KeyboardGestureState,
  KeyboardGestureEndState,
} from './useKeyboardGesture';

export type GestureState =
  | MouseGestureState
  | TouchGestureState
  | WheelGestureState
  | KeyboardGestureState;

export type GestureEndState =
  | MouseGestureEndState
  | TouchGestureEndState
  | WheelGestureEndState
  | KeyboardGestureEndState;

/**
 * A callback for when gesturing state changes.
 * Receives either an ongoing gesture state, or the ending gesture state.
 */
export type GestureChangeHandler = (
  state: GestureState | GestureEndState,
) => void;

export interface GestureHandlers {
  /**
   * A callback for when gesturing starts.
   * Receives the initializing gesture state.
   */
  onStart?: (state: GestureState) => void;
  /**
   * A callback for when an ongoing gesture updates.
   * Receives the latest gesture state.
   */
  onMove?: (state: GestureState) => void;
  /**
   * A callback for when a gesture has completed.
   * Receives the ending gesture state.
   */
  onEnd?: (state: GestureEndState) => void;
}

export type GestureConfig = MouseGestureConfig &
  WheelGestureConfig &
  TouchGestureConfig &
  KeyboardGestureConfig;

/**
 * A React hook for components that want to handle _any_ gesture intent.
 *
 * This hook is a 'merge' of the separate input-specific gesture hooks,
 * `useMouseGesture`, `useWheelGesture`, `useTouchGesture`, `useKeyboardGesture`.
 *
 * @returns A callback ref that should be passed to the DOM element
 *          for which gestures should be observed.
 */
export default function useGesture(
  gestureHandler: GestureChangeHandler | GestureHandlers,
  gestureConfig?: GestureConfig | null,
): (node: HTMLElement | null) => void {
  const mouseRef = useMouseGesture(gestureHandler, gestureConfig);
  const wheelRef = useWheelGesture(gestureHandler, gestureConfig);
  const touchRef = useTouchGesture(gestureHandler, gestureConfig);
  const keyboardRef = useKeyboardGesture(gestureHandler, gestureConfig);
  return (node: HTMLElement | null) => {
    mouseRef(node);
    wheelRef(node);
    touchRef(node);
    keyboardRef(node);
  };
}
