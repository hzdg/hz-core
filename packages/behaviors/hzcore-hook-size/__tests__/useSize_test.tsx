/* eslint-env jest, browser */
import React from 'react';
import {render, getByTestId} from 'react-testing-library';
import useSize, {Size} from '../src';

const SizeUser = (): JSX.Element => {
  const [size, ref] = useSize();
  return (
    <div ref={ref}>
      <pre data-testid="sizeState">{JSON.stringify(size, null, 2)}</pre>
    </div>
  );
};

const getSize = (container: HTMLElement): Size =>
  JSON.parse(getByTestId(container, 'sizeState').innerHTML);

test('useSize gets the initial size', async () => {
  const {container} = render(<SizeUser />);
  expect(container).toBeInTheDocument();
  expect(getSize(container)).toMatchObject({
    x: null,
    y: null,
    top: null,
    right: null,
    bottom: null,
    left: null,
    width: null,
    height: null,
    vw: null,
    vh: null,
  });
});
