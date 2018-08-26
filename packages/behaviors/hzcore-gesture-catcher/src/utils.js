// @flow
import {CODES, KEY_CODES_2_CODES} from './types';

export const getKeyCode = (event: KeyboardEvent) =>
  event.code || KEY_CODES_2_CODES[event.keyCode];

export const isGestureKey = (event: KeyboardEvent) => {
  const code = getKeyCode(event);
  return CODES.some(v => code === v);
};

export const isRepeatKey = (eventA: KeyboardEvent) => (eventB: KeyboardEvent) =>
  eventB &&
  eventA &&
  eventB.key === eventA.key &&
  eventB.code === eventA.code &&
  eventB.type === eventA.type &&
  eventB.ctrlKey === eventA.ctrlKey &&
  eventB.shiftKey === eventA.shiftKey &&
  eventB.altKey === eventA.altKey &&
  eventB.metaKey === eventA.metaKey;

export const not = (fn: (...args: any[]) => any) => (...args: any[]) =>
  !fn(...args);

export function getNearestFocusableNode(node: ?Node): Node {
  if (node instanceof Document) return node;
  if (!(node instanceof HTMLElement)) return document;
  if (node.tabIndex >= 0) return node;
  return getNearestFocusableNode(node.parentNode);
}
