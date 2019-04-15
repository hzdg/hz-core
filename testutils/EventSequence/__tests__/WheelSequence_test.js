/* eslint-env jest, browser */
import WheelSequence from '../WheelSequence';

beforeEach(() => {
  jest.useFakeTimers();
});

test('WheelSequence.wheel() creates an event sequence', async () => {
  const result = await WheelSequence.create(document.createElement('div'))
    .wheel()
    .wheel({deltaX: -3, deltaY: -2})
    .wheel();

  expect(result).toEqual([
    expect.objectContaining({type: 'wheel', deltaX: 0, deltaY: 1}),
    expect.objectContaining({type: 'wheel', deltaX: -3, deltaY: -2}),
    expect.objectContaining({type: 'wheel', deltaX: 0, deltaY: 1}),
  ]);
});
