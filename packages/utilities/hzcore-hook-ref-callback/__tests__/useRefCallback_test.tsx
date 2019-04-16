/* eslint-env jest, browser */
import React from 'react';
import {render} from 'react-testing-library';
import useRefCallback from '../src';

test('useRefCallback is implemented', () => {
  const RefCallbackUser = (): JSX.Element => {
    useRefCallback();
    return <div />;
  }
  const {container} = render(<RefCallbackUser />);
  expect(container).toBeInTheDocument();
  throw new Error('implement useRefCallback and write some tests!');
});
