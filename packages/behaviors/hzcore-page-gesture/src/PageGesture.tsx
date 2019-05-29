import React, {useMemo, useCallback, useReducer} from 'react';
import PropTypes from 'prop-types';
import {
  GestureState,
  GestureEndState,
  KeyboardGestureConfig,
  MouseGestureConfig,
  TouchGestureConfig,
  WheelGestureConfig,
  useConfigFor,
  useKeyboardGesture,
  useMouseGesture,
  useTouchGesture,
  useWheelGesture,
} from '@hzcore/gesture-catcher';
import usePageGesture, {
  PaginationAction,
  VERTICAL,
  HORIZONTAL,
  FIRST,
  PREVIOUS,
  NEXT,
  LAST,
  CANCELED,
  UNKNOWN,
} from './usePageGesture';
import {PageGestureConfig} from '.';

export interface PageGestureProps {
  /**
   * A function that takes page gesture state and returns a React element.
   * Also known as a 'render prop'.
   */
  children: (state: PageGestureRenderProps) => JSX.Element;
  /**
   * An optional ref object or callback ref.
   * Useful when the owner component needs to handle ref forwarding.
   */
  innerRef?: React.Ref<HTMLElement | null>;
  /**
   * Whether or not page gesture detection is enabled.
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
  /**
   * The axis along which pagination gestures should be detected.
   * Either `vertical` or `horizontal`.
   *
   * Defaults to `horizontal` (x-axis).
   */
  orientation?: typeof VERTICAL | typeof HORIZONTAL | null;
  /**
   * How far a gesture must have cumulatively moved in a direction along the
   * axis of orientation in order to be assigned a pagination intent.
   * This value is an absolute distance.
   *
   * Defaults to `50`.
   */
  threshold?: number | null;
  /**
   * A callback for when a NEXT pagination action occurs.
   */
  onNext?: () => void;
  /**
   * A callback for when a PREVIOUS pagination action occurs.
   */
  onPrevious?: () => void;
  /**
   * A callback for when a FIRST pagination action occurs.
   */
  onFirst?: () => void;
  /**
   * A callback for when a LAST pagination action occurs.
   */
  onLast?: () => void;
}

type PageGestureState =
  | GestureState
  | (GestureEndState & {action: PaginationAction});

/**
 * Page gesture state passed to the PageGesture render prop (children function).
 */
export type PageGestureRenderProps =
  | (PageGestureState & {
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

function pageGestureStateReducer(
  state: PageGestureState | null,
  action:
    | {type: PaginationAction}
    | {type: 'gesture'; payload: GestureState}
    | {type: 'gestureend'; payload: GestureEndState},
): PageGestureState | null {
  switch (action.type) {
    case NEXT:
    case PREVIOUS:
    case FIRST:
    case LAST:
    case CANCELED:
      if (state && 'gesturing' in state && !state.gesturing) {
        return {...state, action: action.type};
      } else {
        return state;
      }
    case 'gesture':
      return action.payload;
    case 'gestureend':
      return {...action.payload, action: UNKNOWN};
    default:
      return state;
  }
}

function usePageGestureConfig(
  props: PageGestureProps,
): PageGestureConfig | null {
  const {threshold, orientation} = props;
  return useMemo(() => {
    let config = null;
    if (orientation === VERTICAL || orientation === HORIZONTAL) {
      config = {...(config || {}), orientation};
    }
    if (typeof threshold === 'number') {
      config = {...(config || {}), threshold};
    }
    return config;
  }, [threshold, orientation]);
}

/**
 * A React component for implementing gesture-based pagination.
 *
 * `PageGesture` is a headless component, meaning
 * it accepts a child render prop, and returns the result
 * of calling that render prop with the latest state of
 * an ongoing gesturing, or the last state of a completed gesture
 * and it's associated pagination action.
 */
function PageGesture(props: PageGestureProps): JSX.Element {
  const [state, dispatch] = useReducer(pageGestureStateReducer, null);
  const {onStart, onMove, onEnd, onFirst, onLast, onNext, onPrevious} = props;

  const paginationConfig = usePageGestureConfig(props);

  const paginationHandler = useMemo(
    () => ({
      onFirst() {
        if (typeof onFirst === 'function') onFirst();
        dispatch({type: FIRST});
      },
      onLast() {
        if (typeof onLast === 'function') onLast();
        dispatch({type: LAST});
      },
      onNext() {
        if (typeof onNext === 'function') onNext();
        dispatch({type: NEXT});
      },
      onPrevious() {
        if (typeof onPrevious === 'function') onPrevious();
        dispatch({type: PREVIOUS});
      },
    }),
    [onFirst, onLast, onNext, onPrevious],
  );

  const updatePagination = usePageGesture(paginationHandler, paginationConfig);

  const gestureHandler = useMemo(
    () => ({
      onStart(payload: GestureState) {
        if (typeof onStart === 'function') onStart(payload);
        dispatch({type: 'gesture', payload});
        updatePagination(payload);
      },
      onMove(payload: GestureState) {
        if (typeof onMove === 'function') onMove(payload);
        dispatch({type: 'gesture', payload});
        updatePagination(payload);
      },
      onEnd(payload: GestureEndState) {
        if (typeof onEnd === 'function') onEnd(payload);
        dispatch({type: 'gestureend', payload});
        updatePagination(payload);
      },
    }),
    [updatePagination, onStart, onMove, onEnd],
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

PageGesture.propTypes = {
  children: PropTypes.func.isRequired,
  orientation: PropTypes.oneOf([VERTICAL, HORIZONTAL]),
  threshold: PropTypes.number,
  disabled: PropTypes.bool,
  passive: PropTypes.bool,
  preventDefault: PropTypes.bool,
  touch: GestureSensorConfigPropType,
  mouse: GestureSensorConfigPropType,
  wheel: GestureSensorConfigPropType,
  keyboard: GestureSensorConfigPropType,
  innerRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({
      current: PropTypes.node,
    }),
  ]),
  onStart: PropTypes.func,
  onMove: PropTypes.func,
  onEnd: PropTypes.func,
  onNext: PropTypes.func,
  onPrevious: PropTypes.func,
  onFirst: PropTypes.func,
  onLast: PropTypes.func,
};

export default PageGesture;
