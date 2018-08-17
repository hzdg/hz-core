/* eslint-env jest */
import MouseSequence from '../MouseSequence';

beforeEach(() => {
  jest.useFakeTimers();
});

test('MouseSequence.down() reveals subsequence', async () => {
  const handler = jest.fn();
  const node = document.createElement('div');

  node.addEventListener('mousedown', handler);
  node.addEventListener('mousemove', handler);
  node.addEventListener('mouseup', handler);

  let sequence = MouseSequence.create(node);
  expect(sequence).not.toHaveProperty('move', expect.any(Function));
  expect(sequence).not.toHaveProperty('up', expect.any(Function));

  sequence = sequence.down();
  expect(sequence).not.toHaveProperty('down', expect.any(Function));
  expect(sequence).toHaveProperty('move', expect.any(Function));
  expect(sequence).toHaveProperty('up', expect.any(Function));

  sequence = sequence.move();
  expect(sequence).not.toHaveProperty('down', expect.any(Function));
  expect(sequence).toHaveProperty('move', expect.any(Function));
  expect(sequence).toHaveProperty('up', expect.any(Function));

  sequence = sequence.up();
  expect(sequence).toHaveProperty('down', expect.any(Function));
  expect(sequence).not.toHaveProperty('move', expect.any(Function));
  expect(sequence).not.toHaveProperty('up', expect.any(Function));

  await sequence.then(handler);

  node.removeEventListener('mousedown', handler);
  node.removeEventListener('mousemove', handler);
  node.removeEventListener('mouseup', handler);

  expect(handler).toHaveBeenCalledTimes(4);

  const expectedOrder = [
    expect.objectContaining({type: 'mousedown'}),
    expect.objectContaining({type: 'mousemove'}),
    expect.objectContaining({type: 'mouseup'}),
  ];

  for (let i = 0; i < expectedOrder.length; i++) {
    expect(handler).nthCalledWith(i + 1, expect.any(MouseEvent));
    expect(handler).nthCalledWith(i + 1, expectedOrder[i]);
  }

  expect(handler).lastCalledWith(expectedOrder);
});

test('MouseSequence.move().up() builds on initialized down()', async () => {
  const result = await MouseSequence.create(document.createElement('div'))
    .down()
    .move({x: 5, y: 3})
    .up();

  expect(result).toEqual([
    expect.objectContaining({type: 'mousedown', clientX: 0, clientY: 0}),
    expect.objectContaining({type: 'mousemove', clientX: 5, clientY: 3}),
    expect.objectContaining({type: 'mouseup', clientX: 5, clientY: 3}),
  ]);
});
