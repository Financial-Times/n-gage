verif%: ## verify: Verify this repository.
verif%: ci-n-ui-check _verify_lintspaces _verify_eslint _verify_stylelint
	@$(DONE)

# DEPLOY SUB-TASKS

ci-n-ui-check:
# In CircleCI
ifneq ($(CIRCLE_BUILD_NUM),)
# The app is using n-ui
ifneq ($(shell grep -s -Fim 1 '"n-ui"' bower.json),)
# versions in package.json and bower.json are not equal
ifneq ($(shell awk '$$1 == "\"version\":" {print $$2}' bower_components/n-ui/.bower.json | sed s/,//),$(shell awk '$$1 == "\"version\":" {print $$2}'  node_modules/@financial-times/n-ui/package.json | sed s/,//))
	$(error 'Projects using n-ui must maintain parity between versions. Rebuild without cache and update your bower.json and package.json if necessary. If this error persists make sure that the n-ui build succeeded in publishing a new version to NPM (https://circleci.com/gh/Financial-Times/n-ui) and that both NPM and Bower registries have the latest version.')
endif
endif
endif

_verify_eslint:
	@if [ -e .eslintrc.js ]; then $(call GLOB,'*.js') | xargs eslint --ignore-pattern '!' --fix && $(DONE); fi

_verify_lintspaces:
	@if [ -e .editorconfig ] && [ -e package.json ]; then $(call GLOB) | grep -Ev '(package.json|bower.json|circle.yml)' | xargs lintspaces -e .editorconfig -i js-comments -i html-comments && $(DONE); fi

_verify_stylelint:
	@if [ -e .stylelintrc ]; \
		then $(call GLOB,'*.scss') | xargs stylelint \
			&& echo "*** Next developers ***\nPro tip for fixing SCSS linting errors: stylelint client/**.scss --fix" \
			&& $(DONE); \
	fi
