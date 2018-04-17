HZ Core Component Library
=====================

React Component Library used at HZ.


## View Latest Docker Image
If you only need to view the latest image:
1. Run `docker pull hzdg/hz-core:latest`
2. Run `docker run --rm -p 5000:6060 hzdg/hz-core:latest` and open `http://localhost:5000` on your browser.


## To Develop

**NOTE**: This project is currently deployed in docker as a _public repository_. **DO NOT** add sensitive information (secret keys, API tokens, passwords, etc) in this codebase.

You will need:
- Node 8+
- Yarn

1. Pull down project from Github
2. Run `make start`. This command will first install any needed dependencies, and then start up a container using your own project directory.
3. Navigate to `http://localhost:5000`

### New Package
To create a new package, run `make create-new-package`.


## Build Packages
1. Run `make build-dist` which will make a build/ folder
2. TODO: Automate tagging for both the docker image and git tagging



## Notes
- Every push to current develop branch will trigger a build with a latest tag. This tag will be pulled at every run.
- Possibly only change one package for every new tag
- Add `@version` jsdoc tag to show version for the component
- Render prop arguments should have this.props precede this.state to favor key namespace in state.
- Possibly strip render prop when sending arguments to render prop


## Project Structure
Uses:
- [Lerna](https://github.com/lerna/lerna)
- [react-styleguidist](https://github.com/styleguidist/react-styleguidist)
- [Docker](https://www.docker.com/)
- [Flow](https://flow.org/)
- [Yarn](https://yarnpkg.com/en/)
