import {Callbag} from 'callbag';

export default function fromEvent(
  node: Node,
  name: string,
  options?: any,
): Callbag<any, any> {
  return (start: number, sink: Function) => {
    if (start !== 0) return;
    const handler = (ev: any) => sink(1, ev);
    sink(0, (t: any) => {
      if (t === 2) node.removeEventListener(name, handler, options);
    });
    node.addEventListener(name, handler, options);
  };
}
