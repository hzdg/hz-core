.PHONY: \
	# Create src/ package.json and README along with basic dependencies
	create-new-package

	# Builds out all packages to build/ directory
	build-dist

	# Publishes all packages to the public npm registry
	publish-to-npm

create-new-package:
	echo 'Not yet implemented'

start:
	yarn
	docker-compose up

styleguide:
	styleguidist server

build-dist:
	lerna bootstrap
	node ./scripts/rollup/build.js

publish-to-npm:
	echo 'Not yet implemented'
