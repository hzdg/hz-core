/* eslint-env jest, browser */
import social from '../src';

test('social is implemented', () => {
  expect(() => social()).not.toThrow();
  throw new Error('implement social and write some tests!');
});
