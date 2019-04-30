/* eslint-env jest, browser */
import React from 'react';
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

test('useRefCallback accepts and updates an innerRef Ref Object', () => {
  const innerRef1 = React.createRef();
  const innerRef2 = React.createRef();
  // eslint-disable-next-line react/display-name
  const RefCallbackUser = React.forwardRef(
    (_, forwardedRef): JSX.Element => {
      const [, setRef] = useRefCallback(forwardedRef);
      return <div ref={setRef} data-testid="ref" />;
    },
  );
  const {container} = render(<RefCallbackUser ref={innerRef1} />);
  expect(innerRef1.current).toBe(getByTestId(container, 'ref'));
  render(<RefCallbackUser ref={innerRef2} />, {container});
  expect(innerRef2.current).toBe(getByTestId(container, 'ref'));
});

test('useRefCallback accepts and updates an innerRef callback', () => {
  const innerRefCallback1 = jest.fn();
  const innerRefCallback2 = jest.fn();
  // eslint-disable-next-line react/display-name
  const RefCallbackUser = React.forwardRef(
    (_, forwardedRef): JSX.Element => {
      const [, setRef] = useRefCallback(forwardedRef);
      return <div ref={setRef} data-testid="ref" />;
    },
  );
  const {container} = render(<RefCallbackUser ref={innerRefCallback1} />);
  expect(innerRefCallback1).toHaveBeenLastCalledWith(
    getByTestId(container, 'ref'),
  );
  render(<RefCallbackUser ref={innerRefCallback2} />, {container});
  expect(innerRefCallback2).toHaveBeenLastCalledWith(
    getByTestId(container, 'ref'),
  );
});
