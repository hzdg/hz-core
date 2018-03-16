HZ Core Component Library
=====================

React Component Library used at HZ.


## View Latest Docker Image
If you only need to view the image.
1. Select which image tag you will need to pull down from the Docker Hub
2. Run `docker pull hzdg/hz-core:<TAG NAME>`
3. Run `docker run --rm -p 5000:6060 hzdg/hz-core:<TAG NAME>` and open `http://localhost:5000` on your browser.


## To Develop
You will need:
- Node 8+
- Yarn

1. Pull down project from Github
2. Run `make start`. This command will first install any needed dependencies, and then start up a container using your own project directory.
3. Navigate to `http://localhost:5000`


## Build Packages
1. Run `make yarn build-dist` which will make a build/ folder
2. TODO: Automate tagging for both the docker image and git tagging



## Notes
- Every push to current develop branch will trigger a build with a latest tag. This tag will be pulled at every run.
- Possibly only change one package for every new tag


## Project Structure
Uses:
- [Lerna](https://github.com/lerna/lerna)
- [react-styleguidist](https://github.com/styleguidist/react-styleguidist)
- [Docker](https://www.docker.com/)
- [Flow](https://flow.org/)
- [Yarn](https://yarnpkg.com/en/)
