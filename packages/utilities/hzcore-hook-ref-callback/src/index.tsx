import React, {useCallback, useState, useRef} from 'react';

export default function useRefCallback<T>(
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
