exports.command = 'bootstrap';
exports.describe = 'called by makefiles to include n-gage';
exports.handler = () => {
	console.log(require.resolve('../../index.mk'));
};
