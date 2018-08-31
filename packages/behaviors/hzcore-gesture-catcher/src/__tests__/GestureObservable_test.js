/* eslint-disable max-lines */
/* eslint-env jest */
import GestureObservable from '../GestureObservable';
import {
  GestureHistory,
  MouseSequence,
  TouchSequence,
  WheelSequence,
  KeyboardSequence,
} from 'testutils/EventSequence';

let subscription;
let node;

const unsubscribe = () =>
  (subscription = subscription && subscription.unsubscribe());

const mount = (el = document.createElement('div')) =>
  (node = document.body.appendChild(el));

const unmount = () => (node = node && node.remove());

beforeEach(() => {
  mount();
});

afterEach(() => {
  unsubscribe();
  unmount();
});

test('GestureObservable observes mouse gestures', async () => {
  const history = new GestureHistory();
  const gesture = new GestureObservable(node, {mouse: true});
  subscription = gesture.subscribe(history);
  await MouseSequence.create(node)
    .down()
    .move({x: 5})
    .move({x: 3, y: 5})
    .up();
  expect(history.size).toBe(4);
  expect(Array.from(history)).toMatchObject([
    {
      key: null,
      gesturing: true,
      x: 0,
      xDelta: 0,
      xVelocity: 0,
      yDelta: 0,
      yVelocity: 0,
    },
    {
      key: null,
      gesturing: true,
      x: 5,
      xInitial: 0,
      xPrev: 0,
      xDelta: 5,
      xVelocity: 5,
      y: 0,
      yInitial: 0,
      yPrev: 0,
      yDelta: 0,
      yVelocity: 0,
    },
    {
      key: null,
      gesturing: true,
      x: 3,
      xInitial: 0,
      xPrev: 5,
      xDelta: 3,
      xVelocity: -2,
      y: 5,
      yInitial: 0,
      yPrev: 0,
      yDelta: 5,
      yVelocity: 5,
    },
    {
      key: null,
      gesturing: false,
      x: 3,
      xInitial: 0,
      xPrev: 5,
      xDelta: 3,
      xVelocity: -2,
      y: 5,
      yInitial: 0,
      yPrev: 0,
      yDelta: 5,
      yVelocity: 5,
    },
  ]);
});

test('GestureObservable observes touch gestures', async () => {
  const history = new GestureHistory();
  const gesture = new GestureObservable(node, {touch: true});
  subscription = gesture.subscribe(history);
  await TouchSequence.create(node)
    .start()
    .move({x: 5})
    .move({x: 3, y: 5})
    .end();
  expect(history.size).toBe(4);
  expect(Array.from(history)).toMatchObject([
    {
      key: null,
      gesturing: true,
      x: 0,
      xInitial: 0,
      xPrev: 0,
      xDelta: 0,
      xVelocity: 0,
      y: 0,
      yInitial: 0,
      yPrev: 0,
      yDelta: 0,
      yVelocity: 0,
    },
    {
      key: null,
      gesturing: true,
      x: 5,
      xInitial: 0,
      xPrev: 0,
      xDelta: 5,
      xVelocity: 5,
      y: 0,
      yInitial: 0,
      yPrev: 0,
      yDelta: 0,
      yVelocity: 0,
    },
    {
      key: null,
      gesturing: true,
      x: 3,
      xInitial: 0,
      xPrev: 5,
      xDelta: 3,
      xVelocity: -2,
      y: 5,
      yInitial: 0,
      yPrev: 0,
      yDelta: 5,
      yVelocity: 5,
    },
    {
      key: null,
      gesturing: false,
      x: 3,
      xInitial: 0,
      xPrev: 5,
      xDelta: 3,
      xVelocity: -2,
      y: 5,
      yInitial: 0,
      yPrev: 0,
      yDelta: 5,
      yVelocity: 5,
    },
  ]);
});

