HZ Core Component Library
=====================

React Component Library used at HZ.


## Quick View Of Latest Docker Image
If you only need to view the latest image:
1. Run `docker pull hzdg/hz-core:latest`
2. Run `docker run --rm -p 5000:6060 hzdg/hz-core:latest` and open `http://localhost:5000` on your browser.




## Development

### New Component
Before creating a new package for a new component, please [create a new Github issue describing the new component](???). Make sure we don't already have an existing component for it by reviewing the [styleguide](???).

### Create Package

**NOTE**: This project is currently deployed in docker as a _public repository_. **DO NOT** add sensitive information (secret keys, API tokens, passwords, etc) in this codebase.

You will need:
- Node 8+
- Yarn

1. Pull down project from Github
2. Run `make start`. This command will first install any needed dependencies, and then start up a container using your own project directory.
3. Navigate to `http://localhost:5000`

#### New Package
Before making a new package, make sure you are:

1. working off a clean working tree with all other changes either stashed or committed and pushed. Because of the nature of how lerna publishes packages, it is essential to isolate your package creation/development isolated from any other changes across the library.

2. working off your own branch apart from any release branches (eg. `hz-my-component`)

To create a new package, run `make create-new-package`. A new package will be added into the `./packages` directory. Move the component if it will need to live under any of the subcategories (eg. `./packages/animations`).

#### Development

##### React Styleguidist
We use [react-styleguidist](https://github.com/styleguidist/react-styleguidist) to view all components. Check out their info on [documenting components](https://react-styleguidist.js.org/docs/documenting.html) for general information. Some useful tips when documenting your component:
- Add the `@version` jsdoc tag your component class to show version for the component

##### Best Practices
- **Render Props** are a useful technique for components that are used mostly for state management where it does not care about the shape of the children. [Read more about render props here](https://reactjs.org/docs/render-props.html).
    - Note: Remember that both `this.props` and `this.state` can share a common variable, so be conscious of which object you pass first into the render prop.


#### Deploy Build
When you are ready to deploy a build for further development use, you will first need to update the tags, following [semantic versioning](https://semver.org) both in Github and Docker.

##### Docker
The main branch in development has an autobuild set up to create a new build with a `latest-autobuild` tag. An autobuild is triggered whenever a push is made to this branch. All [other tags that you will find for this image](https://cloud.docker.com/swarm/hzdg/repository/docker/hzdg/hz-core/tags) will usually be labelled with their cooreponding tag/release mirroring Github.

##### Github
With the use of [Lerna](https://github.com/lerna/lerna), each individual package is shipped with their own version separate from the main repository library (sometimes called a monorepo).

To update both Docker and Github, run `make bump-tags`.

### Publish Packages
1. Run `make build-dist` which will make a build/ folder
2. TODO: Implement publish command to publish to (private) npm registry



## Project Structure
Uses:
- [Lerna](https://github.com/lerna/lerna)
- [react-styleguidist](https://github.com/styleguidist/react-styleguidist)
- [Docker](https://www.docker.com/)
- [Flow](https://flow.org/)
- [Yarn](https://yarnpkg.com/en/)
