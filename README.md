# n-gage [![CircleCI](https://circleci.com/gh/Financial-Times/n-gage.svg?style=svg&circle-token=33bcf2eb98fe2e875cc66de93d7e4a50369c952d)](https://github.com/Financial-Times/n-gage)

`n-gage` is in every FT.com project, giving a standard set of `make` tasks and `ngage` CLI to help with setting up, building and deployments.


## Requirements

* Node 8.x


## Installation

```sh
git clone git@github.com:Financial-Times/n-gage.git
cd n-gage
make install
```

## Development

### Testing

In order to run the tests locally you'll need to run:

```sh
make test
```

### Install from NPM

```sh
npm install --save @financial-times/n-gage
```

### Usage

Create a new `Makefile` file with the following:

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

### Make tasks

| Task | Description |
|-|-|
| a11y                | Run automated accessibility tests |
| build               | Build this repository |
| build-production    | Build this repository for production |
| clean               | Clean this git repository |
| deploy-assets       | Uploads static files such as CSS and JS to S3 |
| deploy-production   | Deploy staging to production eu and us apps. Also scale down canary app |
| deploy-canary       | Deploy canary app to staging |
| deploy-staging      | Deploy the app to staging |
| deploy-promote      | Promote the staging app to production |
| deploy              | Deploy the app to heroku |
| .env                | Downloads environment variables from Vault |
| fix-lintspaces      | Autofix common lintspaces issues |
| help                | Show this help message |
| init                | Clean this repository and start from a fresh build |
| install             | Install dependencies and copy common dotfiles |
| test-review-app     | Create and test a review app on heroku. <br /><br />To override custom environment variables when running `nht configure`, add: <br />`REVIEW_APP_CONFIGURE_OVERRIDES="NODE_ENV=branch,OTHER_VAR=something"` <br /> to the Makefile |
| smoke               | Run smoke tests on the local or review app, by setting the TEST_URL environment variable |
| verify              | Check files for linting errors |
| watch               | Watch for static asset changes |

### Git hooks

By default `n-gage` will automatically configure [some git hooks](scripts/githooks.js)
to be run by [Husky](https://www.npmjs.com/package/husky). If you want to disable
this behaviour, add the following line to the very top of your `Makefile`:

```makefile
DISABLE_GITHOOKS=true
```

### CLI

This tool helps you to obtain configuration for your project.

```sh
$ ngage get-config

get environment variables from Vault

Options:
  --version     Show version number                            [boolean]
  --help        Show help                                      [boolean]
  --app                                     [default: "ft-next-article"]
  --env                           [choices: "dev", "prod", "ci", "test"]
  --custom-env
  --filename                                           [default: ".env"]
  --format               [choices: "simple", "json"] [default: "simple"]
  --team                                               [default: "next"]
```

For example, to fetch the `ci` environment variables:

```sh
$ ngage get-config --env ci --filename .env-ci --format json
# {
#   "AWS_ACCESS_KEY_ID": "...",
#   "AWS_SECRET_ACCESS_KEY": "...",
# 	...
# }
```

There is an additional `--team` flag that lets you specify a team if not `next` (must match Vault path).

```sh
$ ngage get-config --team myteam
```

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
