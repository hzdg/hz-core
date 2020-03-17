/* eslint-env jest, browser */
import plusMinus from '../src';

test('plusMinus is implemented', () => {
  expect(() => plusMinus()).not.toThrow();
  throw new Error('implement plusMinus and write some tests!');
});
