# common variables for tasks, make flags, meta rules

#
# ENVIRONMENT SETUP
#

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
$(error 'Projects making use of n-gage *must* define an ft.yml file containing the repo owner’s details (see any next- repo for required structure)')
$(error 'If you are creating a project not to be maintained by the next team please feel free to copy what you need from our build tools but don’t add an ft.yml.')
$(error 'Integrating with our tooling may result in unwanted effects e.g. nightly builds, slack alerts, emails etc')
endif

# ./node_modules/.bin on the PATH
export PATH := $(PATH):$(ngage-dir)node_modules/.bin:./node_modules/.bin

# Use bash not sh
SHELL := /bin/bash

# verify that githooks are configured correctly
GITHOOKS := $(shell node $(ngage-dir)scripts/githooks.js)
ifneq ("$(GITHOOKS)","")
$(error $(GITHOOKS))
endif

#
# FUNCTIONS
#

# misc/legacy
GLOB = git ls-files -z $1 | tr '\0' '\n' | xargs -I {} find {} ! -type l

NPM_INSTALL = npm prune --production=false --no-package-lock && npm install --no-package-lock
BOWER_INSTALL = bower prune && bower install --config.registry.search=https://origami-bower-registry.ft.com --config.registry.search=https://registry.bower.io

JSON_GET_VALUE = grep $1 | head -n 1 | sed 's/[," ]//g' | cut -d : -f 2
APP_NAME = $(shell cat package.json 2>/dev/null | $(call JSON_GET_VALUE,name))

IS_GIT_IGNORED = grep -q $(if $1, $1, $@) .gitignore
REPLACE_IN_GITIGNORE = sed -i -e 's/$1/$2/g' .gitignore && rm -f .gitignore-e ||:

# functions for eye-catching terminal output
COLOR = $(shell /usr/bin/env PATH=$(PATH) FORCE_COLOR=1 chalk --no-stdin -t "$1 ")
CAPITALISE = $(shell STR="$1"; echo "$$(tr '[:lower:]' '[:upper:]' <<<"$${STR:0:1}")$${STR:1}")

MESSAGE = $(call COLOR,{black.bg$(call CAPITALISE,$1)  $2 }{$1.bgBlackBright.bold  $3 } $(strip $4))

define SPACED_MESSAGE # deliberate newline for whitespace in output

$(call MESSAGE,$1,$2,$3,$4)
endef

ERROR = $(error $(call SPACED_MESSAGE,red,✕,ERROR,$1))
WARN = $(warning $(call SPACED_MESSAGE,yellow,!,WARNING,$1))
LOG = $(info $(call MESSAGE,blue,i,INFO,$1))

DONE = echo $(call COLOR, {black.bgGreen  ✓ }{black.bgBlackBright  $@ } done)

# functions for ensuring variables exist
_SORT_VARS_LIST = $(strip $(sort $1))
_MISSING_VARS = $(call _SORT_VARS_LIST, $(filter-out $(.VARIABLES), $1))

ASSERT_VARS_EXIST = $(if $(call _MISSING_VARS,$1),\
  $(call ERROR, $(call COLOR, Variables {cyan $(call _MISSING_VARS,$1)} must be defined in your Makefile))\
)

ASSERT_ANY_VAR_EXISTS = $(if $(findstring $(call _SORT_VARS_LIST,$1),$(call _MISSING_VARS,$1)),\
  $(call ERROR, $(call COLOR, At least one of the variables {cyan $(strip $1)} must be defined in your Makefile))\
)

# functions for testing review or local apps

# this file is created by the `review-app` task. if it exists it contains the name of
# the review app on heroku
REVIEW_APP=$(shell cat .review-app)

#
# META TASKS
# (specially-named targets that enable certain Make behaviour)
#

# Note: A 'node_modules' directory is created when n-gage self-installs.
# However: Subsequent calls to `node_modules`, made in order to execute $NPM_INSTALL,
# are *not* processed because the node_modules directory exists.
# Therefore use .PHONY to tell Make to not look for a node_modules file/folder,
# but to run the node_modules task instead. 'bower_components' is incuded for similar
# reasons, though it's not strictly neccessary at this point in time.
.PHONY: test node_modules bower_components

# if make has created any files, but then errors, delete the files it created instead of
# leaving them around
.DELETE_ON_ERROR:
