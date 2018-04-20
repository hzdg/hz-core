// @flow
import React, {Component} from 'react';
import Hoverable from '../../hz-hoverable/src/index';
import Pressible from '../../hz-pressible/src/index';

// eslint-disable-next-line no-duplicate-imports
import type {Element} from 'react';

type RenderProps = {
  setToggleSwitch: () => void,
};

type Props = {
  render: (props: RenderProps) => Element<*>,
  /**
   * Provide optional default value
   */
  isOn?: boolean,

  onSwitch?: (value: boolean) => void,
};

type State = {
  isOn: boolean,
};

class Switch extends Component<Props, State> {
  state = {
    isOn: this.props.isOn || false,
  };

  componentDidUpdate(_: any, prevState: State) {
    if (
      typeof this.props.onSwitch === 'function' &&
      prevState.isOn !== this.state.isOn
    ) {
      this.props.onSwitch(this.state.isOn);
    }
  }

  handleToggleSwitch = () => {
    this.setState((state: State): ?State => ({...state, isOn: !state.isOn}));
  };

  render() {
    return (
      <div
        style={{
          '-webkit-user-select': 'none',
          '-khtml-user-select': 'none',
          '-moz-user-select': 'none',
          '-ms-user-select': 'none',
          'user-select': 'none',
        }}
      >
        <Pressible
          render={pressibleProps => (
            <Hoverable
              render={hoverableProps =>
                this.props.render({
                  ...pressibleProps,
                  ...hoverableProps,
                  ...this.state,
                  setToggleSwitch: this.handleToggleSwitch,
                })
              }
            />
          )}
        />
      </div>
    );
  }
}

export default Switch;
