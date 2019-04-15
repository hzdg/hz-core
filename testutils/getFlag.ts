import getValue from './getValue';

export default function getFlag(
  obj: any,
  key: string,
  defaultValue: any,
): boolean {
  return Boolean(getValue(obj, key, defaultValue));
}
