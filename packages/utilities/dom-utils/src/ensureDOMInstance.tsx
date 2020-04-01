import invariant from 'invariant';
import getWindow from './getWindow';

export default function ensureDOMInstance<T extends Node>(
  node: T,
  type: Function = Node,
): void {
  const window = getWindow(node);
  if (window) {
    type = ((window as unknown) as Record<string, Function>)[type.name] || type;
  }
  invariant(
    node instanceof type,
    `An instance of ${type.name} is required, but received ${node}`,
  );
}
