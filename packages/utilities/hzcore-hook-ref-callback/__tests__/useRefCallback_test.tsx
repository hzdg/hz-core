/* eslint-env jest, browser */
import React, {useRef} from 'react';
import {render, getByTestId} from 'react-testing-library';
import useRefCallback from '../src';

test('useRefCallback rerenders with a ref', () => {
  let refs: React.RefObject<HTMLElement>[] = [];
  const RefCallbackUser = (): JSX.Element => {
    const [ref, setRef] = useRefCallback<HTMLElement>();
    refs.push(ref);
    return <div ref={setRef} data-testid="ref" />;
  };
  const {container} = render(<RefCallbackUser />);
  expect(container).toBeInTheDocument();
  // Component should render twice: once on mount,
  // and again when the`setRef` has been called.
  expect(refs).toHaveLength(2);
  expect(refs[0]).toBe(refs[1]);
  expect(refs[1].current).toBe(getByTestId(container, 'ref'));
});

test('useRefCallback accepts an innerRef Ref Object', () => {
  let innerRef: React.RefObject<HTMLElement> | undefined;
  const RefCallbackUser = (): JSX.Element => {
    innerRef = useRef(null);
    const [, setRef] = useRefCallback(innerRef);
    return <div ref={setRef} data-testid="ref" />;
  };
  const {container} = render(<RefCallbackUser />);
  expect(innerRef).toBeDefined();
  expect((innerRef as React.RefObject<HTMLElement>).current).toBe(
    getByTestId(container, 'ref'),
  );
});

test('useRefCallback accepts an innerRef callback', () => {
  const innerRefCallback = jest.fn();
  const RefCallbackUser = (): JSX.Element => {
    const [, setRef] = useRefCallback(innerRefCallback);
    return <div ref={setRef} data-testid="ref" />;
  };
  const {container} = render(<RefCallbackUser />);
  expect(innerRefCallback).toHaveBeenCalledWith(null);
  expect(innerRefCallback).toHaveBeenLastCalledWith(
    getByTestId(container, 'ref'),
  );
});
