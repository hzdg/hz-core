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
        /**
         * check if the block's depth is not 0
         */
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

function sortNestedLists(blocks: Block[]): Block[] {
  let list: unknown[] | Block[] = [];

  blocks.forEach(block => {
    if (list.length === 0) {
      list.push(block);
    } else {
      /**
       * grabbing value of the last item in the list.
       */
      let last = list[list.length - 1]
        ? list[list.length - 1]
        : list[list.length];
      /**
       * we've moved from the first index.
       */
      if (Array.isArray(last)) {
        let lastInLast = last[last.length - 1]
          ? last[last.length - 1]
          : last[last.length];

        /**
         * if the first item in nested array has the same depth as the current block - add the block to that array.
         */
        if (block.depth === last[0].depth) {
          last.push(block);
        } else {
          /**
           * if not - create a new array and add the block to that array and append it to the position next to the last item, depending on the depth
           */
          let nestedArray: unknown[] | Block[] = [];
          nestedArray.push(block);

          if (Array.isArray(lastInLast)) {
            if (block.depth === lastInLast[0].depth) {
              lastInLast.push(nestedArray);
            } else {
              if (Array.isArray(lastInLast[lastInLast.length - 1])) {
                if (lastInLast[lastInLast.length - 1].depth === block.depth) {
                  lastInLast[lastInLast.length - 1].push(block);
                } else {
                  lastInLast[lastInLast.length - 1].push(nestedArray);
                }
              } else {
                lastInLast.push(nestedArray);
              }
            }
          } else {
            last.push(nestedArray);
          }
        }
        /**
         * if the last item is array, we are one level deeper.
         */
      } else {
        /**
         * last item in the list is NOT array but a regular block.
         */
        if ((last as Block) && (last as Block).depth !== block.depth) {
          let nestedArray: unknown[] | Block[] = [];
          nestedArray.push(block);
          list.push(nestedArray);
        } else {
          list.push(block);
        }
      }
    }
  });

  return list as Block[];
}

function renderListRecursive(
  block: (Block | BlockWithEntityMap)[] | (Block | BlockWithEntityMap),
): JSX.Element | null {
  if (!Array.isArray(block)) {
    return createElementBasedOnBlockType(block);
  } else {
    return isOrderedListItem(block[0]) ? (
      <ol key={block[0].key}>
        {block.map(innerBlock => renderListRecursive(innerBlock))}
      </ol>
    ) : isUnorderedListItem(block[0]) ? (
      <ul key={block[0].key}>
        {block.map(innerBlock => renderListRecursive(innerBlock))}
      </ul>
    ) : null;
  }
}

function renderList(
  block: BlockWithEntityMap,
): JSX.Element | (JSX.Element | null)[] | null {
  const sortedNestedLists = sortNestedLists(block);
  return renderListRecursive(sortedNestedLists);
}

function renderBlocksWithEntities(
  blocks: (Block | BlockWithEntityMap)[],
): JSX.Element | (JSX.Element | null)[] | null {
  const groupedBlocks = groupBlocksByType(blocks);
  if (!groupedBlocks || groupedBlocks.length === 0) return null;
  return groupedBlocks
    .map(block => {
      if (Array.isArray(block)) {
        return renderList(block);
      } else {
        return createElementBasedOnBlockType(block);
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