test('GestureObservable observes wheel gestures', async () => {
  jest.useFakeTimers();
  const history = new GestureHistory();
  const gesture = new GestureObservable(node, {wheel: true});
  subscription = gesture.subscribe(history);
  await WheelSequence.create(node)
    .wheel()
    .wheel({deltaX: 5})
    .wheel({deltaX: 3, deltaY: 5});
  jest.runAllTimers();
  expect(history.size).toBe(4);
  expect(Array.from(history)).toMatchObject([
    {
      type: 'wheel',
      key: null,
      repeat: null,
      gesturing: true,
      x: 0,
      xInitial: 0,
      xPrev: 0,
      xDelta: 0,
      xVelocity: 0,
      y: 0,
      yInitial: 0,
      yPrev: 0,
      yDelta: -1,
      yVelocity: -1,
    },
    {
      type: 'wheel',
      key: null,
      repeat: null,
      gesturing: true,
      x: 0,
      xInitial: 0,
      xPrev: 0,
      xDelta: -5,
      xVelocity: -5,
      y: 0,
      yInitial: 0,
      yPrev: 0,
      yDelta: -1,
      yVelocity: 0,
    },
    {
      type: 'wheel',
      key: null,
      repeat: null,
      gesturing: true,
      x: 0,
      xInitial: 0,
      xPrev: 0,
      xDelta: -8,
      xVelocity: -3,
      y: 0,
      yInitial: 0,
      yPrev: 0,
      yDelta: -6,
      yVelocity: -5,
    },
    {
      type: 'gestureend',
      key: null,
      repeat: null,
      gesturing: false,
      x: 0,
      xInitial: 0,
      xPrev: 0,
      xDelta: -8,
      xVelocity: -3,
      y: 0,
      yInitial: 0,
      yPrev: 0,
      yDelta: -6,
      yVelocity: -5,
    },
  ]);
});

test('GestureObservable observes keyboard gestures', async () => {
  const history = new GestureHistory();
  const gesture = new GestureObservable(node, {keyboard: true});
  subscription = gesture.subscribe(history);
  await KeyboardSequence.create(node)
    .space()
    .repeat()
    .up();
  expect(history.size).toBe(3);
  expect(Array.from(history)).toMatchObject([
    {
      gesturing: true,
      key: 'Space',
      x: 0,
      xInitial: 0,
      xPrev: 0,
      xDelta: 0,
      xVelocity: 0,
      y: 0,
      yDelta: 0,
      yVelocity: 0,
      yInitial: 0,
      yPrev: 0,
    },
    {
      gesturing: true,
      key: 'Space',
      x: 0,
      xInitial: 0,
      xPrev: 0,
      xDelta: 0,
      xVelocity: 0,
      y: 0,
      yDelta: 0,
      yVelocity: 0,
      yInitial: 0,
      yPrev: 0,
    },
    {
      gesturing: false,
      key: 'Space',
      x: 0,
      xInitial: 0,
      xPrev: 0,
      xDelta: 0,
      xVelocity: 0,
      y: 0,
      yDelta: 0,
      yVelocity: 0,
      yInitial: 0,
      yPrev: 0,
    },
  ]);
});

test('GestureObservable observes all inputs by default', async () => {
  jest.useFakeTimers();
  const history = new GestureHistory();
  const gesture = new GestureObservable(node);
  subscription = gesture.subscribe(history);
  await MouseSequence.create(node)
    .down()
    .move()
    .up();
  await TouchSequence.create(node)
    .start()
    .move()
    .end();
  await WheelSequence.create(node).wheel();
  await KeyboardSequence.create(node)
    .space()
    .up();
  jest.runAllTimers();
  expect(history.size).toBe(10);
});

test.each([['mouse', 3], ['touch', 3], ['wheel', 2], ['keyboard', 2]])(
  'GestureObservable observes only %s inputs when specified',
  async (inputType, expectedUpdates) => {
    jest.useFakeTimers();
    const history = new GestureHistory();
    const gesture = new GestureObservable(node, {[inputType]: true});
    subscription = gesture.subscribe(history);
    await MouseSequence.create(node)
      .down()
      .move()
      .up();
    await TouchSequence.create(node)
      .start()
      .move()
      .end();
    await WheelSequence.create(node).wheel();
    await KeyboardSequence.create(node)
      .space()
      .up();
    jest.runAllTimers();
    expect(history.size).toBe(expectedUpdates);
  },
);
