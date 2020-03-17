/* eslint-env jest, browser */
import arrow from '../src';

test('arrow is implemented', () => {
  expect(() => arrow()).not.toThrow();
  throw new Error('implement arrow and write some tests!');
});
