import React, {useRef, useEffect} from 'react';

function isSameOrDescendantOf(
  maybeAncestor: Node | null,
  node: Node | null,
): boolean {
  if (!maybeAncestor || !node) return false;
  if (maybeAncestor === node) return true;
  let parent = node.parentElement;
  while (parent) {
    if (parent === maybeAncestor) return true;
    parent = parent.parentElement;
  }
  return false;
}

/**
 * `useClickOutsideCallback` will call the given callback function
 * whenever a click event is detected 'outside' of the element currently
 * referenced by the returned ref object.
 *
 * This is useful for behaviors like closing a popover or modal
 * by clicking 'behind' or 'around' it.
 */
export default function useClickOutsideCallback<TRef extends Element = Element>(
  callback?: ((event: MouseEvent) => void) | null,
): React.RefObject<TRef> {
  const clickOutsideRef = useRef<TRef>(null);
  useEffect(() => {
    if (typeof callback === 'function' && typeof document !== 'undefined') {
      const handleClickOutside = (event: MouseEvent): void => {
        if (
          clickOutsideRef.current &&
          !isSameOrDescendantOf(
            clickOutsideRef.current,
            event.target as Node | null,
          )
        ) {
          callback(event);
        }
      };
      // options param specifies capture only ignoring events from within
      // this prevents some corner cases that arise when inner elements are
      // manipulated or replaced by react
      document.addEventListener('click', handleClickOutside, {capture: true});
      return () => {
        document.removeEventListener('click', handleClickOutside, {
          capture: true,
        });
      };
    }
  }, [callback]);
  return clickOutsideRef;
}
