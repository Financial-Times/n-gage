const {version} = require('../../package.json');
const mkdirp = require('mkdirp');
const copyDir = require('copy-dir');
const fs = require('fs');
const os = require('os');
const path = require('path');

exports.command = 'bootstrap';
exports.describe = 'called by makefiles to include n-gage';
exports.handler = () => {
	let indexPath = require.resolve('../../index.mk');
	const packagePath = path.dirname(indexPath);
	const npxPath = path.join(os.homedir(), '.npm/_npx');

	// if we've just been installed by npx our folder isn't sticking around, so copy us somewhere safe and use that path
	if(indexPath.startsWith(npxPath)) {
		const safePath = path.join(os.homedir(), '.ngage', version);
		indexPath = path.join(safePath, 'index.mk');

		// don't copy if there's already one there from another app or something
		if(!fs.existsSync(indexPath)) {
			mkdirp.sync(safePath);
			copydir.sync(packagePath, safePath);
		}
	}

	// output the path to index.mk so make can require it
	console.log(indexPath);
};
