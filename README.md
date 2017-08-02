# n-gage

<img src="https://user-images.githubusercontent.com/3425322/28121799-20b036d0-6714-11e7-9516-4db7cf5df6d0.png" align="right" />

`n-gage` is in every Next project, giving a standard set of `make` tasks and `ngage` CLI to help with setting up, building and deployments.

## Getting started

Starting a new repo?  You can do the following:

```sh
mkdir my-new-project
cd my-new-project
yes '' | npm init # a geeky way to tell `npm init` the answer is a yes to everything
npm install --save-dev --no-package-lock @financial-times/n-gage
```

then create a new `Makefile` file with the following:

```make
# n-gage bootstrapping logic
node_modules/@financial-times/n-gage/index.mk:
	npm install --no-save --no-package-lock @financial-times/n-gage
	touch $@

-include node_modules/@financial-times/n-gage/index.mk
```

See [here](#bootstrapping) for more explanation of the bootstrapping logic.  You will want to add `unit-test`, `test`, `provision`, `smoke` and `deploy` tasks to the `Makefile`. See other, similar Next projects for ideas.

## Make tasks

See in [index.mk](index.mk) for all the different tasks you can use in your `Makefile`.

## CLI

This includes a CLI for you to use to do some things.

### get-config

This tool helps you to obtain configuration for your project.

```sh
$ ngage
ngage get-config --help

$ ngage get-config --help
Options:
  --help      Show help                                                [boolean]
  --app                                            [default: "next-page-purger"]
  --env                          [choices: "dev", "prod", "ci"] [default: "dev"]
  --filename                                                   [default: ".env"]
  --format                       [choices: "simple", "json"] [default: "simple"]

$ ngage get-config --env ci --filename .env-ci --format json
Written next-page-purger's ci config to /Users/ben.fletcher/projects/next-page-purger/.env-ci

$ cat .env-ci
{
  "AWS_ACCESS_KEY_ID": "...",
  "AWS_SECRET_ACCESS_KEY": "...",
	...
}
```

## Bootstrapping

Curious how the bootstrapping bit at top of the `Makefile` works?  Here's the annotated code:

```make
# This task tells make how to 'build' n-gage. It npm installs n-gage, and
# Once that's done it overwrites the file with its own contents - this
# ensures the timestamp on the file is recent, so make won't think the file
# is out of date and try to rebuild it every time
node_modules/@financial-times/n-gage/index.mk:
	npm install --no-save @financial-times/n-gage
	touch $@

# If, by the end of parsing your `Makefile`, `make` finds that any files
# referenced with `-include` don't exist or are out of date, it will run any
# tasks it finds that match the missing file. So if n-gage *is* installed
# it will just be included; if not, it will look for a task to run
-include node_modules/@financial-times/n-gage/index.mk
```
