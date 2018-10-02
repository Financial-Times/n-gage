# n-gage

<a href="https://docs.google.com/forms/d/e/1FAIpQLSf5InA7UJK9yNBCzidFKI_WNkfbl6of1eRlIACRspGXUcBx8A/viewform?usp=pp_url&entry.78759464=n-gage" target="_blank"><img src="https://i.imgur.com/UmScdZ4.png" alt="Yak button" border="0" align="right" width="150" title="Report a yak shaving incident for this repository"></a>

`n-gage` is in every Next project, giving a standard set of `make` tasks and `ngage` CLI to help with setting up, building and deployments.

<br clear="right">

## Getting started

Starting a new repo?  You can do the following:

```sh
mkdir my-new-project
cd my-new-project
npm init -y
npm install --save-dev --no-package-lock @financial-times/n-gage
```

then create a new `Makefile` file with the following:

```make
# n-gage bootstrapping logic
include $(shell npx -p @financial-times/n-gage ngage bootstrap)
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
commands:

  ngage bootstrap    called by makefiles to include n-gage
  ngage get-config   get environment variables from Vault


$ ngage get-config --help
Options:
  --help      Show help                                                [boolean]
  --app                                            [default: "next-page-purger"]
  --env                  [choices: "dev", "prod", "ci", "test"] [default: "dev"]
  --filename                                                   [default: ".env"]
  --format                       [choices: "simple", "json"] [default: "simple"]
  --team                                                       [default: "next"]

$ ngage get-config --env ci --filename .env-ci --format json
Written next-page-purger's ci config to /Users/ben.fletcher/projects/next-page-purger/.env-ci

$ cat .env-ci
{
  "AWS_ACCESS_KEY_ID": "...",
  "AWS_SECRET_ACCESS_KEY": "...",
	...
}
```

```sh
$ ngage get-config --team myteam
```

The `--team` option lets you specify a team if not `next` (must match Vault path).

### FT User Sessions

To get `FTSession` and `FTSession_s` environment variables to be populated with up-to-date session tokens from test users, add the following environment variables to your `development` and/or `continuous-integration` configs in the Vault:

| | |
|---|---|
| `TEST_SESSIONS_URL` | url to [`next-test-sessions-lambda`](http://github.com/financial-times/next-test-sessions-lambda) |
| `TEST_SESSIONS_API_KEY` | api_key for the lambda |
| `TEST_USER_TYPES` | user types to get the tokens for (options: `premium`, `standard`, `expired`) |

As a result of this, `{USER_TYPE}_FTSession` and `{USER_TYPE}_FTSession_s` environment variables will be populated in the `.env` file.

Multiple user types can be specified in the TEST_USER_TYPES variable.

*Example*

If you set `TEST_USER_TYPES` environment variable to `premium,standard`, these variables will be populated in the `.env` file:
`PREMIUM_FTSession`, `PREMIUM_FTSession_s`, `STANDARD_FTSession`, `STANDARD_FTSession_s`

## Bootstrapping

Curious how the bootstrapping bit at top of the `Makefile` works? `npx` runs the command `ngage bootstrap`, installing `@financial-times/n-gage` if it's not in `node_modules`. The bootstrap command outputs the full path to `index.mk`, which is passed to Make's `include`.
