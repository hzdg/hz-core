/* eslint-env jest, browser */
import eho from '../src';

test('eho is implemented', () => {
  expect(() => eho()).not.toThrow();
  throw new Error('implement eho and write some tests!');
});
