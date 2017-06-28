const fetch = require('node-fetch');
const fs = require('fs');
const os = require('os');
const path = require('path');

// three things to do.
// 1. get the vault token
// 2. get the env vars from vault
// 3. make the file

const app = process.argv[2].replace(/^ft-/, '');

const vault = (path, token) => fetch('https://vault.in.ft.com/v1/' + path, { headers: { 'X-Vault-Token': token } })
    .then(res => res.json())
    .then(json => json.data || {});

Promise.all([
    vault(`secret/teams/next/${app}/development`),
    vault(`secret/teams/next/${app}/shared`),
    vault('secret/teams/next/shared/development'),
])
    .then(([app, appShared, envShared]) => {        
        const shared = appShared.env.reduce((keys, key) => {
            if (key in envShared) {
                keys[key] = envShared[key];
            }
            
            return keys;
        }, {});

        const keys = Object.assign({}, shared, app);

        const variables = Object.keys(keys).sort().reduce((file, key) => file + `${key}=${keys[key]}\n`, '');

        fs.writeFileSync(path.join(process.cwd(), '.env'), variables);
    })
