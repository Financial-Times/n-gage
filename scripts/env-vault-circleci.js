const fetch = require('@financial-times/n-fetch');
const fs = require('fs');
const path = require('path');

const app = process.argv[3].replace(/^ft-/, '');

const vaultPaths = [
	`secret/teams/next/${app}/production`,
	`secret/teams/next/${app}/shared`,
	'secret/teams/next/shared/production'
];

const format = (keys, mode) => {
	if (mode === 'dotenv') {
		return Object.keys(keys).sort().reduce((file, key) => file + `${key}=${keys[key]}\n`, '');
	} else if (mode === 'apex') {
		return JSON.stringify(keys, null, '  ');
	} else {
		throw new Error('n-gage does not recognise the requested mode');
	}
};

fetch('https://vault.in.ft.com/v1/auth/approle/login', {
    method: 'POST',
    body: JSON.stringify({ role_id: process.env.VAULT_ROLE_ID, secret_id: process.env.VAULT_SECRET_ID })
})
	.then(json => json.auth.client_token)
	.then(token => {
		Promise.all(vaultPaths.map(path => {
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
				const content = format(keys, process.argv[2]);
				fs.writeFileSync(path.join(process.cwd(), '.env'), content);
    });
	});
