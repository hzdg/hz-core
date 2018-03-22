.PHONY: \
	# Create src/ package.json and README along with basic dependencies
	create-new-package \
	# Builds out all packages to build/ directory
	build-dist \
	# Publishes all packages to the public npm registry
	publish-to-npm \
	# Start local docker instance
	start \
	# Start up styleguidist server
	styleguide

create-new-package:
	./scripts/create-package.sh

start:
	yarn
	docker-compose up

styleguide:
	./node_modules/.bin/styleguidist server

build-dist:
	lerna bootstrap
	node ./scripts/rollup/build.js

bump-tags:
	./scripts/bump-tags.sh

update-docker-tags:
	./scripts/update-docker-tags.sh

publish-to-npm:
	echo 'Not yet implemented'
