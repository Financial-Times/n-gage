instal%: ## install: Install dependencies and copy common dotfiles
instal%: node_modules bower_components dotfiles
	$(MAKE) $(foreach f, $(shell find functions/* -type d -maxdepth 0 2>/dev/null), $f/node_modules $f/bower_components)
	@$(DONE)
	@if [ -z $(CIRCLECI) ] && [ ! -e .env ]; then (echo "Note: If this is a development environment, you will likely need to import the project's environment variables by running 'make .env'."); fi

# INSTALL SUB-TASKS
IS_GIT_IGNORED = grep -q $(if $1, $1, $@) .gitignore
NPM_INSTALL = npm prune --no-production --no-package-lock && npm install --no-package-lock
BOWER_INSTALL = rm -rf bower_components && bower install --config.registry.search=https://origami-bower-registry.ft.com --config.registry.search=https://registry.bower.io

# Regular npm install
node_modules: package.json
	@if [ -e package-lock.json ]; then rm package-lock.json; fi
	@if [ -e package.json ]; then $(NPM_INSTALL) && $(DONE); fi

# Regular bower install
bower_components: bower.json
	@if [ -e bower.json ]; then $(BOWER_INSTALL) && $(DONE); fi

# These tasks have been intentionally left blank (why)
package.json:
bower.json:

# node_modules for Lambda functions
functions/%/node_modules:
	@cd $(dir $@) && if [ -e package.json ]; then $(NPM_INSTALL) && $(DONE); fi

# bower_components for Lambda functions
functions/%/bower_components:
	@cd $(dir $@) && if [ -e bower.json ]; then $(BOWER_INSTALL) && $(DONE); fi

# Manage various dot/config files if they're in the .gitignore
dotfiles-dir = $(ngage-dir)dotfiles
dotfiles-source = $(wildcard $(dotfiles-dir)/.[!.]*)
dotfiles = $(patsubst $(ngage-dir)dotfiles/%, %, $(dotfiles-source))

dotfiles: $(dotfiles)

.%: $(dotfiles-dir)/.%
	@if $(call IS_GIT_IGNORED); then cp $< $@ && $(DONE); fi
