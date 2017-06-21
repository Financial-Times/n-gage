const packageJson = require(`${process.cwd()}/package.json`);

const squirrelError = () => {
	throw new Error(`✗ Secret Squirrel must be configured to run on every commit.
  Please copy this to your package.json file:

	"scripts": {
		"precommit": "node_modules/.bin/secret-squirrel"
	}

Thank you. Further reading: https://github.com/Financial-Times/secret-squirrel/
`);
}

try {
	const preCommit = packageJson.config['scripts']['precommit'];
	if (preCommit.indexOf('node_modules/.bin/secret-squirrel') === -1) {
		squirrelError();
	}
} catch (e) {
	squirrelError();
}
