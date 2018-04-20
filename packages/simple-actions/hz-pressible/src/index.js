// @flow
import {Component} from 'react';

// eslint-disable-next-line no-duplicate-imports
import type {Element} from 'react';

type RenderProps = {};

type Props = {
  /**
   * Something something
   * @param  {[type]} props [description]
   * @return {[type]}       [description]
   */
  render: (props: RenderProps) => Element<*>,
  /**
   * [value description]
   * @type {[type]}
   */
  onPress?: (value: boolean) => void,
};

type State = {
  pressed: boolean,
};

const intialState = {
  pressed: false,
};

/**
 *  This is a basic pressible component
 *  @returns Component
 */
class Pressible extends Component<Props, State> {
  state = {...intialState};

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (
      typeof this.props.onPress === 'function' &&
      prevState.pressed !== this.state.pressed
    ) {
      this.props.onPress(this.state.pressed);
    }
  }

  handlePress = (pressed: boolean) => {
    this.setState((state: State): ?State => {
      if (pressed === state.pressed) return null;
      return {...state, pressed};
    });
  };

  render() {
    return this.props.render({
      ...this.props,
      ...this.state,
      setPress: this.handlePress,
    });
  }
}

export default Pressible;
