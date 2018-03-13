// @flow

import React, {Component} from 'react';

type Props = {
  /** Styles for the Button Component <br />
   * `Button__base`
   **/
  styles: ?{
    Button__base: {[string]: string | number},
  },
  /** Text to display in Button */
  text: string,
};

type State = {
  hover: boolean,
};

/**
 * A normal button component
 */
class Button extends Component<Props, State> {
  static defaultProps = {
    styles: {},
  };

  state = {
    hover: false,
  };

  render() {
    return (
      <div
        className="Button__base"
        style={this.props.styles ? this.props.styles.Button__base : {}}
      >
        {this.props.text}
      </div>
    );
  }
}

export default Button;
