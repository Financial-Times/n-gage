module.exports = {
	files: {
		allow: [
			'dotfiles/.stylelintrc'
		],
		allowOverrides: []
	},
	strings: {
		deny: [],
		denyOverrides: [
			'20b036d0-6714-11e7-9516-4db7cf5df6d0' // README.md:3
		]
	}
};
