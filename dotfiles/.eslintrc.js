const fs = require('fs');
const config = {
	'env': {
		'browser': true,
		'es6': true,
		'mocha': true,
		'node': true
	},
	'parserOptions': {
		'ecmaVersion': 2018,
		'sourceType': 'module'
	},
	'rules': {
		'eqeqeq': 'error',
		'guard-for-in': 'error',
		'indent': ['error', 'tab'],
		'new-cap': 'off',
		'no-caller': 'error',
		'no-console': 'error',
		'no-extend-native': 'error',
		'no-irregular-whitespace': 'error',
		'no-loop-func': 'error',
		'no-multi-spaces': 'error',
		'no-trailing-spaces': 'error',
		'no-undef': 'error',
		'no-underscore-dangle': 'off',
		'no-unused-vars': 'error',
		'no-var': 'error',
		'one-var': ['error', 'never'],
		'quotes': ['error', 'single'],
		'semi': ['warn', 'always'],
		'space-before-function-paren': ['error', 'always'],
		'wrap-iife': 'error'
	},
	'globals': {
		'cy': true,
		'cypress': true,
		'Cypress': true,
		'fetch': true,
		'requireText': true
	},
	'plugins': [
		'no-only-tests'
	],
	'extends': [],
	'overrides': [
		{
			'files': [ 'test/**/*.js', 'tests/**/*.js' ],
			'rules': {
				'no-only-tests/no-only-tests': 'error'
			}
		}
	],
	'settings' : {}
};

const packageJson = require('./package.json');

const packageJsonContainsPackage = packageName => {
	const { dependencies, devDependencies, peerDependencies } = packageJson;
	return (
		(dependencies && dependencies[packageName])
		|| (devDependencies && devDependencies[packageName])
		|| (peerDependencies && peerDependencies[packageName])
	)
}

if ((packageJsonContainsPackage('react') || packageJsonContainsPackage('preact'))) {
	config.plugins.push('react');
	config.extends.push('plugin:react/recommended');

	Object.assign(config.rules, {
		'react/display-name': 'off',
		'react/prop-types': 'off',
		'react/no-danger': 'off',
		'react/no-render-return-value': 'off'
	});
}

if (packageJsonContainsPackage('jest')) {
	config.env.jest = true;
}

if (packageJson && packageJson.eslintConfig) {
	Object.assign(config.env, packageJson.eslintConfig.env);
	Object.assign(config.parserOptions, packageJson.eslintConfig.parserOptions);
	Object.assign(config.rules, packageJson.eslintConfig.rules);
	Object.assign(config.globals, packageJson.eslintConfig.globals);
	Object.assign(config.settings, packageJson.eslintConfig.settings);
}

module.exports = config;
