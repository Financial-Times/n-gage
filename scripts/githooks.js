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
	if (!newJson.husky) {
		newJson.husky = {};
	}
	if (!newJson.husky.hooks) {
		newJson.husky.hooks = {};
	}

	if (!newJson.husky.hooks[name]) {
		newJson.husky.hooks[name] = value;
	}
	else if (newJson.husky.hooks[name].indexOf(value) === -1) {
		newJson.husky.hooks[name] = `${newJson.husky.hooks[name]} && ${value}`;
	}
	return newJson;
}

const addScripts = () => {
	const json = getPackageJson();
	const newJson = [
		{ name: 'pre-commit', value: 'secret-squirrel' },
		{ name: 'commit-msg', value: 'secret-squirrel-commitmsg' },
		{ name: 'pre-push', value: 'make verify -j3' }
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
	return Boolean(scripts && (scripts.precommit || scripts.commitmsg || scripts.prepush));
};

const secretSquirrelPreCommitScriptExists = () => {
	const json = getPackageJson();
	try {
		return find(() => json.husky.hooks['pre-commit'].indexOf('secret-squirrel') !== -1);
	} catch (e) {
		return false;
	}
};

const secretSquirrelCommitmsgScriptExists = () => {
	const json = getPackageJson();
	try {
		return find(() => json.husky.hooks['commit-msg'].indexOf('secret-squirrel-commitmsg') !== -1);
	} catch (e) {
		return false;
	}
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
