verif%: ## verify: Verify this repository.
verif%: ci-n-ui-check _verify_lintspaces _verify_eslint _verify_stylelint _verify_pa11y_testable
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

VERIFY_MSG_NO_DEMO = "Error: Components with templates must have a demo app, so that pa11y can test against it. This component doesn’t seem to have one. Add a demo app to continue peacefully. See n-image for an example."
VERIFY_MSG_NO_PA11Y = "\n**** Error ****\nIt looks like your code is user-facing; your Makefile should include make a11y\nIf you need to disable a11y, use export IGNORE_A11Y = true in your Makefile\n********\n\n"
#check if project has HTML and missing make a11y command
#check if project has demo app if there's a make a11y command
_verify_pa11y_testable:
	@if [ ! -z "$(IS_USER_FACING)" ] && [ -z $(MAKEFILE_HAS_A11Y) ] && [ ! ${IGNORE_A11Y} ]; then (printf $(VERIFY_MSG_NO_PA11Y) && exit 1); fi
	@if [ ! -z "$(IS_USER_FACING)" ] && [ ! -d server ] && [ ! -f demos/app.js ] && [ ! -f demos/app.ts ] && [ ! ${IGNORE_A11Y} ]; then (echo $(VERIFY_MSG_NO_DEMO) && exit 1); fi
	@$(DONE)
