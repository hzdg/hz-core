import React from 'react';

import DraftailProvider, {Components} from './context';
import createElementBasedOnBlockType, {
  BOLD,
  ITALIC,
  UNSTYLED,
  LINK,
  BlockType,
  isOrderedListItem,
  isUnorderedListItem,
  isListItem,
} from './createElementBasedOnBlockType';

interface InlineStyleRange {
  length: number;
  offset: number;
  style: typeof BOLD | typeof ITALIC;
}

interface EntityRange {
  key: number;
  length: number;
  offset: number;
}

interface EntityMap {
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

export type BlockWithEntityMap = Block & EntityMap;

export interface RichTextNode {
  blocks: Block[];
  entityMap: EntityMap;
}

export interface DraftailRendererProps {
  body: RichTextNode | {};
  components?: Components;
}

function groupBlocksByType(
  blocksWithEntities: (Block | BlockWithEntityMap)[],
): (Block | BlockWithEntityMap)[] | null {
  if (!blocksWithEntities || blocksWithEntities.length === 0) return null;
  let pointer = 1;
  return blocksWithEntities.reduce(
    (
      blocks: (Block | BlockWithEntityMap)[],
      currBlock: Block | BlockWithEntityMap,
      currIndex,
    ) => {
      const nextBlock = blocksWithEntities[currIndex + 1];
      if (
        isListItem(currBlock) ||
        (nextBlock && isListItem(currBlock) && isListItem(nextBlock))
      ) {
        if (blocks.length > 0 && Array.isArray(blocks[currIndex - pointer])) {
          blocks[currIndex - pointer].push(currBlock);
          pointer++;
        } else {
          let list: (Block | BlockWithEntityMap)[] = [];
          list.push(currBlock);
          blocks.push(list);
        }
      } else {
        blocks.push(currBlock);
      }
      return blocks;
    },
    [],
  );
}

function renderBlocksWithEntities(
  blocks: (Block | BlockWithEntityMap)[],
): JSX.Element | (JSX.Element | null)[] | null {
  const groupedBlocks = groupBlocksByType(blocks);
  if (!groupedBlocks || groupedBlocks.length === 0) return null;
  return groupedBlocks
    .map((block, i) => {
      if (Array.isArray(block)) {
        if (isOrderedListItem(block[0])) {
          return (
            <ol key={i}>
              {block.map((listItem, i) =>
                createElementBasedOnBlockType(listItem, i),
              )}
            </ol>
          );
        } else if (isUnorderedListItem(block[0])) {
          return (
            <ul key={i}>
              {block.map((listItem, i) =>
                createElementBasedOnBlockType(listItem, i),
              )}
            </ul>
          );
        } else {
          /**
           * for now, known types that will be generated as arrays are
           * ordered and unordered list items, but it might change in the future
           * as we add more types from the draftail.
           */
          return null;
        }
      } else {
        return createElementBasedOnBlockType(block, i);
      }
    })
    .filter(Boolean);
}

export default function DraftailRenderer({
  components = {},
  body = {},
}: DraftailRendererProps): JSX.Element | null {
  const {blocks = [], entityMap = {}} = body as RichTextNode;

  const blocksWithEntities: (Block | BlockWithEntityMap)[] = blocks
    .map(block => {
      /**
       * if the block has an entityMap assosiated with it by `key`
       * we're mapping the data of that entityMap to the block and
       * merging those 2 objects together.
       */
      if (block.entityRanges && block.entityRanges.length > 0 && entityMap) {
        for (const key of Object.keys(entityMap as EntityMap)) {
          if (Number(block.entityRanges[0].key) === Number(key)) {
            let blockWithEntity;
            /**
             * if the block(typeof UNSTYLED) doesn't have any styles applied to it,
             * we can merge it with its entityMap. the type will become LINK.
             */
            if (block.type === UNSTYLED) {
              blockWithEntity = Object.assign({}, block, entityMap[key]);
              return blockWithEntity;
            } else {
              /**
               * if there is a specific(not unstyled) type applied to a block,
               * we need to preserve that type and add a flag to an object
               * saying that it also should be a link. Solves an issue when a link
               * is a part of un/ordered list.
               */
              blockWithEntity = Object.assign({}, block, entityMap[key], {
                type: block.type,
                isLink: true,
              });
              return blockWithEntity;
            }
          }
        }
      }
      return block as Block;
    })
    /**
     * Filtering:
     * 1. Empty objects.
     * 2. Blocks without type. We're doing further filtering primarily based
     * on a type.
     */
    .filter(block => Boolean(Object.keys(block).length > 0 && block.type));

  return (
    <DraftailProvider components={components}>
      {renderBlocksWithEntities(blocksWithEntities)}
    </DraftailProvider>
  );
}
