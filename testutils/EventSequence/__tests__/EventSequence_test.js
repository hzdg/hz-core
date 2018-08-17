/* eslint-env jest */
import EventSequence from '../EventSequence';

beforeEach(() => {
  jest.useFakeTimers();
});

test('EventSequence', async () => {
  const handler = jest.fn();
  const node = document.createElement('div');

  node.addEventListener('start', handler);
  node.addEventListener('end', handler);

  await EventSequence.create(node)
    .dispatch('start')
    .dispatch('end')
    .then(handler);

  node.removeEventListener('start', handler);
  node.removeEventListener('end', handler);

  expect(handler).toBeCalledTimes(3);
  expect(handler).nthCalledWith(1, expect.objectContaining({type: 'start'}));
  expect(handler).nthCalledWith(2, expect.objectContaining({type: 'end'}));
  expect(handler).lastCalledWith([
    expect.objectContaining({type: 'start'}),
    expect.objectContaining({type: 'end'}),
  ]);
});
