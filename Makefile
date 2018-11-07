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
fixture-repos = next-article n-ui next-myft-email
fixture-targets = $(addprefix integration-test-, $(fixture-repos))
fixture-folders = $(addprefix $(fixture-base)/, $(fixture-repos))
ngage-path = $(realpath index.mk)

$(fixture-base)/%:
	git clone git@github.com:financial-times/$* $@

integration-test-%: $(fixture-base)/%
# edit the fixture's makefile to point at us, not n-gage from node_modules
	sed -i '' "s:-include node_modules/@financial-times/n-gage/index.mk:include $(ngage-path):" $</Makefile

# run a handful of standard next make commands in the fixture folder using the `-C DIRECTORY` option
	$(MAKE) -C $< install build

integration-test: $(fixture-targets)

clean-fixtures:
	rm -rf $(fixture-folders)
