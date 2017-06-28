const packageJsonFilepath = `${process.cwd()}/package.json`;
const packageJson = require(packageJsonFilepath);
const jsonfile = require('jsonfile')

const writePackageJsonFile = json => {
	try {
		jsonfile.writeFileSync(packageJsonFilepath, json(), {spaces: 2})
	} catch (err) {
		console.error(err)
	}
};

const addScript = (json, config) => {
	const name = config.name;
	const value = config.value;
	const newJson = JSON.parse(JSON.stringify(json));
	if (!newJson.scripts[name]) {
		newJson.scripts[name] = value;
	}
	else if (newJson.scripts[name].indexOf(value) === -1) {
		newJson.scripts[name] = `${newJson.scripts[name]} && ${value}`;
	}
	return newJson;
}

const addScripts = () => {
	const newPackageJson = [
		{ name: 'precommit', value: 'node_modules/.bin/secret-squirrel' },
		{ name: 'prepush', value: 'make verify -j3' }
	].reduce((returnObject, row) => addScript(returnObject, row), packageJson);
	return newPackageJson;
}

const removePreGitHooks = () => {
	// Delete the packageJson.config['pre-git'] property here
	// return newPackageJson;
};

const find = test => {
	try {
		return test();
	} catch (err) {
		return false;
	};
};

const secretSquirrelPreCommitScriptExists = () => {
	return find(() => packageJson.scripts.precommit.indexOf('node_modules/.bin/secret-squirrel') !== -1);
};

const preGitHookExists = () => {
	return find(() => !!packageJson.config['pre-git']);
};

const run = () => {
	return new Promise(resolve => {
		var response = '';
		if (!secretSquirrelPreCommitScriptExists()) {
			writePackageJsonFile(addScripts);
			response += 'It added some githook scripts. ';
		};
		// if (preGitHookExists()) {
		// 	writePackageJsonFile(removePreGitHooks);
		// 	response += 'It deleted some config > pre-git hooks. ';
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
