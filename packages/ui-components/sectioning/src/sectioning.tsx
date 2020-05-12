import React from 'react';
import {SectionLevelProvider, useNextSectionLevel} from './sectionLevel';

type SectionProps = React.HTMLProps<HTMLElement>;
export const Section = React.forwardRef(function Section(
  {children, ...props}: SectionProps,
  ref: React.Ref<HTMLElement>,
): JSX.Element {
  return (
    <section {...props} ref={ref}>
      <SectionLevelProvider value={useNextSectionLevel()}>
        {children}
      </SectionLevelProvider>
    </section>
  );
});

Section.displayName = 'Section';

type ArticleProps = React.HTMLProps<HTMLElement>;
export const Article = React.forwardRef(function Article(
  {children, ...props}: ArticleProps,
  ref: React.Ref<HTMLElement>,
): JSX.Element {
  return (
    <article {...props} ref={ref}>
      <SectionLevelProvider value={useNextSectionLevel()}>
        {children}
      </SectionLevelProvider>
    </article>
  );
});
Article.displayName = 'Article';

type AsideProps = React.HTMLProps<HTMLElement>;
export const Aside = React.forwardRef(function Aside(
  {children, ...props}: AsideProps,
  ref: React.Ref<HTMLElement>,
): JSX.Element {
  return (
    <aside {...props} ref={ref}>
      <SectionLevelProvider value={useNextSectionLevel()}>
        {children}
      </SectionLevelProvider>
    </aside>
  );
});
Aside.displayName = 'Aside';

type NavProps = React.HTMLProps<HTMLElement>;
export const Nav = React.forwardRef(function Nav(
  {children, ...props}: NavProps,
  ref: React.Ref<HTMLElement>,
): JSX.Element {
  return (
    <nav {...props} ref={ref}>
      <SectionLevelProvider value={useNextSectionLevel()}>
        {children}
      </SectionLevelProvider>
    </nav>
  );
});
Nav.displayName = 'Nav';
