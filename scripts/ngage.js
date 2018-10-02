#!/usr/bin/env node

if (process.argv.length > 1 && process.argv[2] === 'get-config') {
	require('./get-config')();
} else if (process.argv.length > 1 && process.argv[2] === 'bootstrap') {
	require('./bootstrap')();
} else {
	console.log(`commands:

  ngage get-config   get environment variables from Vault
  ngage bootstrap    called by makefiles to include n-gage
`);
}
