/**
 * A getter for a computed style value.
 * The element should be passed to the getter as context,
 * i.e., `computedValueGetter.call(someElement)`.
 */
export interface ComputedValueGetter<
  K extends keyof CSSStyleDeclaration,
  T extends typeof Number | typeof Boolean
> {
  (this: Element): T extends typeof Number
    ? number
    : T extends typeof Boolean
    ? boolean
    : CSSStyleDeclaration[K];
}

/**
 * `getComputedValue` will return a getter for a value
 * from an Element's computed styles.
 */
export default function getComputedValue<
  K extends keyof CSSStyleDeclaration,
  T extends typeof Number | typeof Boolean
>(
  /**
   * The name of the computed style to get, i.e., 'width'.
   */
  value: K,
  /**
   * An optional primitive type to convert the value to.
   * Can be either `Number` or `Boolean`. Default behavior
   * is to return the computed value directly (probably `string`).
   */
  as?: T,
): ComputedValueGetter<K, T> {
  return function(this: Element): CSSStyleDeclaration[K] {
    const computed = getComputedStyle(this)[value];
    switch (as) {
      case Number:
        return parseFloat(computed);
      case Boolean:
        return Boolean(computed);
      default:
        return computed;
    }
  };
}
