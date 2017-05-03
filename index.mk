# Export environment variables if a .env file is present.
ifeq ($(ENV_EXPORTED),) # ENV vars not yet exported
ifneq ("$(wildcard .env)","")
sinclude .env
export $(shell [ -f .env ] && sed 's/=.*//' .env)
export ENV_EXPORTED=true
$(info Note — An .env file exists. Its contents have been exported as environment variables.)
endif
endif

# Enforce repo ownership
ifeq ("$(wildcard ft.yml)","")
$(error 'Projects making use of n-makefile *must* define an ft.yml file containing the repo owner's details (see any next- repo for required structure)')
$(error 'If you are creating a project not to be maintained by the next team please feel free to copy what you need from our build tools but don't add an ft.yml.')
$(error 'Integrating with our tooling may result in unwanted effects e.g. nightly builds, slack alerts, emails etc')
endif

# ./node_modules/.bin on the PATH
export PATH := ./node_modules/.bin:$(PATH)

# Use bash not sh
SHELL := /bin/bash

# Some handy utilities
GLOB = git ls-files -z $1 | tr '\0' '\n' | xargs -I {} find {} ! -type l
NPM_INSTALL = npm prune --production=false && npm install
BOWER_INSTALL = bower prune && bower install --config.registry.search=http://registry.origami.ft.com --config.registry.search=https://bower.herokuapp.com
JSON_GET_VALUE = grep $1 | head -n 1 | sed 's/[," ]//g' | cut -d : -f 2
IS_GIT_IGNORED = grep -q $(if $1, $1, $@) .gitignore
VERSION = master
APP_NAME = $(shell cat package.json 2>/dev/null | $(call JSON_GET_VALUE,name))
DONE = echo ✓ $@ done
CONFIG_VARS = curl -fsL https://ft-next-config-vars.herokuapp.com/$1/$(call APP_NAME)$(if $2,.$2,) -H "Authorization: `heroku config:get APIKEY --app ft-next-config-vars`"
IS_USER_FACING = `find . -type d \( -path ./bower_components -o -path ./node_modules \) -prune -o -name '*.html' -print`
MAKEFILE_HAS_A11Y = `grep -rli "make a11y" Makefile`

#
# META TASKS
#

.PHONY: test

#
# COMMON TASKS
#

clea%: ## clean: Clean this git repository.
# HACK: Can't use -e option here because it's not supported by our Jenkins
	@git clean -fxd
	@$(DONE)

instal%: ## install: Setup this repository.
instal%: node_modules bower_components _install_scss_lint .editorconfig .eslintrc.js .scss-lint.yml .pa11yci.js webpack.config.js heroku-cli
	@$(MAKE) $(foreach f, $(shell find functions/* -type d -maxdepth 0 2>/dev/null), $f/node_modules $f/bower_components)
	@$(DONE)
	@if [ -z $(CIRCLECI) ] && [ ! -e .env ]; then (echo "Note: If this is a development environment, you will likely need to import the project's environment variables by running 'make .env'."); fi

deplo%: ## deploy: Deploy this repository.
deplo%: _deploy_apex
	@$(DONE)

verif%: ## verify: Verify this repository.
verif%: ci-n-ui-check _verify_lintspaces _verify_eslint _verify_scss_lint _verify_pa11y_testable
	@$(DONE)

a11%: ## a11y: Check accessibility for this repository.
a11%: _run_pa11y
	@$(DONE)

asset%: ## assets: Build the static assets.
asset%: ## assets-production: Build the static assets for production.
	@if [ -e webpack.config.js ]; then webpack $(if $(findstring assets-production,$@),--bail,--dev); fi

buil%: ## build: Build this repository.
buil%: ## build-production: Build this repository for production.
buil%: dev-n-ui public/__about.json
	@if [ -e webpack.config.js ]; then $(MAKE) $(subst build,assets,$@); fi
	@if [ -e Procfile ] && [ "$(findstring build-production,$@)" == "build-production" ]; then haikro build; fi
	@$(DONE)

watc%: dev-n-ui ## watch: Watch for static asset changes.
	@if [ -e webpack.config.js ]; then webpack --watch --dev; fi
	@$(DONE)

#
# SUB-TASKS
#

ci-n-ui-check:
# In CircleCI
ifneq ($(CIRCLE_BUILD_NUM),)
# The app is using n-ui
ifneq ($(shell grep -s -Fim 1 n-ui bower.json),)
# versions in package.json and bower.json are not equal
ifneq ($(shell awk '$$1 == "\"version\":" {print $$2}' bower_components/n-ui/.bower.json | sed s/,//),$(shell awk '$$1 == "\"version\":" {print $$2}'  node_modules/@financial-times/n-ui/package.json | sed s/,//))
	$(error 'Projects using n-ui must maintain parity between versions. Rebuild without cache and update your bower.json and package.json if necessary. If this error persists make sure that the n-ui build succeeded in publishing a new version to NPM and that both NPM and Bower registries have the latest version.')
endif
endif
endif

# Remind developers that if they want to use a local version of n-ui,
# they need to `export NEXT_APP_SHELL=local`
dev-n-ui:
ifeq ($(NODE_ENV),) # Not production
ifeq ($(CIRCLE_BRANCH),) # Not CircleCI
ifneq ($(shell grep -s -Fim 1 n-ui bower.json),) # The app is using n-ui
ifneq ($(NEXT_APP_SHELL),local) # NEXT_APP_SHELL is not set to local
	$(info Developers: If you want your app to point to n-ui locally, then `export NEXT_APP_SHELL=local`)
endif
endif
endif
endif

# INSTALL SUB-TASKS

# Regular npm install
node_modules: package.json
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

_install_scss_lint:
	@if [ ! -x "$(shell which scss-lint)" ] && [ "$(shell $(call GLOB,'*.scss'))" != "" ]; then gem install scss-lint -v 0.35.0 && $(DONE); fi

# Manage various dot/config files if they're in the .gitignore
.editorconfig .eslintrc.js .scss-lint.yml webpack.config.js .pa11yci.js:
	@if $(call IS_GIT_IGNORED); then curl -sL https://raw.githubusercontent.com/Financial-Times/n-makefile/$(VERSION)/config/$@ > $@ && $(DONE); fi

ENV_MSG_IGNORE_ENV = "Error: '.gitignore' must include: *.env* (including the asterisks)"
ENV_MSG_PACKAGE_JSON = "Error: 'package.json' not found."
ENV_MSG_CIRCLECI = "Error: The 'CIRCLECI' environment variable must *not* be set."
ENV_MSG_CANT_GET = "Error: Cannot get config vars for this service. Check you are added to the ft-next-config-vars service on Heroku with operate permissions. Do that here: https://docs.google.com/spreadsheets/d/1mbJQYJOgXAH2KfgKUM1Vgxq8FUIrahumb39wzsgStu0 (or ask someone to do it for you). Check that your package.json's name property is correct. Check that your project has config-vars set up in https://github.com/Financial-Times/next-config-vars/blob/master/models/development.js."
.env:
	@if [[ $(shell grep --count *.env* .gitignore) -eq 0 ]]; then (echo $(ENV_MSG_IGNORE_ENV) && exit 1); fi
	@if [ ! -e package.json ]; then (echo $(ENV_MSG_PACKAGE_JSON) && exit 1); fi
	@if [ ! -z $(CIRCLECI) ]; then (echo $(ENV_MSG_CIRCLECI) && exit 1); fi
	@$(call CONFIG_VARS,development,env) > .env && perl -pi -e 's/="(.*)"/=\1/' .env && $(DONE) || (echo $(ENV_MSG_CANT_GET) && rm .env && exit 1);

MSG_HEROKU_CLI = "Please make sure the Heroku CLI toolbelt is installed - see https://toolbelt.heroku.com/. And make sure you are authenticated by running ‘heroku login’. If this is not an app, delete Procfile."
heroku-cli:
	@if [ -e Procfile ]; then heroku auth:whoami &>/dev/null || (echo $(MSG_HEROKU_CLI) && exit 1); fi

# VERIFY SUB-TASKS

_verify_eslint:
	@if [ -e .eslintrc.js ]; then $(call GLOB,'*.js') | xargs eslint --ignore-pattern '!' && $(DONE); fi

_verify_lintspaces:
	@if [ -e .editorconfig ] && [ -e package.json ]; then $(call GLOB) | xargs lintspaces -e .editorconfig -i js-comments -i html-comments && $(DONE); fi

_verify_scss_lint:
# HACK: Use backticks rather than xargs because xargs swallow exit codes (everything becomes 1 and stoopidly scss-lint exits with 1 if warnings, 2 if errors)
	@if [ -e .scss-lint.yml ]; then { scss-lint -c ./.scss-lint.yml `$(call GLOB,'*.scss')`; if [ $$? -ne 0 -a $$? -ne 1 ]; then exit 1; fi; $(DONE); } fi

VERIFY_MSG_NO_DEMO = "Error: Components with templates must have a demo app, so that pa11y can test against it. This component doesn’t seem to have one. Add a demo app to continue peacefully. See n-image for an example."
VERIFY_MSG_NO_PA11Y = "\n**** Error ****\nIt looks like your code is user-facing; your Makefile should include make a11y\nIf you need to disable a11y, use export IGNORE_A11Y = true in your Makefile\n********\n\n"
#check if project has HTML and missing make a11y command
#check if project has demo app if there's a make a11y command
_verify_pa11y_testable:
	@if [ "$(IS_USER_FACING)" ] && [ -z $(MAKEFILE_HAS_A11Y) ] && [ ! ${IGNORE_A11Y} ]; then (printf $(VERIFY_MSG_NO_PA11Y) && exit 1); fi
	@if [ ! -d server ] && [ -d templates ] && [ ! -f demos/app.js ]; then (echo $(VERIFY_MSG_NO_DEMO) && exit 1); fi
	@$(DONE)

_run_pa11y:
	echo $(CIRCLE_BRANCH)
ifneq ($(CIRCLE_BRANCH),)
	@export TEST_URL=${TEST_APP}; \
	echo ${TEST_APP} | grep http -s || export TEST_URL=http://${TEST_APP}.herokuapp.com; \
	pa11y-ci;
else
	@export TEST_URL=http://local.ft.com:3002; pa11y-ci;
endif

# DEPLOY SUB-TASKS

APEX_PROD_ENV_FILE = .env.prod.json
_deploy_apex:
	@if [ -e project.json ]; then $(call CONFIG_VARS,production) > $(APEX_PROD_ENV_FILE) && apex deploy --env-file $(APEX_PROD_ENV_FILE); fi
	@if [ -e $(APEX_PROD_ENV_FILE) ]; then rm $(APEX_PROD_ENV_FILE) && $(DONE); fi

npm-publis%: ## npm-publish: Publish this package to npm.
	npm-prepublish --verbose
	npm publish --access public

# BUILD SUB-TASKS

# Only apply to Heroku apps for now
public/__about.json:
	@if [ -e Procfile ]; then mkdir -p public && echo '{"description":"$(call APP_NAME)","support":"next.team@ft.com","supportStatus":"active","appVersion":"$(shell git rev-parse HEAD | xargs echo -n)","buildCompletionTime":"$(shell date -u +"%Y-%m-%dT%H:%M:%SZ")"}' > $@ && $(DONE); fi

update-tools: ## update-tools: Update this Makefile.
	$(eval LATEST = $(shell curl -fs https://api.github.com/repos/Financial-Times/n-makefile/tags | $(call JSON_GET_VALUE,name)))
	$(if $(filter $(LATEST), $(VERSION)), $(error Cannot update n-makefile, as it is already up to date!))
	@curl -sL https://raw.githubusercontent.com/Financial-Times/n-makefile/$(LATEST)/Makefile > n.Makefile
	@perl -p -i -e "s/^VERSION = master/VERSION = ${LATEST}/" n.Makefile
	@read -p "Updated tools from $(VERSION) to $(LATEST).  Do you want to commit and push? [y/N] " Y;\
	if [ "$$Y" == "y" ]; then git add n.Makefile && git commit -m "Updated tools to $(LATEST)" && git push origin HEAD; fi
	@$(DONE)

hel%: ## help: Show this help message.
	@echo "usage: make [target] ..."
	@echo ""
	@echo "targets:"
	@grep -Eh '^.+:\ ##\ .+' ${MAKEFILE_LIST} | cut -d ' ' -f '3-' | column -t -s ':'

# Wrapper for make deploy which prevents it running when build is a nightly
# Nightly builds are trigger by next-rebuild-bot
deploy-by-day:
ifeq ($(FT_NIGHTLY_BUILD),)
	$(MAKE) deploy
else
	echo "Nightly build - exiting before deploy"
endif
