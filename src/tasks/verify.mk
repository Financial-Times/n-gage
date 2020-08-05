verif%: ## verify: Check files for linting errors
verif%: _verify_lintspaces _verify_eslint _verify_stylelint
	@$(DONE)

# DEPLOY SUB-TASKS

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
