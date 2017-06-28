const fetch = require('node-fetch');
const fs = require('fs');
const os = require('os');
const path = require('path');

// three things to do.
// 1. get the vault token
// 2. get the env vars from vault
// 3. make the file

const app = process.argv[2].replace(/^ft-/, '');

const vault = (path, token) => fetch('https://vault.in.ft.com/v1/auth/approle/login', {
    method: 'POST',
    body: JSON.stringify({ role_id: process.env.VAULT_ROLE_ID, secret_id: process.env.VAULT_SECRET_ID })
})
    .then(res => res.json())
    .then(json => json.data.client_token)
    .then(token => {
        // Step 2, though some error handling in the above.
        return fetch('https://vault.in.ft.com/v1/' + path, { headers: { 'X-Vault-Token': token } })
            .then(res => res.json())
            .then(json => json.data || {})

        // Could be more efficient as it will make a token each request, bu
        // yup! I think you've done your bit... I can finish this off
        // just one thing I wonder about is that they want the file in JSON format... Apex format
        // and I know some other deployments want it in the dotenv format
        // so, I'll look for process.argv[0] and return appropriately
        // can you check this in to a branch... we head home and I finish it later?
        GREAT WORK TODAY!!!!
    });

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
