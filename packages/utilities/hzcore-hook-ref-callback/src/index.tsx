import React, {useCallback, useState, useRef} from 'react';

export type InnerRef<T> =
  | ((node: T | null) => void)
  | React.MutableRefObject<T | null>;

/**
 * A hook for components that need to know when a ref changes.
 *
 * Returns a tuple like `[ref, setRef]`, where `ref` is a ref object,
 * and `setRef` is a ref callback. Whenever the ref callback is called,
 * the ref object is updated with the value passed to the callback, and the
 * component is rerendered.
 */
export default function useRefCallback<T>(
  /**
   * An optional ref object or callback ref.
   * Useful when the component needs to handle ref forwarding.
   */
  innerRef?: InnerRef<T> | null,
): [React.RefObject<T | null>, (node: T | null) => void] {
  const [, f] = useState(false);
  const forceUpdate = useCallback(() => f(v => !v), []);
  const ref = useRef<T | null>(null);
  const callback = useCallback(
    (node: T | null) => {
      if (typeof innerRef === 'function') {
        innerRef(node);
      } else if (innerRef && 'current' in innerRef) {
        innerRef.current = node;
      }
      if (ref.current !== node) {
        ref.current = node;
        forceUpdate();
      }
    },
    [innerRef, forceUpdate],
  );
  return [ref, callback];
}
