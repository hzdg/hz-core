// @flow
import React, {Component} from 'react';
import {Motion, spring} from 'react-motion';

/**
 * Various Directions
 */
type Direction = 'Up' | 'Down' | 'Left' | 'Right';

type Props = {
  /**
   * One node component that contains the content to fade in
   */
  children: React.Node,
  /**
   * The direction for the content to move into view. <br />
   * Valid Directions are: "Up", "Down", "Left", "Right"
   */
  direction: Direction<string>,
  /**
   * Control whether not item should be active
   */
  activate?: boolean,
  /**
   * Initial position of content before it fades into view
   */
  offsetPosition?: number,
};

type State = {
  activate: boolean,
};

/**
 * Fades and moves its children into view.
 * @extends Component
 */
class FadeIntoView extends Component<Props, State> {
  static defaultProps = {
    activate: false,
    offsetPosition: 100,
  };

  getDirectionStyle(transformNum) {
    switch (this.props.direction) {
      case 'Up':
        return `translateY(${transformNum}px)`;
      case 'Down':
        return `translateY(-${transformNum}px)`;
      case 'Left':
        return `translateX(${transformNum}px)`;
      case 'Right':
        return `translateX(-${transformNum}px)`;
      default:
        throw 'Error';
    }
  }

  render() {
    return (
      <Motion
        defaultStyle={{
          opacityNum: 0,
          transformNum: this.props.offsetPosition,
        }}
        style={{
          opacityNum: spring(this.props.activate ? 1 : 0, {
            stiffness: 30,
            damping: 20,
          }),
          transformNum: spring(
            this.props.activate ? 0 : this.props.offsetPosition,
            {
              stiffness: 120,
              damping: 20,
            },
          ),
        }}
      >
        {({opacityNum, transformNum}) => (
          <div
            style={{
              opacity: opacityNum,
              transform: this.getDirectionStyle(transformNum),
            }}
          >
            {this.props.children}
          </div>
        )}
      </Motion>
    );
  }
}

export default FadeIntoView;
