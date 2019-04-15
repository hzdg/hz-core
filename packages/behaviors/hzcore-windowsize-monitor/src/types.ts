export interface Props {
  children: (renderProps: State) => JSX.Element;
}

export interface State {
  width: number;
  height: number;
}
