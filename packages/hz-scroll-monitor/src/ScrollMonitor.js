/* eslint-disable react/no-unused-prop-types */
import {Component} from 'react';
import PropTypes from 'prop-types';
import {scrollProviderContextTypes} from './ScrollProvider';

const scrollMonitorConfigTypes = {
  children: PropTypes.func.isRequired,
  vertical: PropTypes.bool,
  horizontal: PropTypes.bool,
  direction: PropTypes.bool,
  viewport: PropTypes.bool,
  area: PropTypes.shape({
    top: PropTypes.number,
    right: PropTypes.number,
    bottom: PropTypes.number,
    left: PropTypes.number,
  }),
};

const defaultScrollMonitorConfig = {
  vertical: false,
  horizontal: false,
  direction: false,
  viewport: false,
  area: null,
};

const initialState = {
  top: null,
  left: null,
  width: null,
  height: null,
  lastTop: null,
  lastLeft: null,
  lastWidth: null,
  lastHeight: null,
  horizontalDirection: null,
  verticalDirection: null,
};

export default class ScrollMonitor extends Component {
  static contextTypes = scrollProviderContextTypes;
  static propTypes = scrollMonitorConfigTypes;
  static defaultProps = defaultScrollMonitorConfig;

  state = {...initialState};

  componentWillMount() {
    this.register();
  }

  componentWillUnmount() {
    if (this.registration) {
      this.registration.unregister();
      this.registration = null;
    }
  }

  registration = null;

  register() {
    if (this.registration) this.registration.unregister();
    this.registration = this.context.scrollProvider.register(
      this.props,
      this.handleUpdate,
    );
  }

  handleUpdate = state => {
    this.setState(state);
  };

  render() {
    return this.props.children(this.state);
  }
}
