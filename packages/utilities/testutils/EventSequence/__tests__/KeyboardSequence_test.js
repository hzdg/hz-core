/* eslint-env jest, browser */
import KeyboardSequence from '../KeyboardSequence';

beforeEach(() => {
  jest.useFakeTimers();
});

test('KeyboardSequence.down() reveals subsequence', async () => {
  const handler = jest.fn();
  const node = document.createElement('div');
  node.tabIndex = 1;

  node.addEventListener('keydown', handler);
  node.addEventListener('keyup', handler);

  let sequence = KeyboardSequence.create(node);
  expect(sequence).not.toHaveProperty('repeat', expect.any(Function));
  expect(sequence).not.toHaveProperty('up', expect.any(Function));

  sequence = sequence.down({key: 'Space'});
  expect(sequence).not.toHaveProperty('down', expect.any(Function));
  expect(sequence).toHaveProperty('repeat', expect.any(Function));
  expect(sequence).toHaveProperty('up', expect.any(Function));

  sequence = sequence.repeat();
  expect(sequence).not.toHaveProperty('down', expect.any(Function));
  expect(sequence).toHaveProperty('repeat', expect.any(Function));
  expect(sequence).toHaveProperty('up', expect.any(Function));

  sequence = sequence.up();
  expect(sequence).toHaveProperty('down', expect.any(Function));
  expect(sequence).not.toHaveProperty('repeat', expect.any(Function));
  expect(sequence).not.toHaveProperty('up', expect.any(Function));

  await sequence.then(handler);

  node.removeEventListener('keydown', handler);
  node.removeEventListener('keyup', handler);

  expect(handler).toHaveBeenCalledTimes(4);

  const expectedOrder = [
    expect.objectContaining({type: 'keydown', repeat: false}),
    expect.objectContaining({type: 'keydown', repeat: true}),
    expect.objectContaining({type: 'keyup'}),
  ];

  for (let i = 0; i < expectedOrder.length; i++) {
    expect(handler).toHaveBeenNthCalledWith(i + 1, expect.any(KeyboardEvent));
    expect(handler).toHaveBeenNthCalledWith(i + 1, expectedOrder[i]);
  }

  expect(handler).toHaveBeenLastCalledWith(expectedOrder);
});

test('KeyboardSequence.repeat().up() builds on initialized down()', async () => {
  const expected = {
    key: ' ',
    code: 'Space',
    keyCode: 32,
    which: 32,
  };
  const result = await KeyboardSequence.create(document.createElement('div'))
    .down({key: expected.key})
    .repeat()
    .up();
  expect(result).toEqual([
    expect.objectContaining({type: 'keydown', repeat: false, ...expected}),
    expect.objectContaining({type: 'keydown', repeat: true, ...expected}),
    expect.objectContaining({type: 'keyup', repeat: false, ...expected}),
  ]);
});

test.each([
  ['space', {key: ' ', code: 'Space', keyCode: 32}],
  ['pageUp', {key: 'PageUp', code: 'PageUp', keyCode: 33}],
  ['pageDown', {key: 'PageDown', code: 'PageDown', keyCode: 34}],
  ['end', {key: 'End', code: 'End', keyCode: 35}],
  ['home', {key: 'Home', code: 'Home', keyCode: 36}],
  ['arrowLeft', {key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37}],
  ['arrowUp', {key: 'ArrowUp', code: 'ArrowUp', keyCode: 38}],
  ['arrowRight', {key: 'ArrowRight', code: 'ArrowRight', keyCode: 39}],
  ['arrowDown', {key: 'ArrowDown', code: 'ArrowDown', keyCode: 40}],
  ['enter', {key: 'Enter', code: 'Enter', keyCode: 13}],
  ['tab', {key: 'Tab', code: 'Tab', keyCode: 9}],
  ['backspace', {key: 'Backspace', code: 'Backspace', keyCode: 8}],
  ['escape', {key: 'Escape', code: 'Escape', keyCode: 27}],
])('KeyboardSequence has the %s key shortcut', async (name, expected) => {
  const sequence = KeyboardSequence.create(document.createElement('div'));
  expect(sequence).toHaveProperty(name, expect.any(Function));
  const result = await sequence[name]()
    .repeat()
    .up();
  expect(
    result.map(({type, repeat, key, code, keyCode}) => ({
      type,
      repeat,
      key,
      code,
      keyCode,
    })),
  ).toMatchObject([
    {type: 'keydown', repeat: false, ...expected},
    {type: 'keydown', repeat: true, ...expected},
    {type: 'keyup', repeat: false, ...expected},
  ]);
});
