// See https://github.com/kentcdodds/react-testing-library#global-config
import 'jest-dom/extend-expect';
import 'react-testing-library/cleanup-after-each';

// Globally mock rAF so that it can be advanced using jest's fake timers.
// See https://github.com/facebook/jest/issues/5147
global.requestAnimationFrame = fn => setTimeout(fn, 16);
global.cancelAnimationFrame = id => clearTimeout(id);
