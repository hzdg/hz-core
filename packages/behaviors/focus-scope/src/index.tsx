import React, {
  useEffect,
  useRef,
  useCallback,
  createContext,
  useState,
  useContext,
  useLayoutEffect,
} from 'react';
import warning from 'tiny-warning';
import useKeyPress, {KeyPressState} from '@hzdg/use-key-press';
import FocusTreeNode, {isTabbable} from './FocusTreeNode';
import FocusManager from './FocusManager';

export {default as FocusManager} from './FocusManager';

type PropsOf<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  E extends keyof JSX.IntrinsicElements | React.JSXElementConstructor<any>
> = JSX.LibraryManagedAttributes<E, React.ComponentPropsWithRef<E>>;

interface FocusScopeConfig<T extends React.ElementType = React.ElementType> {
  /**
   * An optional string to identify the `FocusManager` for this `FocusScope`.
   *
   * Note that ids must be unique per focus tree.
   */
  id?: string | null;
  /**
   * The React element type to render. Defaults to `'span'`.
   * If the provided value is not a react-dom component,
   * it should forward the provided ref to an underlying
   * component.
   * See https://reactjs.org/docs/forwarding-refs.html
   */
  as?: T;
  /**
   * Whether or not to 'trap' focus within this `FocusScope`.
   *
   * If `true`, then once focus is within this scope, it will be retained,
   * even when a blur occurs. Additionally, changing focus (i.e.,
   * via tab key press) will cycle through the focusable elements
   * within this scope.
   *
   * Defaults to `false`.
   */
  trap?: boolean;
  /**
   * Whether or not to focus on the first focusable element
   * in this scope when this `FocusScope` mounts.
   *
   * If this is toggled to `true` after mount, it will have no effect.
   *
   * Defaults to `false`.
   */
  autoFocus?: boolean;
  /**
   * Whether or not to restore focus to the previously focused element
   * when this `FocusScope` unmounts.
   *
   * Defaults to `false`.
   */
  restoreFocus?: boolean;
  /**
   * Optional handler for when focus enters this scope.
   *
   * Receives the `FocusEvent` and the associated `FocusManager`.
   */
  onFocus?: (
    event: FocusEvent,
    /**
     * A `FocusManager` instance for the enclosing `FocusScope`.
     * Useful for manually updating state in response to the event.
     */
    focusManager: FocusManager,
  ) => void;
  /**
   * Optional handler for when focus leaves this scope.
   *
   * Receives the `FocusEvent` and the associated `FocusManager`.
   */
  onBlur?: (
    event: FocusEvent,
    /**
     * A `FocusManager` instance for the enclosing `FocusScope`.
     * Useful for manually updating state in response to the event.
     */
    focusManager: FocusManager,
  ) => void;
  /**
   * Optional handler for when _any_ keypress occurs within scope.
   *
   * Receives the `KeyboardEvent` and the associated `FocusManager`.
   */
  onKeyPress?: (
    event: KeyboardEvent,
    /**
     * A `FocusManager` instance for the enclosing `FocusScope`.
     * Useful for manually updating state in response to the event.
     */
    focusManager: FocusManager,
  ) => void;
}

type FocusScopeRenderProp<T extends Element = Element> = (params: {
  ref: (node: T) => void;
  focusManager: FocusManager;
}) => JSX.Element;

export type FocusScopeContainerProps<
  T extends React.ElementType
> = React.PropsWithChildren<
  FocusScopeConfig<T> & Omit<PropsOf<T>, keyof FocusScopeConfig<T>>
>;

export interface FocusScopeHeadlessProps<C extends FocusScopeRenderProp>
  extends Pick<FocusScopeConfig, 'id' | 'restoreFocus' | 'autoFocus'> {
  children: C;
}

export type FocusScopeProps<
  T extends React.ElementType = 'span',
  C extends FocusScopeRenderProp | React.ReactNode | undefined = undefined
> = C extends FocusScopeRenderProp
  ? FocusScopeHeadlessProps<C>
  : FocusScopeContainerProps<T>;

interface UseFocusScopeBehaviorConfig
  extends Pick<FocusScopeConfig, 'trap' | 'onFocus' | 'onBlur'> {
  /**
   * The `FocusTreeNode` instance to use when updating focus state
   * or reacting to focus changes.
   */
  focusTreeNode: FocusTreeNode;
}

