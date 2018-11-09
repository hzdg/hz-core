import type {Element} from 'react';

export type Props = {
  children: State => Element<*>,
};

export type State = {
  width: number,
  height: number,
};
