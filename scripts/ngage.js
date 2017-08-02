#!/usr/bin/env node

if (process.argv.length > 1 && process.argv[2] === 'get-config') {
	require('./get-config')();
} else {
	console.log('ngage get-config --help');
}