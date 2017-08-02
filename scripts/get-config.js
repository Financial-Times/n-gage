#!/usr/bin/env node

const opts = require('yargs').argv;
const fetch = require('@financial-times/n-fetch');
const fs = require('fs');
const path = require('path');
const os = require('os');

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
	const vaultEnvs = { dev: 'development', prod: 'production', ci: 'continuous-integration' };
	const vaultEnv = vaultEnvs[env];
	return [
		`secret/teams/next/${app}/${vaultEnv}`,
		`secret/teams/next/${app}/shared`,
		`secret/teams/next/shared/${vaultEnv}`
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

if (!opts.app || !opts.env) {
	console.error('\nusage:\n\nget-config [options]\n\n--app next-app-name [required]\n--env (dev|prod|ci) [required]\n--format (simple|json) [optional - defaults to simple]\n--filename .env [optional - defaults to .env]\n');
	process.exit(14);
}

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
