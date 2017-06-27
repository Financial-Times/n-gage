const packageJsonFilepath = `${process.cwd()}/package.json`;
const packageJson = require(packageJsonFilepath);
const jsonfile = require('jsonfile')

const addScript = (json, {name, value}) => {
	const newJson = JSON.parse(JSON.stringify(json));
	if (!newJson.scripts[name]) {
		newJson.scripts[name] = value;
	}
	else if (newJson.scripts[name].indexOf(value) === -1) {
		newJson.scripts[name] = `${newJson.scripts[name]} && ${value}`;
	}
	return newJson;
}

const addScriptToPackageJson = () => {
	const newPackageJson = [
		{ name: 'precommit', value: 'make verify -j3' },
		{ name: 'precommit', value: 'node_modules/.bin/secret-squirrel' },
		{ name: 'prepush', value: 'make unit-test' },
	].reduce((returnObject, row) => addScript(returnObject, row), packageJson);
	try {
		jsonfile.writeFileSync(packageJsonFilepath, newPackageJson, {spaces: 2})
	} catch (err) {
		console.error(err)
	}
}

const find = (test => {
	let found = false;
	try {
		found = test();
	} catch (err) {};
	return found;
});

const secretSquirrelPreCommitScriptExists = () => {
	return find(() => packageJson.scripts.precommit.indexOf('node_modules/.bin/secret-squirrel') !== -1);
};

const preGitHookExists = () => {
	return find(() => !!packageJson.config['pre-git']);
};

const run = () => {
	return new Promise(resolve => {
		let response = '';
		if (!secretSquirrelPreCommitScriptExists()) {
			addScriptToPackageJson();
			response += 'It added some githook scripts.';
		};
		// if (preGitHookExists()) {
		// 	removePreGitHookFromPackageJson();
		// 	response += 'It deleted some config > pre-git hooks.';
		// };
		if (response !== '') {
			response = `✗ Note: n-gage just edited package.json. ${response} Please review and commit`;
		}
		return resolve(response);
	});
}

run().then(response => {
	console.log(response)
});
