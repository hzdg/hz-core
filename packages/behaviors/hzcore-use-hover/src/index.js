// @flow

import {useState} from 'react';

import type {ReturnedHoverProps, Props} from './types.js';

export default function useHover({
  mouseEnterDelayMS = 0,
  mouseLeaveDelayMS = 0,
  focusable = false,
}: Props): [boolean, ReturnedHoverProps] {
  const [isHovering, setIsHovering] = useState(false);
  let mouseEnterTimer;
  let mouseOutTimer;

  function HoverPropsFactory(): ReturnedHoverProps {
    const onMouseEnter = () => {
      clearTimeout(mouseOutTimer);
      mouseEnterTimer = setTimeout(
        () => setIsHovering(true),
        mouseEnterDelayMS,
      );
    };

    const onMouseLeave = () => {
      clearTimeout(mouseEnterTimer);
      mouseOutTimer = setTimeout(() => setIsHovering(false), mouseLeaveDelayMS);
    };

    const onBlur = focusable ? onMouseLeave : null;
    const onFocus = focusable ? onMouseEnter : null;

    return {
      onMouseEnter,
      onMouseLeave,
      onBlur,
      onFocus,
    };
  }

  return [isHovering, HoverPropsFactory()];
}
