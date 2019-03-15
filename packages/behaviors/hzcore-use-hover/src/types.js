export type ReturnedHoverProps = {
  onMouseEnter: () => void,
  onMouseLeave: () => void,
  onBlur: null | (() => void),
  onFocus: null | (() => void),
};

export type Props = {
  mouseEnterDelayMS?: number,
  mouseLeaveDelayMS?: number,
  focusable?: boolean,
};
