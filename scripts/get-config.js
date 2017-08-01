const opts = require('yargs').argv;
const fetch = require('@financial-times/n-fetch');
const fs = require('fs');
const path = require('path');

const getVaultPaths = (ftApp, env) => {
	const app = ftApp.replace(/^ft-/, '');
	return [
		`secret/teams/next/${app}/${env}`,
		`secret/teams/next/${app}/shared`,
		`secret/teams/next/shared/${env}`
	];
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

if (!opts.app || !opts.env) {
	console.error('\nusage:\n\nget-config --app next-app --env (development|production|continuous-integration) --format (simple|json) --filename .env\n');
	process.exit(14);
}

fetch('https://vault.in.ft.com/v1/auth/approle/login', {
    method: 'POST',
    body: JSON.stringify({ role_id: process.env.VAULT_ROLE_ID, secret_id: process.env.VAULT_SECRET_ID })
})
	.then(json => json.auth.client_token)
	.then(token => {
		return Promise.all(getVaultPaths(opts.app, opts.env).map(path => {
			return fetch('https://vault.in.ft.com/v1/' + path, { headers: { 'X-Vault-Token': token } })
				.then(json => json.data || {})
    }))
			.then(([app, appShared, envShared]) => {        
				const shared = appShared.env.reduce((keys, key) => {
					if (key in envShared) {
						keys[key] = envShared[key];
					}
					return keys;
				}, {});
        const keys = Object.assign({}, shared, app);
				const content = format(keys, opts.format);
				const file = path.join(process.cwd(), opts.filename || '.env');
				fs.writeFileSync(file, content);
				console.log(`Written to .env. File: ${file}`);
    });
	})
		.catch(error => {
			console.error(error);
			process.exit(14);
		});
