const fetch = require('@financial-times/n-fetch');
const fs = require('fs');
const path = require('path');
const os = require('os');
const appendSessionTokens = require('../append-session-tokens');


exports.command = 'get-config';
exports.describe = 'get environment variables from Vault';

exports.builder = yargs => (yargs
	.option('app', (() => {
		// try get app name from the package.json
		try {
			return {
				default: JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'))).name.replace(/@financial-times\//, '').replace('^ft-', '')
			}
		} catch (error) {
			// otherwise, ask for it to be specified
			return {
				demandOption: true,
				type: 'string'
			}
		}
	})())
	.option('env', {
		choices: ['dev', 'prod', 'ci', 'test']
  	})
	.option('custom-env')
	.option('filename', {
		coerce: value => typeof value === 'string' ? value : '.env',
		default: '.env'
  })
	.option('format', {

		choices: ['simple', 'json'],
		default: 'simple'
  })
	.option('team', {
		coerce: value => typeof value === 'string' ? value : 'next',
		default: 'next'
	})
		.conflicts('env', 'custom-env')
);

const getToken = () => {
	if (process.env.CIRCLECI) {
		// on CircleCI
		return fetch('https://vault.in.ft.com/v1/auth/approle/login', {
			method: 'POST',
			body: JSON.stringify({ role_id: process.env.VAULT_ROLE_ID, secret_id: process.env.VAULT_SECRET_ID })
		})
		.then(json => json.auth.client_token)
	} else {
		// developer's local machine
		return new Promise((resolve, reject) => {
			return fs.readFile(path.join(os.homedir(), '.vault-token'), { encoding: 'utf8' }, (error, data) => {
				if (error) {
					reject(error);
				} else {
					resolve(data);
				}
			});
		});
	}
};

const getVaultPaths = (ftApp, env, team) => {
	const app = ftApp.replace(/^ft-/, '');
	const vaultEnvs = { dev: 'development', prod: 'production', ci: 'continuous-integration', test: 'test' };
	const vaultEnv = vaultEnvs[env] || env;
	return [
		`secret/data/teams/${team}/${app}/${vaultEnv}`,
		`secret/data/teams/${team}/${app}/shared`,
		`secret/data/teams/${team}/shared/${vaultEnv}`
	]
};

const parseKeys = (env, app, appShared, envShared) => {

	if (env === 'ci') {
		return Object.assign({}, app.env, envShared);
	} else {
		const shared = appShared.env.reduce((keys, key) => {
			if (envShared && key in envShared) {
				keys[key] = envShared[key];
			}
			return keys;
		}, {});
		return Object.assign({}, shared, app);
	}
};

const format = (keys, mode) => {
	if (mode === 'simple') {
		return Object.keys(keys).sort().reduce((file, key) => file + `${key}=${keys[key]}\n`, '');
	} else if (mode === 'json') {
		return JSON.stringify(keys, null, '  ');
	} else {
		throw new Error('n-gage does not recognise the requested config format');
	}
};

// LET'S GO!

exports.handler = argv => {
	getToken()
		.then(token => {
			const env = argv.customEnv || argv.env || 'dev';
			return Promise.all(getVaultPaths(argv.app, env, argv.team).map(path => {
				const url = 'https://vault.in.ft.com/v1/' + path;
				console.log(url);

				const vaultFetch = fetch(url, { headers: { 'X-Vault-Token': token } })
					.then(json => json.data.data || {});

				if (argv.customEnv || env === 'dev') {
					return vaultFetch.catch(err => {
						console.warn(`Couldn't get config at ${url}.`);
					});
				} else {
					return vaultFetch;
				}
			}))
				.then(([app, appShared, envShared]) => parseKeys(env, app, appShared, envShared))
				.then((keys) => appendSessionTokens(keys))
				.then((keys) => {
					const content = format(keys, argv.format);
					const file = path.join(process.cwd(), argv.filename || '.env');
					fs.writeFileSync(file, content);
					console.log(`Written ${argv.app}'s ${env} config to ${file}`);
			});
		})
		.catch(error => {
			console.error(error);
			process.exit(14);
		});
};
