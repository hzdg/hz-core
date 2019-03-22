// @flow

import {useState} from 'react';

import type {ReturnedHoverProps, Props} from './types';

export default function useHover({
  mouseEnterDelayMS = 0,
  mouseLeaveDelayMS = 0,
}: Props): [boolean, ReturnedHoverProps] {
  const [isHovering, setIsHovering] = useState(false);

  let mouseEnterTimer;
  let mouseOutTimer;

  const hoverProps = {
    onMouseEnter: () => {
      clearTimeout(mouseOutTimer);
      mouseEnterTimer = setTimeout(
        () => setIsHovering(true),
        mouseEnterDelayMS,
      );
    },
    onMouseLeave: () => {
      clearTimeout(mouseEnterTimer);
      mouseOutTimer = setTimeout(() => setIsHovering(false), mouseLeaveDelayMS);
    },
  };

  return [isHovering, hoverProps];
}
