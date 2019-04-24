import ScrollMonitor from './ScrollMonitor';
import useScrolling from './useScrolling';
import useScrollPosition from './useScrollPosition';
import useScrollDirection, {UP, RIGHT, DOWN, LEFT} from './useScrollDirection';
import useScrollIntersection from './useScrollIntersection';

export const ScrollDirection = {UP, RIGHT, DOWN, LEFT};
export {
  useScrolling,
  useScrollPosition,
  useScrollDirection,
  useScrollIntersection,
};
export default ScrollMonitor;
