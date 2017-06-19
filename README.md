# n-gage

<img src="https://media.giphy.com/media/LTPvh458Wx0BO/giphy.gif" align="right" />

Make it so next - an experiment to provide next with a self-updating makefile (with thanks to Matt Brennan for the idea).

## Migration guide

https://github.com/Financial-Times/n-gage/wiki/Migrating-from-n.Makefile-to-n-gage

## Usage

First, delete `n.Makefile`; n-gage includes all the same stuff. Then

`npm install --save-dev --no-package-lock @financial-times/n-gage`

Then in your `Makefile` include the following lines before anything else

```make
node_modules/@financial-times/n-gage/index.mk:
	npm install --no-save @financial-times/n-gage
	touch $@

-include node_modules/@financial-times/n-gage/index.mk
```

And here's the annotated code to explain how it works (follow the numbered comments)

```make
# [2] This task tells make how to 'build' n-gage. It npm installs n-gage, and
#     Once that's done it overwrites the file with its own contents - this
#     ensures the timestamp on the file is recent, so make won't think the file
#     is out of date and try to rebuild it every time
node_modules/@financial-times/n-gage/index.mk:
	npm install --no-save @financial-times/n-gage
	touch $@

# [1] If, by the end of parsing your `Makefile`, `make` finds that any files
#     referenced with `-include` don't exist or are out of date, it will run any
#     tasks it finds that match the missing file. So if n-gage *is* installed
#     it will just be included; if not, it will look for a task to run
-include node_modules/@financial-times/n-gage/index.mk
```

This will make all the tasks defined in `n-gage` (formerly known as `n-makefile`) available. 

## Differences from n-makefile

- `_deploy_apex` task removed, i.e. does not include any lambda tooling. If you need to use the old tool simply copy from your old n.Makefile
- `n-gage` includes [`secret-squirrel`](https://github.com/Financial-Times/secret-squirrel/blob/master/README.md#secret-squirrel). Note: You will need to replace the `pre-git` config in package.json, or you'll get errors. See the secret-squirrel README for details. 
