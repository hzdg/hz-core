# HZ Core

[HZ]'s library of [components], [hooks], and utilities for [React]!

## Usage

What kinda stuff is in here, and how do i use it in my project?

[Read the Docs!][docs]

## Bugs

If you're running into issues using HZ Core components,
please [open an issue describing the problem][issues].

### TODO: Add bug report github template

## New Components

Before creating a new package for a new component, please
[create a new Github issue describing the new component][issues].

Make sure we don't already have an existing component for it
by reviewing the [docs].

### TODO: Add new component github template

The rest of this document is about hacking on HZ core.

---

## Getting Started

You will need:

-   Node 8+
-   Yarn

1. Pull down project from Github
2. Run `yarn`
3. Run `lerna bootstrap`

## Project Structure

HZ Core is structured as a monorepo. We use a number of tools and conventions
to keep things organized and interoperable. Much of this work is done for us
through the magic of [Lerna] and [Yarn] workspaces.

Uses:

-   [Lerna]
-   [Docz]
-   [Typescript]
-   [Yarn]

## How to Write a Commit Message

We use [Conventional Commits] to help automate [Semantic Versioning][semver]
of our packages, and to help in generating a useful [Changelog]. We opt to use
a GitHub-inspired [Gitmoji]-based commit type. This reduces the amount of
character count required for specifying type, and also gives a (subjectively)
easier visual guide to the types of changes commits are making.

> NOTE: While it's possible to compose your commit messages any way you want,
> it is recommended that you run `yarn commit`, which will use a [Commitizen]
> CLI workflow to help you write your message, rather than `git commit`.

As such, a commit message should take the form:

```
<type> [(scope)] <subject>

[body]
```

Where \<angle segments\> are required,
and [bracket segments] are optional.

Some examples:

`🚨 squash linting errors`

`➕ (@hzcore/scroll-monitor) add react-dom@^16.3.1`

`🐛 (@hzcore/scroll-monitor) fix wheel delta and velocity`

## TODO: How to Create a New Package

## TODO: How to Write a Commit Message

## TODO: How to Write Components

-   **Render Props** are a useful technique for components that are used mostly
    for state management where it does not care about the shape of the children.
    [Read more about render props here][render props].
    -   Note: Remember that both `this.props` and `this.state`
        can share a common variable, so be conscious of which
        object you pass first into the render prop.

## TODO: How to Write Tests

We use [Jest] to test things. To run tests, simply run `yarn test`.
If you want to keep your tests running while you work, run `yarn test --watch`.

## TODO: How to Write Docs

We use [Docz] to view all components. Check out their info on
[writing MDX](https://www.docz.site/docs/writing-mdx) for general information.

### Running the docz dev server

1. Run `yarn develop`
2. Navigate to `http://localhost:3000`

### Publishing docs

[Docs] are published to [Netlify] automatically via [CI],
so all you should need to do to publish is a simple `git push`.

[hz]: https://hzdg.com
[react]: https://reactjs.org
[components]: https://reactjs.org/docs/components-and-props.html
[render props]: https://reactjs.org/docs/render-props.html
[hooks]: https://reactjs.org/docs/hooks-intro.html
[docs]: https://hz-core.netlify.com/
[lerna]: https://github.com/lerna/lerna
[docz]: https://www.docz.site/
[typescript]: https://www.typescriptlang.org/
[yarn]: https://yarnpkg.com/en/
[semver]: https://semver.org
[netlify]: https://app.netlify.com/sites/hz-core/overview
[ci]: https://circleci.com/gh/hzdg/hz-core
[issues]: https://github.com/hzdg/hz-core/issues
[jest]: https://jestjs.io/
[conventional commits]: https://www.conventionalcommits.org/
[commitizen]: http://commitizen.github.io/cz-cli/
[gitmoji]: https://gitmoji.carloscuesta.me/
[changelog]: https://keepachangelog.com/
