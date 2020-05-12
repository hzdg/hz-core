import React from 'react';
import {SectionLevel, useSectionLevel} from './sectionLevel';

export interface HProps {
  children: string;
  /**
   * One of the six possible HTML5 Sectioning levels to use: 1—6.
   * If this is defined, it will be used instead
   * of the nearest sectioning context.
   */
  level?: SectionLevel;
}

const H = React.forwardRef(function H(
  {level, ...props}: HProps,
  ref: React.Ref<HTMLElement>,
): JSX.Element {
  const sectionLevel = useSectionLevel();
  return React.createElement(`h${level || sectionLevel}`, {...props, ref});
});
H.displayName = 'H';

export default H;
