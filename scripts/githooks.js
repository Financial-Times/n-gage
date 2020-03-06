const jsonfile = require('jsonfile')
const packageJsonFilepath = `${process.cwd()}/package.json`;

const getPackageJson = () => {
	const packageJson = jsonfile.readFileSync(packageJsonFilepath);
	return packageJson;
}

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
	if (!newJson.scripts) {
		newJson.scripts = {};
	}

	if (!newJson.scripts[name]) {
		newJson.scripts[name] = value;
	}
	else if (newJson.scripts[name].indexOf(value) === -1) {
		newJson.scripts[name] = `${newJson.scripts[name]} && ${value}`;
	}
	return newJson;
}

const addScripts = () => {
	const json = getPackageJson();
	const newJson = [
		{ name: 'precommit', value: 'secret-squirrel' },
		{ name: 'commitmsg', value: 'secret-squirrel-commitmsg' },
		{ name: 'prepush', value: 'make verify -j3' }
	].reduce((returnObject, row) => addScript(returnObject, row), json);
	return newJson;
}

const removePreGitHooks = () => {
	const json = getPackageJson();
	delete json.config['pre-git'];
	delete json.commit;
	delete json.devDependencies['pre-git'];
	return json;
};

const find = test => {
	try {
		return test();
	} catch (err) {
		return false;
	};
};

const huskyConfigNeedsUpgrade = () => {
	const { scripts } = getPackageJson();
	return Boolean(scripts && (scripts.precommit || scripts.commitmsg || scripts.commitmsg));
};

const secretSquirrelPreCommitScriptExists = () => {
	const json = getPackageJson();
	return find(() => json.scripts.precommit.indexOf('secret-squirrel') !== -1);
};

const secretSquirrelCommitmsgScriptExists = () => {
	const json = getPackageJson();
	return find(() => json.scripts.commitmsg.indexOf('secret-squirrel-commitmsg') !== -1);
};

const preGitHookExists = () => {
	const json = getPackageJson();
	return find(() => !!json.config['pre-git'] || json.devDependencies['pre-git']);
};

const run = () => {
	var response = '';

	// Only run locally (not in CI)
	if (process.env.CIRCLECI) {
		return response;
	}

	if (huskyConfigNeedsUpgrade()) {
		require(`${process.cwd()}/node_modules/.bin/husky-upgrade`);
		response += 'It upgraded the Husky config format - see https://github.com/Financial-Times/n-gage/issues/220. ';
	}
	if (!secretSquirrelPreCommitScriptExists() || !secretSquirrelCommitmsgScriptExists()) {
		writePackageJsonFile(addScripts);
		response += 'It added some githook scripts. ';
	};
	if (preGitHookExists()) {
		writePackageJsonFile(removePreGitHooks);
		response += 'It deleted some config > pre-git hooks. IMPORTANT: Delete the old local hooks with: "rm -rf .git/hooks/*" ';
	};
	if (response !== '') {
		response = `✗ Note: n-gage just edited package.json. ${response} Please review and commit`;
	}
	return response;
}

const response = run();
console.log(response);
