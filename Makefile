.PHONY: build-dist


# Builds out all the packages to their respective package directory with a lib/ folder
build-dist:
	./scripts/build-dist.sh

# Publishes all packages to the public npm registry
publish-to-npm:
	echo 'Not yet implemented'

create-new-package:
	echo 'Not yet implemented'
