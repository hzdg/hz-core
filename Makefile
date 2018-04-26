.PHONY: \
	# Create src/ package.json and README along with basic dependencies
	create-new-package \
	# Start local docker instance
	start \
	# Start up styleguidist server
	styleguide
	# Automatically bump tags for Github and Docker
	bump-tags
	# Builds out all packages to build/ directory
	build-dist \
	# Publishes all packages to the public npm registry
	publish-to-npm \


create-new-package:
	./scripts/create-package.sh

start:
	yarn
	jest
	flow check
	docker-compose up

styleguide:
	./node_modules/.bin/styleguidist server

bump-tags:
	./scripts/bump-tags.sh

build-dist:
	lerna bootstrap
	node ./scripts/rollup/build.js

publish-to-npm:
	echo 'Not yet implemented'
