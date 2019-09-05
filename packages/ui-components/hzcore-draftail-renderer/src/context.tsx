import React, {useContext} from 'react';

const isFunction = (obj: {}): boolean => typeof obj === 'function';

export type ComponentType =
  | 'p'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'thematicBreak'
  | 'blockquote'
  | 'ul'
  | 'ol'
  | 'li'
  | 'table'
  | 'tr'
  | 'td'
  | 'pre'
  | 'code'
  | 'em'
  | 'strong'
  | 'delete'
  | 'inlineCode'
  | 'hr'
  | 'a'
  | 'img';

export type Components = {
  [key in ComponentType]?: React.ComponentType<{children: React.ReactNode}>
} & {[type: string]: unknown};

export type DraftailProviderProps = React.PropsWithChildren<{
  components: Components;
}>;

export const DraftailContext = React.createContext({});

export const useDraftailComponents = (components: Components): Components => {
  const contextComponents = useContext(DraftailContext);
  let allComponents = contextComponents;
  if (components) {
    allComponents = isFunction(components)
      ? components(contextComponents)
      : {...contextComponents, ...components};
  }
  return allComponents;
};

export default function DraftailProvider(
  props: DraftailProviderProps,
): JSX.Element {
  const allComponents = useDraftailComponents(props.components);
  return (
    <DraftailContext.Provider value={allComponents}>
      {props.children}
    </DraftailContext.Provider>
  );
}
