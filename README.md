# n-gage
Make it so next

## Usage

In your makefile include the following lines before anything else
```
node_modules/@financial-times/n-gage/index.mk: package.json
	npm install @financial-times/n-gage
	touch $@

-include node_modules/@financial-times/n-gage/index.mk

$(call require, @financial-times/n-gage)
```

This will make all the tasks defined in `n-gage` (formerly known as `n-makefile`) available.

### How does it work

It uses some magic @quarterto (Matt Brennan) dreamed up. It all revolves around `-include` - a conditional include. If, by the end of parsing your `Makefile`, `make` finds that any files referenced with `-include` don't exist or are out of date, it will run any tasks it finds that match the missing file. As we define a task for the missing n-gage makefile this gets run. All it does is npm install `n-gage`, and then `touch $@` makes sure that `make` knows that the installed file is up to date
