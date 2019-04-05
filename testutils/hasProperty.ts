type FirstArgument<T> = T extends (arg1: infer U, ...args: any[]) => any
  ? U
  : any;

export default function hasProperty(
  obj: any,
  key: FirstArgument<typeof Object.hasOwnProperty>,
): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}
