import {Components} from './context';
import {
  UNSTYLED,
  ORDERED_LIST_ITEM,
  UNORDERED_LIST_ITEM,
  LINK,
  BOLD,
  ITALIC,
} from './createElementBasedOnBlockType';

export type BlockType =
  | typeof UNSTYLED
  | typeof ORDERED_LIST_ITEM
  | typeof UNORDERED_LIST_ITEM
  | typeof LINK;

export interface InlineStyleRange {
  length: number;
  offset: number;
  style: typeof BOLD | typeof ITALIC;
}

export interface EntityRange {
  key: number;
  length: number;
  offset: number;
}

export interface EntityMap {
  [key: string]: {
    data: {
      url: string;
    };
    mutability: 'MUTABLE' | 'IMMUTABLE';
    type: typeof LINK;
  };
}

export interface Block {
  depth: number;
  entityRanges: EntityRange[];
  inlineStyleRanges: InlineStyleRange[];
  key: string;
  text: string;
  type: BlockType;
  isLink?: boolean;
}

export type BlockWithEntityMap = Block & {entityMap: keyof EntityMap};

export interface RichTextNode {
  blocks: Block[];
  entityMap: EntityMap;
}

export interface DraftailRendererProps {
  body: RichTextNode | {};
  components?: Components;
}
