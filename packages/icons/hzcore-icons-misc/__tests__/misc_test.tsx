/* eslint-env jest, browser */
import misc from '../src';

test('misc is implemented', () => {
  expect(() => misc()).not.toThrow();
  throw new Error('implement misc and write some tests!');
});
