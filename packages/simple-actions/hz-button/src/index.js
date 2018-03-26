// @flow
import React, {Component} from 'react';

// eslint-disable-next-line no-duplicate-imports
import type {Element} from 'react';

type Props = {
  /**
   * A callback for handling Button hover state changes.
   * This may be useful (for example) for synchronizing
   * external state with the Button's hover state.
   */
  onHoverChange?: (value: boolean) => void,
  /**
   * The Button 'render prop'. This should take `State`
   * as it's only argument, and return a valid React Element.
   */
  children: (props: State) => Element<*>,
};

type State = {
  hover: boolean,
};

/**
 * A normal button component
 */
class Button extends Component<Props, State> {
  state = {
    hover: false,
  };

  handleMouseEnter = () => {
    this.setState({hover: true});
    if (typeof this.props.onHoverChange === 'function') {
      this.props.onHoverChange(false);
    }
  };

  handleMouseLeave = () => {
    this.setState({hover: false});
    if (typeof this.props.onHoverChange === 'function') {
      this.props.onHoverChange(false);
    }
  };

  render() {
    return React.cloneElement(this.props.children(this.state), {
      onMouseEnter: this.handleMouseEnter,
      onMouseLeave: this.handleMouseLeave,
    });
  }
}

export default Button;
