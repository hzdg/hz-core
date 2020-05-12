import React from 'react';
import {SectionLevelProvider} from './sectionLevel';

type BodyProps = React.HTMLProps<HTMLBodyElement>;
export const Body = React.forwardRef(function Body(
  {children, ...props}: BodyProps,
  ref: React.Ref<HTMLBodyElement>,
): JSX.Element {
  return (
    <body {...props} ref={ref}>
      <SectionLevelProvider value={1}>{children}</SectionLevelProvider>
    </body>
  );
});
Body.displayName = 'Body';

type BlockquoteProps = React.HTMLProps<HTMLQuoteElement>;
export const Blockquote = React.forwardRef(function Blockquote(
  {children, ...props}: BlockquoteProps,
  ref: React.Ref<HTMLQuoteElement>,
): JSX.Element {
  return (
    <blockquote {...props} ref={ref}>
      <SectionLevelProvider value={1}>{children}</SectionLevelProvider>
    </blockquote>
  );
});
Blockquote.displayName = 'Blockquote';

type DetailsProps = React.HTMLProps<HTMLDetailsElement>;
export const Details = React.forwardRef(function Details(
  {children, ...props}: DetailsProps,
  ref: React.Ref<HTMLDetailsElement>,
): JSX.Element {
  return (
    <details {...props} ref={ref}>
      <SectionLevelProvider value={1}>{children}</SectionLevelProvider>
    </details>
  );
});
Details.displayName = 'Details';

type DialogProps = React.HTMLProps<HTMLDialogElement>;
export const Dialog = React.forwardRef(function Dialog(
  {children, ...props}: DialogProps,
  ref: React.Ref<HTMLDialogElement>,
): JSX.Element {
  return (
    <dialog {...props} ref={ref}>
      <SectionLevelProvider value={1}>{children}</SectionLevelProvider>
    </dialog>
  );
});
Dialog.displayName = 'Dialog';

type FieldsetProps = React.HTMLProps<HTMLFieldSetElement>;
export const Fieldset = React.forwardRef(function Fieldset(
  {children, ...props}: FieldsetProps,
  ref: React.Ref<HTMLFieldSetElement>,
): JSX.Element {
  return (
    <fieldset {...props} ref={ref}>
      <SectionLevelProvider value={1}>{children}</SectionLevelProvider>
    </fieldset>
  );
});
Fieldset.displayName = 'Fieldset';

type FigureProps = React.HTMLProps<HTMLElement>;
export const Figure = React.forwardRef(function Figure(
  {children, ...props}: FigureProps,
  ref: React.Ref<HTMLElement>,
): JSX.Element {
  return (
    <figure {...props} ref={ref}>
      <SectionLevelProvider value={1}>{children}</SectionLevelProvider>
    </figure>
  );
});
Figure.displayName = 'Figure';

type TdProps = React.HTMLProps<HTMLTableDataCellElement>;
export const Td = React.forwardRef(function Td(
  {children, ...props}: TdProps,
  ref: React.Ref<HTMLTableDataCellElement>,
): JSX.Element {
  return (
    <td {...props} ref={ref}>
      <SectionLevelProvider value={1}>{children}</SectionLevelProvider>
    </td>
  );
});
Td.displayName = 'Td';
