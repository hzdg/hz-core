/* eslint-env jest, browser */
import React from 'react';
import {render} from 'react-testing-library';
import useIntersection from '../src';

test('useIntersection gets the initial intersects', async () => {
  let intersects;
  const IntersectionUser = (): JSX.Element => {
    let ref;
    [intersects, ref] = useIntersection<HTMLDivElement>();
    return <div ref={ref} data-testid="intersects" />;
  };
  render(<IntersectionUser />);
  expect(intersects).toBe(false);
});

test('useIntersection uses an existing ref', async () => {
  let intersects;
  const IntersectionUser = (): JSX.Element => {
    const ref = React.useRef(null);
    intersects = useIntersection<HTMLDivElement>(ref);
    return <div ref={ref} data-testid="intersects" />;
  };
  render(<IntersectionUser />);
  expect(intersects).toBe(false);
});

test('useIntersection uses a handler', async () => {
  let ref;
  const IntersectionUser = (): JSX.Element => {
    ref = useIntersection<HTMLDivElement>(() => {});
    return <div ref={ref} data-testid="intersects" />;
  };
  render(<IntersectionUser />);
  expect(ref).toMatchSnapshot();
});

test('useIntersection uses an existing ref and a handler', async () => {
  let intersects;
  const IntersectionUser = (): JSX.Element => {
    const ref = React.useRef(null);
    intersects = useIntersection<HTMLDivElement>(ref, () => {});
    return <div ref={ref} data-testid="intersects" />;
  };
  render(<IntersectionUser />);
  expect(intersects).toBeUndefined();
});
