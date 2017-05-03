# n-gage
Make it so next

## Usage

In your makefile include the following lines before anything else (follow the numbered comments to understand how it works)

```
# [2]	This task tells make how to 'build' n-gage. It npm installs n-gage, and
#			Once that's done it overwrites the file with its own contents - this
#			ensures the timestamp on the file is recent, so make won't think the file
#			is out of date and try to rebuild it every time
node_modules/@financial-times/n-gage/index.mk:
	npm install @financial-times/n-gage
	touch $@

# [1] If, by the end of parsing your `Makefile`, `make` finds that any files
# 		referenced with `-include` don't exist or are out of date, it will run any
# 		tasks it finds that match the missing file. So if n-gage *is* installed
#			it will just be included; if not, it will look for a task to run
-include node_modules/@financial-times/n-gage/index.mk

$(call require, @financial-times/n-gage)
```

This will make all the tasks defined in `n-gage` (formerly known as `n-makefile`) available.

With thanks to Matt Brennan for the idea

