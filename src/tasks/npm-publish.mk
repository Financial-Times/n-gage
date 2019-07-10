npm-publis%: ## npm-publish: Publish this package to npm.
ifneq ($(CIRCLE_TAG),)
	npm version --no-git-tag-version $(CIRCLE_TAG)
else
	npm-prepublish --verbose
endif
	npm publish --access public
