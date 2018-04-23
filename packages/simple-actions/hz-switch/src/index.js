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
  defaultOn: boolean,
  /**
   * Provide optional default value
   */
  on: boolean,

  onSwitch?: (value: boolean) => void,
};

type State = {
  on: boolean,
};

class Switch extends Component<Props, State> {
  static defaultProps = {
    defaultOn: false,
  };

  state = {
    on: this.getOn({on: this.props.defaultOn}),
  };

  componentDidUpdate(_: any, prevState: State) {
    if (
      typeof this.props.onSwitch === 'function' &&
      prevState.on !== this.state.on
    ) {
      this.props.onSwitch(this.state.on);
    }
  }

  handleToggleSwitch = () => {
    this.setState((state: State): ?State => ({...state, isOn: !state.isOn}));
  getOn(state: State = this.state): boolean {
    return this.isOnControlled() ? this.props.on : state.on;
  }

  isOnControlled(): boolean {
    return this.props.on !== undefined;
  }

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
