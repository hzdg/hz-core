import React, {Component} from 'react';


class Button extends Component {
  state = {
    hover: false,
  };

  render() {
    return (
      <div>
        {this.props.text}
      </div>
    );
  }
}

export default Button;
