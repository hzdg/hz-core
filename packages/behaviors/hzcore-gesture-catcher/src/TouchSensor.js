/* eslint-disable no-duplicate-imports */
// @flow
import merge from 'callbag-merge';
import Sensor from './Sensor';
import fromEvent from './fromEvent';
import {TOUCH_START, TOUCH_MOVE, TOUCH_END} from './types';

import type {SensorConfig} from './types';

export default class TouchSensor extends Sensor {
  constructor(node: HTMLElement, config: SensorConfig) {
    super(config);
    this.source = merge(
      fromEvent(node, TOUCH_START),
      fromEvent(document, TOUCH_END),
      fromEvent(document, TOUCH_MOVE, {passive: this.passive}),
    );
    this.webkitHack = this.preventDefault ? new WebkitHack() : null;
  }

  webkitHack: ?WebkitHack = null;
  gesturing: boolean = false;

  shouldPreventDefault(event: Event) {
    return (
      event instanceof MouseEvent &&
      event.type === TOUCH_MOVE &&
      super.shouldPreventDefault(event)
    );
  }

  updateConfig(config: SensorConfig) {
    const didUpdate = super.updateConfig(config);
    if (didUpdate) {
      if (!this.preventDefault && this.webkitHack) {
        this.webkitHack.destroy();
        this.webkitHack = null;
      } else if (this.preventDefault && !this.webkitHack) {
        this.webkitHack = new WebkitHack();
      }
    }
    return didUpdate;
  }

  onData(data: TouchEvent) {
    switch (data.type) {
      case TOUCH_START: {
        if (this.gesturing) return null;
        this.gesturing = true;
        if (this.webkitHack) this.webkitHack.preventTouchMove();
        return data;
      }
      case TOUCH_MOVE: {
        if (!this.gesturing) return null;
        if (this.shouldPreventDefault(data)) data.preventDefault();
        return data;
      }
      case TOUCH_END: {
        if (!this.gesturing) return null;
        this.gesturing = false;
        if (this.webkitHack) this.webkitHack.allowTouchMove();
        return data;
      }
    }
  }
}

// Webkit does not allow event.preventDefault() in dynamically added handlers
// (i.e., a handler added to 'touchmove' after handling a 'touchstart'),
// so we add a permanent 'touchmove' handler to get around this.
// webkit bug: https://bugs.webkit.org/show_bug.cgi?id=184250
// Original implementation: https://github.com/atlassian/react-beautiful-dnd/pull/416
class WebkitHack {
  constructor() {
    // Do nothing when server side rendering or no touch support.
    if (typeof window !== 'undefined' && 'ontouchstart' in window) {
      // Adding a persistent event handler.
      // It can't be passive, otherwise we wouldn't
      // be able to preventDefault().
      window.addEventListener('touchmove', this.handleTouchMove, {
        passive: false,
      });
    }
  }

  shouldPreventDefault: boolean = false;

  destroy() {
    if (typeof window === 'undefined') return;
    window.removeEventListener('touchmove', this.handleTouchMove, {
      passive: false,
    });
  }

  handleTouchMove = (event: TouchEvent) => {
    if (this.shouldPreventDefault && !event.defaultPrevented) {
      event.preventDefault();
    }
  };

  preventTouchMove() {
    this.shouldPreventDefault = true;
  }

  allowTouchMove() {
    this.shouldPreventDefault = false;
  }
}
