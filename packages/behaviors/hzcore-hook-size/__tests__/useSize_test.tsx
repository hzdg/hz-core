/* eslint-env jest, browser */
import React from 'react';
import {render, fireEvent, act} from 'react-testing-library';
import useSize from '../src';

test('useSize gets the initial size', async () => {
  const SizeUser = (): JSX.Element => {
    const [size, ref] = useSize<HTMLDivElement>();
    return (
      <div ref={ref} data-testid="size">
        {JSON.stringify(size, null, 2)}
      </div>
    );
  };
  const {getByTestId} = render(<SizeUser />);
  expect(getByTestId('size')).toMatchSnapshot();
});

test('useSize passes the initial size to a handler', async () => {
  const handler = jest.fn();
  const SizeUser = (): JSX.Element => {
    const ref = useSize<HTMLDivElement>(handler);
    return <div ref={ref} />;
  };
  render(<SizeUser />);
  expect(handler.mock.calls).toMatchSnapshot();
});

test('useSize uses an existing ref', async () => {
  const SizeUser = (): JSX.Element => {
    const ref = React.useRef(null);
    const size = useSize<HTMLDivElement>(ref);
    return (
      <div ref={ref} data-testid="size">
        {JSON.stringify(size, null, 2)}
      </div>
    );
  };
  const {getByTestId} = render(<SizeUser />);
  expect(getByTestId('size')).toMatchSnapshot();
});

test('useSize uses an existing ref and a handler', async () => {
  const handler = jest.fn();
  const SizeUser = (): JSX.Element => {
    const ref = React.useRef(null);
    useSize<HTMLDivElement>(handler, ref);
    return <div ref={ref} />;
  };
  render(<SizeUser />);
  expect(handler.mock.calls).toMatchSnapshot();
});
