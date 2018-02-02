'use strict';

const config = {
	'env': {
		'browser': true,
		'es6': true,
		'mocha': true,
		'node': true
	},
	'parserOptions': {
		'ecmaVersion': 2017,
		'sourceType': 'module'
	},
	'rules': {
		'eqeqeq': 2,
		'guard-for-in': 2,
		'new-cap': 0,
		'no-caller': 2,
		'no-console': 2,
		'no-extend-native': 2,
		'no-irregular-whitespace': 0,
		'no-loop-func': 2,
		'no-multi-spaces': 0,
		'no-undef': 2,
		'no-underscore-dangle': 0,
		'no-unused-vars': 2,
		'no-var': 2,
		'one-var': [2, 'never'],
		'quotes': [2, 'single'],
		'space-before-function-paren': [0, 'never'],
		'wrap-iife': 2
	},
	'globals': {
		'fetch': true,
		'requireText': true
	},
	'plugins': [],
	'extends': []
};

const packageJson = require('./package.json');

const packageJsonContainsPackage = packageName => {
	const { dependencies, devDependencies} = packageJson;
	return (
		(dependencies && dependencies[packageName])
		|| (devDependencies && devDependencies[packageName])
	)
}

if ((packageJsonContainsPackage('react') || packageJsonContainsPackage('preact'))) {
	config.plugins.push('react');
	config.extends.push('plugin:react/recommended');

	Object.assign(config.rules, {
		'react/display-name': 0,
		'react/prop-types': 0,
		'react/no-danger': 0,
		'react/no-render-return-value': 0
	});
}

if (packageJsonContainsPackage('jest')) {
	config.env.jest = true;
}

module.exports = config;
