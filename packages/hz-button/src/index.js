// @flow
import React, {Component} from 'react';

type Props = {
  /** Styles for the Button Component <br />
   * `Button__base`
   **/
  styles?: ?{
    Button__base: {[string]: string | number},
  },
  /** Text to display in Button */
  text: string,
  /** Name of Button, targetted class name */
  customClassName?: string,
  /** Names of css module items */
  cssModuleClassNames?: {[string]: string},
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

  // handles css stylesheets and css modules
  // TODO: Make this universal?
  getClassName(itemName) {
    return `${this.props.customClassName}__base ${
      this.props.cssModuleClassNames
        ? this.props.cssModuleClassNames[itemName]
        : null
    }`;
  }

  // Handles inlining styles
  // TODO: Make this universal?
  getStyles(itemName) {
    return this.props.styles ? this.props.styles[itemName] : {};
  }

  render() {
    return (
      <div
        className={this.getClassName('buttonBase')}
        style={this.getStyles('buttonBase')}
      >
        {this.props.text}
      </div>
    );
  }
}

export default Button;
