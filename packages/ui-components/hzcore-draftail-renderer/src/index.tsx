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

class Stack {
  count: number = 0;
  storage: {
    [key: number]: Block | BlockWithEntityMap | (Block | BlockWithEntityMap)[];
  } = {};
  /**
   * Append a value to the end of the stack.
   */
  push(
    value: Block | BlockWithEntityMap | (Block | BlockWithEntityMap)[],
  ): void {
    this.storage[this.count] = value;
    this.count++;
  }
  /**
   * Removes and returns the value at the end of the stack.
   */
  pop(): unknown {
    if (this.count === 0) {
      return undefined;
    }
    this.count--;
    const result = this.storage[this.count];
    delete this.storage[this.count];
    return result;
  }

  /**
   *  Returns the current site of the stack.
   */
  size(): number {
    return this.count;
  }
  /**
   * Returns the value at the end of the stack
   */
  peek(): unknown {
    return this.storage[this.count - 1];
  }
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

function sortNestedLists(
  blocks: (Block | BlockWithEntityMap)[],
): (Block | BlockWithEntityMap)[] | null {
  const stack = new Stack();
  let currentDepth = 0;
  if (!blocks || blocks.length === 0) return null;
  blocks.forEach(block => {
    if (block.depth === currentDepth) {
      stack.push(block);
    } else if (block.depth < currentDepth) {
      currentDepth--;
      let stackPeek = stack.pop();
      if (stackPeek && Array.isArray(stackPeek)) {
        let currentPeek = stack.peek();
        if (Array.isArray(currentPeek)) {
          currentPeek.push(stackPeek);
          currentPeek.push(block);
        } else {
          stack.push(stackPeek);
          stack.push(block);
        }
      }
    } else if (block.depth > currentDepth) {
      currentDepth++;
      stack.push([block]);
    } else {
      // noop ? we should never get here.
    }
  });

  // TODO: type this somehow
  return Object.values(stack.storage);
}

function renderLists(
  block: (Block | BlockWithEntityMap)[] | (Block | BlockWithEntityMap),
): JSX.Element | null {
  if (!Array.isArray(block)) {
    return createElementBasedOnBlockType(block);
  } else {
    return isOrderedListItem(block[0]) ? (
      <ol key={`ordered_${block[0].key}`}>{block.map(renderLists)}</ol>
    ) : isUnorderedListItem(block[0]) ? (
      <ul key={`unordered_${block[0].key}`}>{block.map(renderLists)}</ul>
    ) : null;
  }
}

function renderList(block: (Block | BlockWithEntityMap)[]): JSX.Element | null {
  const sortedNestedLists = sortNestedLists(block);
  if (sortedNestedLists) {
    return renderLists(sortedNestedLists);
  } else {
    return null;
  }
}

function mapEntityToBlock(
  blocks: Block[],
  entityMap: EntityMap,
): (Block | BlockWithEntityMap)[] {
  return (
    blocks
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
      .filter(block => Boolean(Object.keys(block).length > 0 && block.type))
  );
}

function renderBlocksWithEntities(
  blocks: (Block | BlockWithEntityMap)[],
): JSX.Element | JSX.Element[] | (JSX.Element | null)[] | null {
  const groupedBlocks = groupBlocksByType(blocks);
  if (!groupedBlocks || groupedBlocks.length === 0) return null;
  return groupedBlocks
    .map(block => {
      if (Array.isArray(block)) {
        return renderList(block as (Block | BlockWithEntityMap)[]);
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
  if (
    !body ||
    !(body as RichTextNode).blocks ||
    (body as RichTextNode).blocks.length === 0
  ) {
    return null;
  }

  const {blocks = [], entityMap = {}} = body as RichTextNode;
  const blocksWithEntities = mapEntityToBlock(blocks, entityMap);

  return (
    <DraftailProvider components={components}>
      {renderBlocksWithEntities(blocksWithEntities)}
    </DraftailProvider>
  );
}
