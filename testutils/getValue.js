// @flow
import hasProperty from './hasProperty';

export default function getValue(obj: any, key: string, defaultValue: *): * {
  return hasProperty(obj, key) ? obj[key] : defaultValue;
}
