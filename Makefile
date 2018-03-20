include index.mk

unit-test:
	mocha --recursive test

install:
	npm install --no-package-lock

test: unit-test
