const fs = require('fs');

exports.command = 'update-bootstrap <makefile>';
exports.describe = 'migrate a makefile from bootstrap v1 to v2';

const oldBootstrap = `node_modules/@financial-times/n-gage/index.mk:
	npm install --no-save --no-package-lock @financial-times/n-gage
	touch $@

-include node_modules/@financial-times/n-gage/index.mk`;

const newBootstrap = 'include $(shell npx -p @financial-times/n-gage ngage bootstrap)';

const twee = 'have a nice day! xoxoxox';

exports.handler = argv => {
	let content;

	try {
		content = fs.readFileSync(argv.makefile, 'utf8');
	} catch(e) {
		// probably the file doesn't exist. this shouldn't happen unless someone runs `ngage update-bootstrap nonexistent/Makefile`
		console.log(`yeah we couldn't read from ${argv.makefile}, make sure that's a real thing`);
		throw e;
	}

	const replaced = content.replace(oldBootstrap, newBootstrap);

	if(replaced === content) {
		console.log(
`looks like your makefile isn't using the standard n-gage v1 bootstrap, or it's already been migrated to v2. have a look at ${argv.makefile}, and if there's something that looks like:

${oldBootstrap}

please replace it with:

${newBootstrap}

${twee}`);

		return;
	}

	try {
		fs.writeFileSync(argv.makefile, replaced, 'utf8');
	} catch(e) {
		console.log(`yeah we couldn't write to ${argv.makefile}, dunno what's up with that, sorry,`);
		throw e;
	}

	console.log(
`bootstrap updated to v2! check that ${argv.makefile} looks good and commit it plz

${twee}`);
};
