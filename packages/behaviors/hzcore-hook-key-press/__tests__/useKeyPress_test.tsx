/* eslint-env jest, browser */
import React from 'react';
import {render} from '@testing-library/react';
import useKeyPress from '../src';

test('useKeyPress is implemented', () => {
  const KeyPressUser = (): JSX.Element => {
    useKeyPress();
    return <div />;
  };
  const {container} = render(<KeyPressUser />);
  expect(container).toBeInTheDocument();
  throw new Error('implement useKeyPress and write some tests!');
});
