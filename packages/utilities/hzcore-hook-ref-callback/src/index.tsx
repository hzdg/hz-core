import React, {useCallback, useState, useRef} from 'react';

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
  innerRef?: ((node: T | null) => void) | React.MutableRefObject<T | null>,
): [(node: T | null) => void, React.RefObject<T | null>] {
  const [currentNode, setNode] = useState<T | null>(null);
  const ref = useRef<T | null>(null);
  ref.current = currentNode;
  if (innerRef) {
    if (typeof innerRef === 'function') {
      innerRef(currentNode);
    } else {
      innerRef.current = currentNode;
    }
  }
  const callback = useCallback((node: T | null) => {
    if (ref.current !== node) {
      setNode(node);
    }
  }, []);
  return [callback, ref];
}
