/* eslint-env jest, browser */
import React from 'react';
import {render} from 'react-testing-library';
import usePress from '../src';

test('usePress is implemented', () => {
  const PressUser = (): JSX.Element => {
    usePress();
    return <div />;
  }
  const {container} = render(<PressUser />);
  expect(container).toBeInTheDocument();
  throw new Error('implement usePress and write some tests!');
});
