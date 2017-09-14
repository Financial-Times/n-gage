const fetch = require('@financial-times/n-fetch');
const fs = require('fs');
const path = require('path');
const os = require('os');

const opts = require('yargs')
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
		choices: ['dev', 'prod', 'ci'],
		default: 'dev'
  })
  .option('filename', {
		default: '.env'
  })
  .option('format', {
		choices: ['simple', 'json'],
		default: 'simple'
  })
  .help()
  .argv;

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

const getVaultPaths = (ftApp, env) => {
	const app = ftApp.replace(/^ft-/, '');
	const team = process.env.VAULT_TEAM || 'next';
	const vaultEnvs = { dev: 'development', prod: 'production', ci: 'continuous-integration' };
	const vaultEnv = vaultEnvs[env];
	return [
		`secret/teams/${VAULT_TEAM}/${app}/${vaultEnv}`,
		`secret/teams/${VAULT_TEAM}/${app}/shared`,
		`secret/teams/${VAULT_TEAM}/shared/${vaultEnv}`
	];
};

const parseKeys = (app, appShared, envShared) => {
	if (opts.env === 'ci') {
		return Object.assign({}, app.env, envShared);
	} else {
		const shared = appShared.env.reduce((keys, key) => {
			if (key in envShared) {
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

module.exports = () => {
	getToken()
		.then(token => {
			return Promise.all(getVaultPaths(opts.app, opts.env).map(path => {
				return fetch('https://vault.in.ft.com/v1/' + path, { headers: { 'X-Vault-Token': token } })
					.then(json => json.data || {})
			}))
				.then(([app, appShared, envShared]) => {
					const keys = parseKeys(app, appShared, envShared)
					const content = format(keys, opts.format);
					const file = path.join(process.cwd(), opts.filename || '.env');
					fs.writeFileSync(file, content);
					console.log(`Written ${opts.app}'s ${opts.env} config to ${file}`);
			});
		})
			.catch(error => {
				console.error(error);
				process.exit(14);
			});
};
