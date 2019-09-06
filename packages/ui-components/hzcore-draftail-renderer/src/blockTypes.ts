export const UNSTYLED = 'unstyled';
export const ORDERED_LIST_ITEM = 'ordered-list-item';
export const UNORDERED_LIST_ITEM = 'unordered-list-item';
export const LINK = 'LINK';

export type BlockType =
  | typeof UNSTYLED
  | typeof ORDERED_LIST_ITEM
  | typeof UNORDERED_LIST_ITEM
  | typeof LINK;
