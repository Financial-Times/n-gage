const packageJson = require(`${process.cwd()}/package.json`);
try {
	const preCommit = packageJson.scripts.precommit;
	if (preCommit.indexOf('node_modules/.bin/secret-squirrel') !== -1) {
		console.log('squirrel ok');
	}
} catch (e) {
	// Nothing is output.
}
