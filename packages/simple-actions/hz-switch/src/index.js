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
          WebkitUserSelect: 'none',
          KhtmlUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          userSelect: 'none',
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
