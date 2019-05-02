/* eslint-env jest */
import {
  KEY_DOWN,
  KEY_UP,
  ENTER,
  TAB,
  SPACE,
  PAGE_UP,
  PAGE_DOWN,
  END,
  HOME,
  ARROW_LEFT,
  ARROW_UP,
  ARROW_RIGHT,
  ARROW_DOWN,
  BACKSPACE,
  ESCAPE,
  CODES,
  CODES_2_KEY_CODES,
} from './types';
import EventSequence from './EventSequence';
import {getFlag, getValue} from '..';

type KeyboardEventType = typeof KEY_DOWN | typeof KEY_UP;

type UnnormalizedKeyboardEventInit = KeyboardEventInit & {
  keyCode?: number;
  which?: number;
  charCode?: number;
};

type KeyboardDownEventInit = UnnormalizedKeyboardEventInit & {
  key: string;
};

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;

interface KeyboardDownSequence extends Omit<KeyboardSequence, 'down'> {
  repeat(): KeyboardDownSequence;
  up(): KeyboardSequence;
}

function getCode(key: string): string {
  if (key === ' ') return SPACE;
  if (CODES.includes(key)) return key;
  return `key${key.toUpperCase()}`;
}

function getKeyCode(key: string): number {
  const code = getCode(key);
  if (CODES.includes(code)) {
    return CODES_2_KEY_CODES[code];
  }
  return key.charCodeAt(0);
}

function normalizeKeyboardEventInit(
  init: UnnormalizedKeyboardEventInit,
  from: KeyboardEvent,
): EventInit & UnnormalizedKeyboardEventInit {
  const key = getValue(init, 'key', from.key);
  return {
    key,
    code: getCode(key),
    keyCode: getKeyCode(key),
    which: getKeyCode(key),
    charCode: 0,
    ctrlKey: getFlag(init, 'ctrlKey', from.ctrlKey),
    shiftKey: getFlag(init, 'shiftKey', from.shiftKey),
    altKey: getFlag(init, 'altKey', from.altKey),
    metaKey: getFlag(init, 'metaKey', from.metaKey),
    location: getValue(init, 'location', from.location),
    repeat: getFlag(init, 'repeat', false),
    bubbles: true,
    cancelable: true,
    view: window,
  };
}
export default class KeyboardSequence extends EventSequence<
  KeyboardEvent,
  UnnormalizedKeyboardEventInit
> {
  createNextEvent(
    type: KeyboardEventType,
    init: UnnormalizedKeyboardEventInit = {},
    lastEvent?: KeyboardEvent | undefined,
  ): KeyboardEvent {
    return new KeyboardEvent(
      type,
      normalizeKeyboardEventInit(init, lastEvent || new KeyboardEvent('init')),
    );
  }
  down(downOpts: KeyboardDownEventInit): KeyboardDownSequence {
    const downSequence: KeyboardDownSequence = this.dispatch(
      KEY_DOWN,
      downOpts,
    ).expose({
      down: false,
      repeat: (): KeyboardDownSequence =>
        downSequence.dispatch(KEY_DOWN, {repeat: true}),
      up: (): KeyboardSequence => this.dispatch(KEY_UP),
    });
    return downSequence;
  }
  space(): KeyboardDownSequence {
    return this.down({key: ' '});
  }
  pageUp(): KeyboardDownSequence {
    return this.down({key: PAGE_UP});
  }
  pageDown(): KeyboardDownSequence {
    return this.down({key: PAGE_DOWN});
  }
  end(): KeyboardDownSequence {
    return this.down({key: END});
  }
  home(): KeyboardDownSequence {
    return this.down({key: HOME});
  }
  arrowLeft(): KeyboardDownSequence {
    return this.down({key: ARROW_LEFT});
  }
  arrowUp(): KeyboardDownSequence {
    return this.down({key: ARROW_UP});
  }
  arrowRight(): KeyboardDownSequence {
    return this.down({key: ARROW_RIGHT});
  }
  arrowDown(): KeyboardDownSequence {
    return this.down({key: ARROW_DOWN});
  }
  enter(): KeyboardDownSequence {
    return this.down({key: ENTER});
  }
  tab(): KeyboardDownSequence {
    return this.down({key: TAB});
  }
  backspace(): KeyboardDownSequence {
    return this.down({key: BACKSPACE});
  }
  escape(): KeyboardDownSequence {
    return this.down({key: ESCAPE});
  }
}
