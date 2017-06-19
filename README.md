# n-gage

<img src="https://media.giphy.com/media/LTPvh458Wx0BO/giphy.gif" align="right" />

Make it so next - an experiment to provide next with a self-updating makefile (with thanks to Matt Brennan for the idea).

## Migrating from n.Makefile to n-gage

⚠️ **Don't blindly copy-paste these commands.** It won't work like that because each repository is a unique smowflake.

 - [ ] get your repository in a nice clean state

```shell
cd /path/to/your/project/directory/
git checkout master
git pull
git checkout -b n-gage
```

 - [ ] make sure `*.env*` is in .gitignore

```shell
cat .gitignore
```

 - [ ] delete `n.Makefile`; install `n-gage` 

```shell
git rm n.Makefile
npm install --save-dev --no-package-lock @financial-times/n-gage
```

 - [ ] update `Makefile` (copy this to the top, overriding the `import n.Makefile` line)

```make
node_modules/@financial-times/n-gage/index.mk:
	npm install --no-save @financial-times/n-gage
	touch $@

-include node_modules/@financial-times/n-gage/index.mk
```

 - [ ] update package.json

```json
  "config": {
    "pre-git": {
      "pre-commit": [
        "node_modules/.bin/secret-squirrel"
      ]
    }
  },
```

 - [ ] do all the things

```shell
git add .
make clean 
make install
make .env
make build 
make test
```

 - [ ] fix any linting errors 

**Warning:** This command will edit your files to fix linting errors

```shell
eslint "**/*.js" --fix
```

 - [ ] commit

```shell
git add . 
git commit -am "Updated from n.Makefile to n-gage. Also: I ❤ @adambraimbridge"
```

 - [ ] resolve any squirrel issues

```shell
touch secrets.js
git add secrets.js
```

Here's a `secrets.js` template:

```javascript
module.exports = {
	whitelist: [
		''
	]
};
```

 - [ ] add and commit if required

```shell
git add secrets.js
git commit -m "Added secret-squirrel whitelist of test/dummy values"

```

 - [ ] push to github

```
git push
```

## Differences from n-makefile

- `_deploy_apex` task removed, i.e. does not include any lambda tooling. If you need to use the old tool simply copy from your old n.Makefile
- `n-gage` includes [`secret-squirrel`](https://github.com/Financial-Times/secret-squirrel/blob/master/README.md#secret-squirrel).
