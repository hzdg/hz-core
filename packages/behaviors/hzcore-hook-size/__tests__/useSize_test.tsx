/** @jsdom-global Object */
/* eslint-env jest, browser */
import React from 'react';
import {render} from '@testing-library/react';
import useSize from '../src';

// We have to mock these aspects of HTMLElement because
// the underlying ResizeObserver polyfill uses them,
// but they're all `0` by default, resulting in no resize broadcasts!
let clientWidthSpy: jest.SpyInstance | null;
let clientHeightSpy: jest.SpyInstance | null;
let styleSpy: jest.SpyInstance | null;

beforeEach(() => {
  jest.useFakeTimers();

  clientWidthSpy = jest
    .spyOn(HTMLElement.prototype, 'clientWidth', 'get')
    .mockImplementation(() => 120);

  clientHeightSpy = jest
    .spyOn(HTMLElement.prototype, 'clientHeight', 'get')
    .mockImplementation(() => 120);

  // Use a default style value as the base for our mocked value.
  const baseStyle = document.createElement('div').style;

  styleSpy = jest
    .spyOn(HTMLElement.prototype, 'style', 'get')
    .mockImplementation(() => ({
      ...baseStyle,
      width: '120',
      height: '120',
    }));
});

afterEach(() => {
  if (clientWidthSpy) clientWidthSpy.mockRestore();
  if (clientHeightSpy) clientHeightSpy.mockRestore();
  if (styleSpy) styleSpy.mockRestore();
  clientWidthSpy = null;
  clientHeightSpy = null;
  styleSpy = null;
});

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
  jest.runAllTimers();
  expect(getByTestId('size')).toMatchSnapshot();
});

test('useSize passes the initial size to a handler', async () => {
  const handler = jest.fn();
  const SizeUser = (): JSX.Element => {
    const ref = useSize<HTMLDivElement>(handler);
    return <div ref={ref} />;
  };
  render(<SizeUser />);
  jest.runAllTimers();
  expect(handler.mock.calls).toMatchSnapshot();
});

test('useSize uses an existing ref', async () => {
  const SizeUser = (): JSX.Element => {
    const [node, setNode] = React.useState<HTMLDivElement | null>(null);
    const ref = React.useRef(node);
    ref.current = node;
    const size = useSize<HTMLDivElement>(ref);
    return (
      <div ref={node => setNode(node)} data-testid="size">
        {JSON.stringify(size, null, 2)}
      </div>
    );
  };
  const {getByTestId} = render(<SizeUser />);
  jest.runAllTimers();
  expect(getByTestId('size')).toMatchSnapshot();
});

test('useSize uses an existing ref and a handler', async () => {
  const handler = jest.fn();
  const SizeUser = (): JSX.Element => {
    const [node, setNode] = React.useState<HTMLDivElement | null>(null);
    const ref = React.useRef(node);
    ref.current = node;
    useSize<HTMLDivElement>(ref, handler);
    return <div ref={node => setNode(node)} />;
  };
  render(<SizeUser />);
  jest.runAllTimers();
  expect(handler.mock.calls).toMatchSnapshot();
});
