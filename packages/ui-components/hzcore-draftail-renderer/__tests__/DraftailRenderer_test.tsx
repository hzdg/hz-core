/* eslint-env jest, browser */
import React from 'react';
import {render} from 'react-testing-library';
import DraftailRenderer from '../src';

test('DraftailRenderer is implemented', () => {
  const {container} = render(<DraftailRenderer headline={`test`} body={[]} />);
  expect(container).toBeInTheDocument();
});
