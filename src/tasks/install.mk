FUNCTIONS_PACKAGE_JSONS = $(wildcard functions/*/package.json)
FUNCTIONS_NPM_FOLDERS = $(patsubst functions/%/package.json, functions/%/node_modules, $(FUNCTIONS_PACKAGE_JSONS))
FUNCTIONS_BOWER_JSONS = $(wildcard functions/*/bower_components)
FUNCTIONS_BOWER_FOLDERS = $(patsubst functions/%/bower.json, functions/%/bower_components, $(FUNCTIONS_BOWER_JSONS))

instal%: ## install: Setup this repository.
instal%: node_modules bower_components stylelint-transition .editorconfig .eslintrc.js .stylelintrc .pa11yci.js $(FUNCTIONS_NPM_FOLDERS) $(FUNCTIONS_BOWER_FOLDERS)
	@$(DONE)
	@if [ -z $(CIRCLECI) ] && [ ! -e .env ]; then (echo "Note: If this is a development environment, you will likely need to import the project's environment variables by running 'make .env'."); fi

# INSTALL SUB-TASKS

# Regular npm install
node_modules: package.json
	@if [ -e package-lock.json ]; then rm package-lock.json; fi
	@if [ -e package.json ]; then $(NPM_INSTALL) && $(DONE); fi

# Regular bower install
bower_components: bower.json
	@if [ -e bower.json ]; then $(BOWER_INSTALL) && $(DONE); fi

# These tasks have been intentionally left blank
package.json:
bower.json:

# node_modules for Lambda functions
functions/%/node_modules:
	@cd $(dir $@) && if [ -e package.json ]; then $(NPM_INSTALL) && $(DONE); fi

# bower_components for Lambda functions
functions/%/bower_components:
	@cd $(dir $@) && if [ -e bower.json ]; then $(BOWER_INSTALL) && $(DONE); fi

# Manage various dot/config files if they're in the .gitignore
.editorconfig .eslintrc.js .stylelintrc .pa11yci.js:
	@if $(call IS_GIT_IGNORED); then cp './node_modules/@financial-times/n-gage/dotfiles/$@' $@ && $(DONE); fi

stylelint-transition:
	@if ! $(call IS_GIT_IGNORED,'.stylelintrc') && $(call IS_GIT_IGNORED,'.scss-lint.yml'); \
		then $(call REPLACE_IN_GITIGNORE,'.scss-lint.yml','.stylelintrc') \
			&& echo "*** Next developers***\nProjects making use of SCSS linting must now include .stylelintrc instead of .scss-lint.yml in .gitignore. Please commit your modified .gitignore" \
			&& $(DONE); \
	fi
