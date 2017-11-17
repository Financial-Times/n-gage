const config = {
	'plugins': [
		'stylelint-order',
		'stylelint-scss',
		'stylelint-property-unknown'
	],
	// The default severity is error
	'rules': {
		// disallow @debug
		'at-rule-blacklist': ['debug'],
		// 'value !important;' not 'value!important ;'
		'declaration-bang-space-before': 'always',
		'declaration-bang-space-after': 'never',
		// 'border: 0' not 'border: none'
		'declaration-property-value-blacklist': {
			'/^border/': ['none']
		},
		// //aabbcc good, //abc bad.Makes the codebase more searchable
		'color-hex-length': 'long',
		// require hex colors to be lowercase(if they include any of the letters a - f)
		'color-hex-case': [
			'lower',
			{ 'severity': 'warning' }
		],
		'color-no-invalid-hex': true,
		// declaration order: custom properties, variables, @extend, @include, @include {}, then nested rulesets
		// https://sass-guidelin.es/
		'order/order': [
			[
				'custom-properties',
				'dollar-variables',
				{
					'type': 'at-rule',
					'name': 'extend'
				},
				{
					'type': 'at-rule',
					'name': 'include',
					'hasBlock': false
				},
				'declarations',
				{
					'type': 'at-rule',
					'name': 'include',
					'hasBlock': true
				},
				'rules'
			],
			{ 'severity': 'warning' }
		],
		// Warn when the same property appears more than once in the same ruleset
		// This is not a deal breaker, as authors may repeat properties
		// in the case where both a value and its fallback are needed
		'declaration-block-no-duplicate-properties': [
			true,
			'ignore': [
				'consecutive-duplicates-with-different-values'
			],
			{ 'severity': 'warning' }
		],
		// '} else {' not '}\n else {'
		'at-else-empty-line-before': [
			'never',
			{ 'severity': 'warning' }
		],
		// Require a newline at the end of the file
		'no-missing-eof-newline': true,
		// Disallow using ID Selectors
		'selector-no-id': [
			true,
			{ 'severity': 'warning' }
		],
		// '@import 'path / to / partial'' not '@import 'path / to / _partial.scss''
		'at-import-no-partial-leading-underscore': [
			true,
			{ 'severity': 'warning' }
		],
		'at-import-partial-extension-blacklist': [
			['scss'],
			{ 'severity': 'warning' }
		],
		// Avoid using !important
		'declaration-no-important': [
			true,
			{ 'severity': 'warning' }
		],
		// 0.1 not .1 (differs from Guardian)
		'number-leading-zero': 'always',
		// Disallow more than one ruleset with the same selector in the same file
		'no-duplicate-selectors': [
			true,
			{ 'severity': 'warning' }
		],
		// Thou shall nest 3 levels deep maximum. Not 4, nor 5.
		'max-nesting-depth': [
			3,
			{ 'severity': 'warning' }
		],
		// @extend % placeholders, don't @extend .a-class
		'scss/at-extend-no-missing-placeholder': true,
		// Disallow unknown CSS property names
		'property-unknown': [
			true,
			{ 'severity': 'warning' }
		],
		// ::before not :before
		'selector-pseudo-element-colon-notation': [
			'double',
			{ 'severity': 'warning' }
		],
		// '.class, [foo]' not 'span.class, div[foo]'
		'selector-no-qualifying-type': true,
		// Limit selector depth
		// We decided to deal with this via peer review in
		// https://github.com/Financial-Times/ft-origami/issues/243
		'selector-max-compound-selectors': [
			3,
			{ 'severity': 'warning' }
		],
		// Allow lowercase only, but forbid non - alphanumeric characters
		// in selector names.
		'selector-class-pattern': '^[a-z0-9_\-]+$',
		// margin: 1px not margin: 1px 1px 1px 1px;
		'shorthand-property-no-redundant-values': true,
		// Disallow properties on the same line 'margin: 0; padding: 0;'
		// enable simple rules to be on a single line 'el { margin: 0; }'
		'declaration-block-semicolon-newline-after': 'always-multi-line',
		// Rulesets with multiple(comma delimited) selectors
		// must have each selector on a separate line
		'selector-list-comma-newline-after': 'always',
		// rgb(0, 0, 0) not rgb(0 ,0, 0)
		'function-comma-space-after': 'always',
		// margin: 0px not margin:0px
		'declaration-colon-space-after': 'always',
		// margin: 0px not margin :0px
		'declaration-colon-space-before': 'never',
		// .thing { not .thing{
		'block-opening-brace-space-before': 'always',
		// rgb(0, 0, 0) not rgb( 0, 0, 0 )
		'function-parentheses-space-inside': 'never',
		// Use single quotes, not double quotes
		// (AB: This really doesn't matter IMHO)
		// Differs from Guardian
		'string-quotes': [
			'single',
			{ 'severity': 'warning' }
		],
		// Every property value must end with a semicolon
		'declaration-block-trailing-semicolon': 'always',
		// 'margin: .5em;' not 'margin: .500em;'
		// No unnecessary fractions: 1 not 1.0
		'number-no-trailing-zeros': true,
		// No vendor prefixes
		// Ideally products should use autoprefixer or equivalent,
		// since we might eventually enable this linter
		'property-no-vendor-prefix': [
			true,
			{ 'severity': 'warning' }
		],
		'selector-no-vendor-prefix': [
			true,
			{ 'severity': 'warning' }
		],
		'media-feature-name-no-vendor-prefix': [
			true,
			{ 'severity': 'warning' }
		],
		'at-rule-no-vendor-prefix': [
			true,
			{ 'severity': 'warning' }
		],
		'value-no-vendor-prefix': [
			true,
			{ 'severity': 'warning' }
		],
		// Allow camelcase but forbid non - alphanumeric characters
		// in mixin, variable and function names.
		'scss/at-function-pattern': '^[a-z_][a-zA-Z0-9_\-]+$',
		// newlines between rulesets
		'rule-empty-line-before': [
			'always-multi-line',
			{
				'except': ['first-nested'],
				'ignore': ['after-comment']
			},
			{ 'severity': 'warning' }
		],
	}
};

module.exports = config;
