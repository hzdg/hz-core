// @flow
import {Component} from 'react';

// eslint-disable-next-line no-duplicate-imports
import type {Element} from 'react';

type RenderProps = {};

type Props = {
  render: (props: RenderProps) => Element<*>,

  onHover?: (value: boolean) => void,
};

type State = {
  hovered: boolean,
};

const initialState = {
  hovered: false,
};

class Hoverable extends Component<Props, State> {
  state = {...initialState};

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (
      typeof this.props.onHover === 'function' &&
      prevState.hovered !== this.state.hovered
    ) {
      this.props.onHover(this.state.hovered);
    }
  }

  getHoverableReturnProps() {
    return {
      getHoverableProps: {
        ...this.props,
        ...this.state,
        setHover: this.handleSetHover,
      },
    };
  }

  handleSetHover = (hovered: boolean) => {
    this.setState((state: State): ?State => {
      if (hovered === state.hovered) return null;
      return {...state, hovered};
    });
  };

  render() {
    return this.props.render(this.getHoverableReturnProps());
  }
}

export default Hoverable;