interface UseTabKeyDownHandlerConfig extends Pick<FocusScopeConfig, 'trap'> {
  /** The `FocusTreeNode` instance to use when updating focus state. */
  focusTreeNode: FocusTreeNode;
}

interface UseFocusTreeNodeConfig extends Pick<FocusScopeConfig, 'id'> {
  /** The DOM target, i.e., the element for a `FocusScope` component. */
  domTarget: React.RefObject<Element>;
}

/** Whether or not the given `children` value is a `FocusScopeRendeProp` */
const isRenderProp = (children: unknown): children is FocusScopeRenderProp =>
  typeof children === 'function';

/** The context via which a `FocusTreeNode` tree is constructed. */
const FocusTreeContext = createContext<FocusTreeNode | null>(
  typeof document === 'undefined'
    ? null
    : new FocusTreeNode(document.documentElement),
);

/**
 * `useMergedRefs` will return a callback that, when called, will update
 * all of the passed refs with the current value.
 */
function useMergedRefs<T>(
  ...refs: (React.Ref<T> | undefined)[]
): (value: T | null) => void {
  const unmerged = useRef(refs);
  unmerged.current = refs;
  return useCallback((value: T | null) => {
    for (const ref of unmerged.current) {
      if (typeof ref === 'function') {
        ref(value);
      } else if (ref && 'current' in ref) {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    }
  }, []);
}

/** Run the given callback on mount. */
function useInitialLayoutEffect(callback: () => void): void {
  useLayoutEffect(callback, []);
}

/** Run the given callback on unmount. */
function useUnmountEffect(callback: () => void): void {
  const unmountHandler = useRef(callback);
  unmountHandler.current = callback;
  useLayoutEffect(
    () => () => {
      if (typeof unmountHandler.current === 'function') {
        unmountHandler.current();
      }
    },
    [],
  );
}

/**
 * `useFocusScopeBehavior` will handle changes to focus state that occur
 * within the scope of the given `FocusTreeNode` instance.
 *
 * It may also update focus state within scope. For example, when `trap`
 * is `true`, it may refocus elements in scope when they blur.
 */
function useFocusScopeBehavior({
  focusTreeNode,
  trap,
  onFocus,
  onBlur,
}: UseFocusScopeBehaviorConfig): React.MutableRefObject<Element | null> {
  const focusedElementInScope = useRef<Element | null>(null);
  const handleFocus = useRef(onFocus);
  const handleBlur = useRef(onBlur);
  handleFocus.current = onFocus;
  handleBlur.current = onBlur;
  const handler = useCallback(
    function handleFocusEvent(event: FocusEvent) {
      const target = event.target as HTMLElement;
      const inScope = focusTreeNode.containsFocusableElement(target);
      const inScopeDeep =
        inScope || focusTreeNode.containsFocusableElement(target, true);
      const focusHandler = handleFocus.current;
      const blurHandler = handleBlur.current;
      // Call onFocus or onBlur handlers if necessary.
      if (
        typeof focusHandler === 'function' &&
        focusedElementInScope.current === null &&
        inScope
      ) {
        focusHandler(event, new FocusManager(focusTreeNode));
      } else if (
        typeof blurHandler === 'function' &&
        focusedElementInScope.current !== null &&
        !inScope &&
        !trap
      ) {
        blurHandler(event, new FocusManager(focusTreeNode));
      }

      // If the default behavior of the event has been prevented, do nothing.
      if (event.defaultPrevented) return;

      // Handle global focus containment
      if (trap) {
        if (inScopeDeep) {
          // If the target is in scope, do nothing.
          focusedElementInScope.current = inScope ? target : null;
          return;
        } else if (focusedElementInScope.current !== null) {
          // If we previously had a focused element in scope, refocus it.
          focusTreeNode.focus(focusedElementInScope.current);
        } else {
          // Otherwise, trap focus on the first element in scope.
          focusTreeNode.focusFirst();
        }
      } else {
        focusedElementInScope.current = inScope ? target : null;
      }
    },
    [focusTreeNode, focusedElementInScope, trap, handleFocus, handleBlur],
  );

  useEffect(() => {
    const subscription = focusTreeNode.subscribe(handler);
    return () => {
      subscription.unsubscribe();
    };
  }, [focusTreeNode, handler]);

  return focusedElementInScope;
}

/**
 * `useTabKeyDownHandler` will handle Tab `'keydown'` events
 * when they might effect focus state within scope of the `FocusTreeNode`.
 *
 * If `trap` is `true`, it will cycle focus through the focusable elements
 * within the given `FocusTreeNode` scope, effectively preventing focus
 * from leaving this scope.
 */
function useTabKeyHandler({
  focusTreeNode,
  trap,
}: UseTabKeyDownHandlerConfig): (state: KeyPressState) => void {
  return useCallback(
    function handleTabKey({altKey, ctrlKey, metaKey, shiftKey, event}) {
      // Skip if the default event behavior has been prevented.
      if (event?.defaultPrevented) return;
      // Skip if any of these keys are being pressed
      if (altKey || ctrlKey || metaKey) return;

      const focusedElement = focusTreeNode.getFocusedElement();

      // Don't handle if focus isn't currently in this scope.
      if (!focusedElement) {
        return;
      }

      let nextElement: Element | FocusTreeNode | null = null;

      // If the shift key is being held, focus moves in reverse order.
      if (shiftKey) {
        // First, try to focus on the previous tabbable element.
        nextElement = focusTreeNode.focusPrevious(isTabbable);
        if (trap && !nextElement) {
          // If that didn't work cuz there is no previous element,
          // but this FocusScope traps focus,
          // try to wrap around to the last tabbable element.
          nextElement = focusTreeNode.focusLast(isTabbable);
        }
      } else {
        // First, try to focus on the next tabbable element.
        nextElement = focusTreeNode.focusNext(isTabbable);
        if (trap && !nextElement) {
          // If that didn't work cuz there is no next element,
          // but this FocusScope traps focus,
          // try to wrap around to the first tabbable element.
          nextElement = focusTreeNode.focusFirst(isTabbable);
        }
      }

      if (
        nextElement &&
        focusTreeNode.containsFocusableElement(nextElement, true)
      ) {
        // If the newly focused element is in scope,
        // prevent default tab behavior.
        event?.preventDefault();
      }
    },
    [focusTreeNode, trap],
  );
}

/**
 * `useFocusTreeNode` will create a `FocusTreeNode` for the given `domTarget`
 * and with the given `id`. It will also append the created node as a child
 * of the `FocusTreeNode` in the `FocusScope` context.
 */
function useFocusTreeNode({
  domTarget,
  id,
}: UseFocusTreeNodeConfig): FocusTreeNode {
  /** The parent `FocusTreeNode`. */
  const parent = useContext(FocusTreeContext);

  /**
   * The initial `FocusTreeNode` for this scope.
   * Note that we use `setState` here for its initializer function only.
   */
  const [initialFocusTreeNode] = useState(() => {
    // Try and parent this new node right away.
    // If it fails, we may be 'reparenting' an existing node,
    // so create an orphan node initially. We will try to parent
    // the orphan as a layout effect (see the layout effect below).
    try {
      return new FocusTreeNode(domTarget, id, parent);
    } catch {
      return new FocusTreeNode(domTarget, id);
    }
  });
  /** The latest `FocusTreeNode` to have been created.*/
  const focusTreeNode = useRef(initialFocusTreeNode);

  if (
    focusTreeNode.current.domTarget !== domTarget ||
    focusTreeNode.current.id !== id
  ) {
    // If the `domTarget` or `id` have changed for this node,
    // destroy it and create a new one.
    focusTreeNode.current.remove();
    // Try and parent this new node right away.
    // If it fails, we may be 'reparenting' an existing node,
    // so create an orphan node. We will try to parent
    // the orphan as a layout effect (see the layout effect below).
    try {
      focusTreeNode.current = new FocusTreeNode(domTarget, id, parent);
    } catch {
      focusTreeNode.current = new FocusTreeNode(domTarget, id);
    }
  }

  // Try to assign a parent to this node, if it is not already assigned.
  // We do this in a layout effect so that 'reparenting' of existing
  // nodes doesn't cause problems in the in-between-render stage, where
  // the old node is still in the tree while the node is being added.
  useLayoutEffect(() => {
    if (parent && focusTreeNode.current.parent !== parent) {
      parent.appendChildNode(focusTreeNode.current);
    }
    return () => {
      focusTreeNode.current.remove();
    };
  }, [parent]);

  return focusTreeNode.current;
}

/**
 * `FocusScope` wraps its children in an element (a `span` by default),
 * and manages focus for them, both by changing focus on certain types
 * of input, and by reacting to focus changes that occur.
 */
export const FocusScope = React.forwardRef(function FocusScope(
  {
    id,
    as: Wrapper = 'span',
    onKeyPress,
    onFocus,
    onBlur,
    trap = false,
    autoFocus = false,
    restoreFocus = false,
    children,
    ...props
  }: FocusScopeConfig & {children?: React.ReactNode | FocusScopeRenderProp},
  forwardedRef: React.Ref<Element>,
): JSX.Element {
  if (__DEV__) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const forwardsRef = (v: any): boolean => {
      if (typeof v === 'string') return true;
      return v?.$$typeof === Symbol.for('react.forward_ref');
    };
    warning(
      forwardsRef(Wrapper),
      `FocusScope can only be rendered as a ReactDOM element ` +
        `or ref-forwarding component. The value for the "as" prop ` +
        `does not appear to forward its ref:\n"${Wrapper}"`,
    );

    if (isRenderProp(children)) {
      warning(
        !trap,
        `FocusScope will not trap focus when children is a function!`,
      );
      warning(
        !onFocus,
        `FocusScope doesn't support an onFocus handler when children is a function!`,
      );
      warning(
        !onBlur,
        `FocusScope doesn't support an onBlur handler when children is a function!`,
      );
      warning(
        !onKeyPress,
        `FocusScope doesn't support an onKeyPress handler when children is a function!`,
      );
    }
  }
  /** The DOM element that is rendered by this `FocusScope`. */
  const domTarget = useRef<Element>(null);
  /** A callback to sync the internal `domTarget` with a `forwardedRef`. */
  const setDomTarget = useMergedRefs(domTarget, forwardedRef);
  /** The `FocusTreeNode` for this scope. */
  const focusTreeNode = useFocusTreeNode({domTarget, id});
  /** The element to restore focus to on unmount. */
  const elementToRestore = useRef<Element | null>(null);
  /** The currently focused element in scope. */
  const focusedElementInScope = useFocusScopeBehavior({
    focusTreeNode,
    trap,
    onFocus,
    onBlur,
  });

  const tabKeyHandler = useTabKeyHandler({focusTreeNode, trap});
  /** A handler for key presses within this scope. */
  const handleKey = useCallback(
    (state: KeyPressState) => {
      if (!state.down) return;
      const nativeEvent =
        state.event && 'nativeEvent' in state.event
          ? state.event.nativeEvent
          : state.event;
      if (nativeEvent) {
        if (typeof onKeyPress === 'function') {
          onKeyPress(nativeEvent, new FocusManager(focusTreeNode));
        }
        if (state.key === 'Tab' && !nativeEvent.defaultPrevented) {
          tabKeyHandler(state);
        }
      }
    },
    [onKeyPress, tabKeyHandler, focusTreeNode],
  );
  /** Binds handlers to `keydown` events that occur within this scope. */
  const bindKeyPress = useKeyPress({onKey: handleKey});

  useInitialLayoutEffect(function() {
    elementToRestore.current = focusTreeNode.getFocusedElementGlobal();
    if (autoFocus) {
      focusTreeNode.focusFirst();
      focusedElementInScope.current = focusTreeNode.getFocusedElement();
    }
  });

  useUnmountEffect(function onUnmount() {
    if (restoreFocus && elementToRestore.current !== null) {
      focusTreeNode.focus(elementToRestore.current);
    }
    focusTreeNode.remove();
  });

  return (
    <FocusTreeContext.Provider value={focusTreeNode}>
      {isRenderProp(children) ? (
        children({
          ref: setDomTarget,
          focusManager: new FocusManager(focusTreeNode),
        })
      ) : (
        <Wrapper ref={setDomTarget} {...props} {...bindKeyPress()}>
          {children}
        </Wrapper>
      )}
    </FocusTreeContext.Provider>
  );
}) as <
  T extends React.ElementType = 'span',
  C extends FocusScopeRenderProp | React.ReactNode | undefined = undefined
>(
  props: FocusScopeProps<T, C>,
) => JSX.Element;
