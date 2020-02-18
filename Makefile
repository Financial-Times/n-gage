# the repos in the fixtures directory are user facing,
# which makes n-gage think it itself is user facing
IGNORE_A11Y = true

include index.mk

unit-test:
	mocha --recursive test

install:
	npm install --no-package-lock

test: unit-test integration-test

fixture-base = test/fixtures
fixture-repos = next-article next-myft-email n-tracking # app, lambda, component
fixture-targets = $(addprefix integration-test-, $(fixture-repos))
fixture-folders = $(addprefix $(fixture-base)/, $(fixture-repos))
ngage-path = $(realpath index.mk)
git-clone-base = $(if $(GITHUB_AUTH_TOKEN), https://$(GITHUB_AUTH_TOKEN)@github.com/financial-times, git@github.com:financial-times)

$(fixture-base)/%:
	@git clone --depth 1 $(git-clone-base)/$* $@

integration-test-%: $(fixture-base)/%
# edit the fixture's makefile to point at us, not n-gage from node_modules
	sed -i'.bak' "s:-include node_modules/@financial-times/n-gage/index.mk:include $(ngage-path):" $</Makefile

# run a handful of standard next make commands in the fixture folder using the `-C DIRECTORY` option
	$(MAKE) -C $< install build

# ensure the folders have some basic things we would expect from install
	[ -d $</node_modules ]
	[ -f $</.editorconfig ]

integration-test: $(fixture-targets)

clean-fixtures:
	rm -rf $(fixture-folders)
