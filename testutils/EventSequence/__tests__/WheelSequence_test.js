/* eslint-env jest */
import WheelSequence from '../WheelSequence';

beforeEach(() => {
  jest.useFakeTimers();
});

test.skip('WheelSequence.wheel() creates an event sequence', async () => {
  const result = await WheelSequence.create(document.createElement('div'))
    .wheel()
    .wheel()
    .wheel();

  // expect(result).toEqual([
  //   expect.objectContaining({type: 'mousedown', clientX: 0, clientY: 0}),
  //   expect.objectContaining({type: 'mousemove', clientX: 5, clientY: 3}),
  //   expect.objectContaining({type: 'mouseup', clientX: 5, clientY: 3}),
  // ]);
});
