/* eslint-env jest, browser */
import React from 'react';
import {render} from '@testing-library/react';
import useRatioSize from '../src';

test('useRatioSize is implemented', () => {
  const RatioSizeUser = (): JSX.Element => {
    useRatioSize();
    return <div />;
  };
  const {container} = render(<RatioSizeUser />);
  expect(container).toBeInTheDocument();
});

test('useRatioSize returns the right ratio based on default 16:9', () => {
  const RatioSizeUser = (): JSX.Element => {
    const [playerSize] = useRatioSize();
    return (
      <>
        <div data-testid="container-width">{playerSize.width}</div>
        <div data-testid="container-height">{playerSize.height}</div>
      </>
    );
  };
  const {getByTestId} = render(<RatioSizeUser />);
  const height = parseInt(getByTestId('container-height').textContent || '0');
  const width = parseInt(getByTestId('container-width').textContent || '0');
  expect(Math.floor((height / width) * 1000)).toEqual(562);
});

test('useRatioSize returns the right ratio based on default 4:3', () => {
  const RatioSizeUser = (): JSX.Element => {
    const [playerSize] = useRatioSize({options: {ratio: 0.75}});
    return (
      <>
        <div data-testid="container-width">{playerSize.width}</div>
        <div data-testid="container-height">{playerSize.height}</div>
      </>
    );
  };
  const {getByTestId} = render(<RatioSizeUser />);
  const height = parseInt(getByTestId('container-height').textContent || '0');
  const width = parseInt(getByTestId('container-width').textContent || '0');
  expect(Math.floor((height / width) * 1000)).toEqual(750);
});

test('useRatioSize returns the right ratio based on default 6:19 width height being taller', () => {
  const RatioSizeUser = (): JSX.Element => {
    const [playerSize] = useRatioSize({options: {ratio: 3.167}});
    return (
      <>
        <div data-testid="container-width">{playerSize.width}</div>
        <div data-testid="container-height">{playerSize.height}</div>
      </>
    );
  };
  const {getByTestId} = render(<RatioSizeUser />);
  const height = parseInt(getByTestId('container-height').textContent || '0');
  const width = parseInt(getByTestId('container-width').textContent || '0');
  expect(Math.floor((height / width) * 1000)).toEqual(3167);
});
