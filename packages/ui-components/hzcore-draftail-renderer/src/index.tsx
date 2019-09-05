import React, {CSSProperties} from 'react';

import DraftailProvider, {Components} from './context';
import createElement from './createElement';

const UNSTYLED = 'unstyled';
const ORDERED_LIST_ITEM = 'ordered-list-item';
const UNORDERED_LIST_ITEM = 'unordered-list-item';
const LINK = 'LINK';

const BOLD = 'BOLD';
const ITALIC = 'ITALIC';
const MUTABLE = 'MUTABLE';

type BlockType =
  | typeof UNSTYLED
  | typeof ORDERED_LIST_ITEM
  | typeof UNORDERED_LIST_ITEM
  | typeof LINK;

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

export interface Block {
  depth: number;
  entityRanges: EntityRange[];
  inlineStyleRanges: InlineStyleRange[];
  key: string;
  text: string;
  type: BlockType;
  isLink?: boolean;
}

interface EntityMap {
  [key: string]: {
    data: {
      url: string;
    };
    mutability: typeof MUTABLE;
    type: typeof LINK;
  };
}

export interface RichTextNode {
  blocks: Block[];
  entityMap: EntityMap;
}

export interface DraftailRendererProps {
  body: RichTextNode | {};
  headline?: string;
  components?: Components;
}

type Merged = Block & EntityMap;

function setStyleBasedOnStyleRanges(block: Block): CSSProperties | {} {
  const {inlineStyleRanges} = block;
  if (inlineStyleRanges.length < 1) return {};
  const defaultStyles = {};
  inlineStyleRanges.forEach(({style}) => {
    switch (style) {
      case ITALIC:
        return Object.assign(defaultStyles, {fontStyle: 'italic'});
      case BOLD:
        return Object.assign(defaultStyles, {fontWeight: 'bold'});
      default:
        return defaultStyles;
    }
  });
  return defaultStyles;
}

function getComponentBasedOnBlockType(
  block: Block | Merged,
  i: number,
): JSX.Element | null {
  switch (block.type as BlockType) {
    case LINK:
      return createElement('a', {
        key: i,
        href: block.data.url,
        style: setStyleBasedOnStyleRanges(block),
        children: block.text,
      });
    case UNSTYLED:
      return createElement('p', {
        key: i,
        style: setStyleBasedOnStyleRanges(block),
        children: block.text,
      });
    case ORDERED_LIST_ITEM:
    case UNORDERED_LIST_ITEM:
      return createElement('li', {
        key: i,
        style: setStyleBasedOnStyleRanges(block),
        children: block.isLink
          ? createElement('a', {
              href: block.data.url,
              style: setStyleBasedOnStyleRanges(block),
              children: block.text,
            })
          : block.text,
      });
    default:
      return null;
  }
}

function isOrderedListItem(block: Block): boolean {
  return Boolean(block.type === ORDERED_LIST_ITEM);
}

function isUnorderedListItem(block: Block): boolean {
  return Boolean(block.type === UNORDERED_LIST_ITEM);
}

function isListItem(block: Block): boolean {
  if (!block) return false;
  return isOrderedListItem(block) || isUnorderedListItem(block);
}

function sortBlocksBasedOnType(blocksWithEntities: Block[]): Block[] | null {
  if (!blocksWithEntities || blocksWithEntities.length === 0) return null;
  let pointer = 1;
  return blocksWithEntities.reduce(
    (blocks: Block[], currBlock: Block, currIndex) => {
      const nextBlock = blocksWithEntities[currIndex + 1];
      if (
        isListItem(currBlock) ||
        (nextBlock && isListItem(currBlock) && isListItem(nextBlock))
      ) {
        if (blocks.length > 0 && Array.isArray(blocks[currIndex - pointer])) {
          blocks[currIndex - pointer].push(currBlock);
          pointer++;
        } else {
          let list: Block[] = [];
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
  blocks: Block[],
): JSX.Element | (JSX.Element | null)[] | null {
  const sortedBlocks = sortBlocksBasedOnType(blocks);
  if (!sortedBlocks || sortedBlocks.length === 0) return null;
  return sortedBlocks
    .map((block, i) => {
      if (Array.isArray(block)) {
        if (isOrderedListItem(block[0])) {
          return (
            <ol key={i}>
              {block.map((listItem, i) =>
                getComponentBasedOnBlockType(listItem, i),
              )}
            </ol>
          );
        } else if (isUnorderedListItem(block[0])) {
          return (
            <ul key={i}>
              {block.map((listItem, i) =>
                getComponentBasedOnBlockType(listItem, i),
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
        return getComponentBasedOnBlockType(block, i);
      }
    })
    .filter(Boolean);
}

export default function DraftailRenderer({
  components = {},
  headline,
  body = {},
}: DraftailRendererProps): JSX.Element | null {
  const {blocks = [], entityMap = {}} = body as RichTextNode;

  const blocksWithEntities: Block[] = blocks
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
            }
            blockWithEntity = Object.assign({}, block, entityMap[key], {
              type: block.type,
              isLink: true,
            });
            return blockWithEntity;
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
      {headline && createElement('h1', {children: headline})}
      {renderBlocksWithEntities(blocksWithEntities)}
    </DraftailProvider>
  );
}
