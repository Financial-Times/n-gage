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

$(fixture-base)/%: ~/.ssh/known_hosts
	git clone --depth 1 git@github.com:financial-times/$* $@

# add a known key fingerprint for github.com to known_hosts. fairly safe.
# on developer machines, this already exists, so we won't overwrite it.
# on CI, it doesn't so it creates it.
~/.ssh/known_hosts:
	mkdir -p $(@D)
	echo 'github.com,192.30.253.112 ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEAq2A7hRGmdnm9tUDbO9IDSwBK6TbQa+PXYPCPy6rbTrTtw7PHkccKrpp0yVhp5HdEIcKr6pLlVDBfOLX9QUsyCOV0wzfjIJNlGEYsdlLJizHhbn2mUjvSAHQqZETYP81eFzLQNnPHt4EVVUh7VfDESU84KezmD5QlWpXLmvU31/yMf+Se8xhHTvKSCZIFImWwoG6mbUoWf9nzpIoaSjB+weqqUUmpaaasXVal72J+UX2B+2RPW3RcT0eOzQgqlJL3RKrTJvdsjE3JEAvGq3lGHSZXy28G3skua2SmVi/w4yCE6gbODqnTWlg7+wC604ydGXA8VJiS5ap43JXiUFFAaQ==' > $@

integration-test-%: $(fixture-base)/%
# edit the fixture's makefile to point at us, not n-gage from node_modules
	sed -i '' "s:-include node_modules/@financial-times/n-gage/index.mk:include $(ngage-path):" $</Makefile

# run a handful of standard next make commands in the fixture folder using the `-C DIRECTORY` option
	$(MAKE) -C $< install build

integration-test: $(fixture-targets)

clean-fixtures:
	rm -rf $(fixture-folders)
