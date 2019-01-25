<h1>
	<img src="etc/header.svg" width="898" alt="n-gage">
</h1>

<a href="https://docs.google.com/forms/d/e/1FAIpQLSf5InA7UJK9yNBCzidFKI_WNkfbl6of1eRlIACRspGXUcBx8A/viewform?usp=pp_url&entry.78759464=n-gage" target="_blank">
	<img src="https://i.imgur.com/UmScdZ4.png" alt="Yak button" border="0" align="right" width="150" title="Report a yak shaving incident for this repository">
</a>

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

| Variable | Description |
|---|---|
| `TEST_SESSIONS_URL` | url to [`next-test-sessions-lambda`](http://github.com/financial-times/next-test-sessions-lambda) |
| `TEST_SESSIONS_API_KEY` | api_key for the lambda |
| `TEST_USER_TYPES` | user types to get the tokens for (options: `premium`, `standard`, `expired`) |

As a result of this, `{USER_TYPE}_FTSession` and `{USER_TYPE}_FTSession_s` environment variables will be populated in the `.env` file.

Multiple user types can be specified in the TEST_USER_TYPES variable.

*Example*

If you set `TEST_USER_TYPES` environment variable to `premium,standard`, these variables will be populated in the `.env` file:
`PREMIUM_FTSession`, `PREMIUM_FTSession_s`, `STANDARD_FTSession`, `STANDARD_FTSession_s`

### Pa11y environment variables

| Variable | Description |
|---|---|
| `PA11Y_WAIT` | The time to wait before running tests in milliseconds |
| `PA11Y_ROUTE_EXCEPTIONS` | api_key for the lambda |
| `PA11Y_ROUTE_HEADERS` | user types to get the tokens for (options: `premium`, `standard`, `expired`) |
| `PA11Y_HIDE` | A CSS selector to hide elements from testing, selectors can be comma separated |
| `PA11Y_VIEWPORTS` | Set viewports for puppeteer (`w1024h768,w375h667`) |

### Deployment variables

These variables should be declared in the `Makefile` to set up deployment tasks using Heroku pipelines.

| Variable | Description |
|---|---|
| `VAULT_NAME` | [Required] The name of the app in vault. Should also be the name in `package.json` eg, `ft-next-search-page` |
| `HEROKU_APP_STAGING` | [Required] The name of the Heroku staging app eg, `ft-next-search-page-staging` |
| `HEROKU_APP_EU` | [Required] The main Heroku app or the EU Heroku app if it is a multi-region app eg, `ft-next-search-page-eu` for multi region or `ft-next-video-page` for single region |
| `HEROKU_APP_US` | [Optional] The US Heroku app. Only needed if it is a multi region app |
| `HEROKU_APP_CANARY` | [Optional] The canary Heroku app. Only needed if there is a canary app eg, `ft-next-preflight-canary` |
| `HEROKU_APP_CANARY_SCALE` | [Optional] Canary apps only. Specify the number of web dynos for the canary app. If not specified, it will use the `HEROKU_APP_EU` scale configuration |
| `REVIEW_APP_CONFIGURE_OVERRIDES` | [Optional] Override environment variables for the review apps. By default it is `NODE_ENV=branch`, so to add new ones add `REVIEW_APP_CONFIGURE_OVERRIDES="NODE_ENV=branch,OTHER_VAR=something"` |

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

<img src="etc/footer.svg" width="898" alt="make it so">
