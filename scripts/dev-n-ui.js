#! /usr/bin/env node

const fs = require('fs');
const bowerJsonExists = fs.existsSync(`${process.cwd()}/bower.json`);
if (
	!process.env.NODE_ENV && /* Not production */
	!process.env.CIRCLE_BRANCH && /* Not CircleCI */
	process.env.NEXT_APP_SHELL !== 'local' && /* NEXT_APP_SHELL not already set to `local` */
	bowerJsonExists /* App has a bower.json */
) {
	const bowerJson = require(`${process.cwd()}/bower.json`);
	if (bowerJson.dependencies && bowerJson.dependencies['n-ui']) {
		console.log('\x1b[36m', "Developers: If you want your app to point to n-ui locally, then `export NEXT_APP_SHELL=local`", '\x1b[0m')
	}
}
