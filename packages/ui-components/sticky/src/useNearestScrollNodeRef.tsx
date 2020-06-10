import {useRef, useMemo} from 'react';
import {getNearestScrollNode} from '@hzdg/scroll-monitor/src/utils';
/**
 * `useNearestScrollNodeRef` is a React hook for finding
 * the nearest scrollable element to a DOM node.
 *
 * Returns a `RefObject` pointing to the nearest scrollable element, or `null`.
 */
export default function useNearestScrollNodeRef(
  ref: React.RefObject<HTMLElement>,
): React.RefObject<HTMLElement> {
  const {current} = ref;
  const scrollNodeRef = useRef<HTMLElement | null>(null);
  scrollNodeRef.current = useMemo(() => {
    const scrollNode = getNearestScrollNode(current);
    if (scrollNode && 'documentElement' in scrollNode) {
      return scrollNode.documentElement;
    }
    return scrollNode;
  }, [current]);
  return scrollNodeRef;
}
