import {UP, RIGHT, DOWN, LEFT} from './types';

export const ScrollDirection = {UP, RIGHT, DOWN, LEFT};
export {default, default as ScrollMonitor} from './ScrollMonitor';

// Uncomment to enable debugging.
// TODO: Babel plugin to DCE debug statements in production.
// require('debug').enable('ScrollMonitor:*');
// require('debug').enable('ScrollMonitor:uid*');
// require('debug').enable('ScrollMonitor:scroll');
// require('debug').enable('ScrollMonitor:viewport');
