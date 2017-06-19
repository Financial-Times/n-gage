const packageJson = require(`${process.cwd()}/package.json`);

const squirrelError = () => {
	throw new Error(`secret-squirrel has not been configured to run on every commit
Add the following to your package.json

"config": {
  "pre-git": {
    "pre-commit": [
      "node_modules/.bin/secret-squirrel"
    ]
  }
}
`);
}

try {
	const preCommit = packageJson.config['pre-git']['pre-commit'];
	if (preCommit.indexOf('node_modules/.bin/secret-squirrel') === -1) {
		squirrelError();
	}
} catch (e) {
	squirrelError();
}