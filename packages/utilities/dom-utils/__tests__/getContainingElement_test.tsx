/* eslint-env jest, browser */
import getContainingElement from '../src/getContainingElement';

describe('getContainingElement', () => {
  it.each<unknown>([null, false, 0, 1, {}])(
    'returns `null` for invalid node `%s`',
    (input) => {
      expect(
        (getContainingElement as (...args: unknown[]) => null)(input),
      ).toBeNull();
    },
  );

  it('returns document element by default', () => {
    const node = document.createElement('div');
    expect(getContainingElement(node)).toBe(document.documentElement);
  });

  it.each<string>(['relative', 'fixed', 'absolute', 'sticky'])(
    'returns the closest `position: %s` ancestor',
    (input) => {
      const container = document.createElement('div');
      container.style.position = input;
      document.body.appendChild(container);
      const node = document.createElement('div');
      container.appendChild(node);
      expect(getContainingElement(node)).toBe(container);
    },
  );

  it.each(['static', 'initial', 'unset'])(
    'ignores `position: %s` ancestors',
    (input) => {
      const container = document.createElement('div');
      container.style.position = input;
      document.body.appendChild(container);
      const node = document.createElement('div');
      container.appendChild(node);
      expect(getContainingElement(node)).toBe(document.documentElement);
    },
  );

  it.each<string>([
    'matrix(1.0, 2.0, 3.0, 4.0, 5.0, 6.0);',
    'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);',
    'perspective(17px);',
    'rotate(0.5turn);',
    'rotate3d(1, 2.0, 3.0, 10deg);',
    'rotateX(10deg);',
    'rotateY(10deg);',
    'rotateZ(10deg);',
    'translate(12px, 50%);',
    'translate3d(12px, 50%, 3em);',
    'translateX(2em);',
    'translateY(3in);',
    'translateZ(2px);',
    'scale(2, 0.5);',
    'scale3d(2.5, 1.2, 0.3);',
    'scaleX(2);',
    'scaleY(0.5);',
    'scaleZ(0.3);',
    'skew(30deg, 20deg);',
    'skewX(30deg);',
    'skewY(1.07rad);',
    'translateX(10px) rotate(10deg) translateY(5px);',
    'perspective(500px) translate(10px, 0, 20px) rotateY(3deg);',
  ])('returns ancestor with `transform: %s`', (input) => {
    const container = document.createElement('div');
    container.style.transform = input;
    document.body.appendChild(container);
    const node = document.createElement('div');
    container.appendChild(node);
    expect(getContainingElement(node)).toBe(container);
  });

  it.each(['none', 'initial', 'unset'])(
    'ignores `transform: %s` ancestors',
    (input) => {
      const container = document.createElement('div');
      container.style.transform = input;
      document.body.appendChild(container);
      const node = document.createElement('div');
      container.appendChild(node);
      expect(getContainingElement(node)).toBe(document.documentElement);
    },
  );

  it.each([
    'auto',
    'scroll',
    'contents',
    'opacity',
    'left, top',
    'initial',
    'unset',
  ])('ignores `will-change: %s` ancestors', (input) => {
    const container = document.createElement('div');
    container.style.willChange = input;
    document.body.appendChild(container);
    const node = document.createElement('div');
    container.appendChild(node);
    expect(getContainingElement(node)).toBe(document.documentElement);
  });

  it.each<string>([
    'transform',
    'transform, opacity',
    'scroll-position, transform',
    'right, scroll-position,transform, left',
  ])('returns ancestor with `will-change: %s`', (input) => {
    const container = document.createElement('div');
    container.style.transform = input;
    document.body.appendChild(container);
    const node = document.createElement('div');
    container.appendChild(node);
    expect(getContainingElement(node)).toBe(container);
  });

  it('returns iframe document element', () => {
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    const node = (iframe.contentDocument as Document).createElement('div');
    const result = getContainingElement(node);
    expect(result).not.toBeNull();
    expect(result).not.toBe(document.documentElement);
    expect(result).toBe(iframe.contentDocument?.documentElement);
  });
});
