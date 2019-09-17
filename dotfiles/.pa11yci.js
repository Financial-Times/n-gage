const extend = require('node.extend');
const querystring = require('querystring');
const { URL } = require('url');
const path = require('path');
const mkdirp = require('mkdirp');

const defaultViewPortSize = {
	width: 1280,
	height: 800
};

const parseEnvironmentViewPort = (viewportStr) => {
	const result = /w(\d{2,4})h(\d{2,4})/i.exec(viewportStr);
	if(!result || result.length < 3) {
		return null;
	}

	return {width: Number(result[1]), height: Number(result[2])};
};

const parseEnvironmentViewPorts = (env) => {
	if(!env.PA11Y_VIEWPORTS) {
		return []
	}

	return env.PA11Y_VIEWPORTS.split(',').map(parseEnvironmentViewPort).filter(v => v);
};

const viewports = [defaultViewPortSize].concat(parseEnvironmentViewPorts(process.env));

const smoke = require('./test/smoke.js');

const urls = [];

/**
 * Headers can be set:
 * - globally for all apps, in config.defaults.headers here
 * - per test, in smoke.js
 * Headers objects will be merged, cookies and flags will be concatenated
 * No flags allowed inside the cookie for easier merging: use the FT-Flags header instead
 */

const DEFAULT_COOKIE = 'secure=true';
const DEFAULT_FLAGS = 'ads:off,sourcepoint:off,cookieMessage:off';

// Add any global config (inc headers) here
const config = {
	defaults: {
		headers: {
			'Cookie': DEFAULT_COOKIE,
			'FT-Flags': DEFAULT_FLAGS
		},
		timeout: 50000,
		wait: process.env.PA11Y_WAIT || 300,
		hideElements: 'iframe[src*=google],iframe[src*=proxy],iframe[src*=doubleclick]',
		rules: ['Principle1.Guideline1_3.1_3_1_AAA']
	},
	urls: []
}


// What routes returning 200 in smoke.js should we not test?
// set per-project in PA11Y_ROUTE_EXCEPTIONS in config-vars
const exceptions = process.env.PA11Y_ROUTE_EXCEPTIONS ? process.env.PA11Y_ROUTE_EXCEPTIONS.split(',') : [];

// What elements should we not run pa11y on (i.e. google ad iFrames)
// set per-project in PA11Y_HIDE in config-vars
// Use with caution. May break the experience for users.
config.defaults.hideElements = process.env.PA11Y_HIDE ? `${process.env.PA11Y_HIDE},${config.defaults.hideElements}` : config.defaults.hideElements;

console.log('PA11Y_ROUTE_EXCEPTIONS:', process.env.PA11Y_ROUTE_EXCEPTIONS);
console.log('exceptions:', exceptions);
console.log('PA11Y_ROUTE_HEADERS:', process.env.PA11Y_ROUTE_HEADERS);
console.log('headers:', config.defaults.headers);
console.log('PA11Y_HIDE:', process.env.PA11Y_HIDE);
console.log('config.defaults.hideElements:', config.defaults.hideElements);

// Don't console.log headers once backend key is added to the object
config.defaults.headers['FT-Next-Backend-Key'] = process.env.FT_NEXT_BACKEND_KEY;


smoke.forEach((smokeConfig) => {
	for (let url in smokeConfig.urls) {

		let isException = false;

		exceptions.forEach((path) => {
			isException = isException || url.indexOf(path) !== -1;
		});

		const expectedStatus = typeof smokeConfig.urls[url] === 'number' ? smokeConfig.urls[url] : smokeConfig.urls[url].status;
		if (expectedStatus !== 200 || url === '/__health' || isException) {
			continue;
		}

		const thisUrl = {
			url: process.env.TEST_URL + url
		}

		// Do we have test-specific headers?
		if (smokeConfig.headers) {
			let fullCookie;
			let fullFlags;

			// Merge the headers
			thisUrl.headers = Object.assign({}, config.defaults.headers, smokeConfig.headers);

			// concatenate any test-specific cookies
			if (smokeConfig.headers.Cookie) {
				console.log('• merging cookies...');

				// Keep flags out of the cookie for easier merging
				if (smokeConfig.headers.Cookie.indexOf('flags') !== -1) {
					throw Error('please don\'t set any flags inside the Cookie. Use the \'FT-Flags\' header');
				}

				// Set the concatenated cookies
				thisUrl.headers.Cookie = smokeConfig.headers.Cookie + '; ' + config.defaults.headers.Cookie;
			}

			// concatenate any test-specific flags
			if (smokeConfig.headers['FT-Flags']) {
				console.log('• merging flags...');

				// Set the concatenated flags
				thisUrl.headers['FT-Flags'] = smokeConfig.headers['FT-Flags'] + ',' + config.defaults.headers['FT-Flags'];
			}
		}

		if (smokeConfig.method) thisUrl.method = smokeConfig.method;

		if (smokeConfig.body) {

			thisUrl.postData = (contentType => {
					switch(contentType) {
						case 'application/x-www-form-urlencoded':
							return querystring.stringify(smokeConfig.body);
						case 'application/json':
							return JSON.stringify(smokeConfig.body);
						default:
							return smokeConfig.body;
					}
				})(smokeConfig.headers['Content-Type']);

		}

		urls.push(thisUrl);
	}
});

for (let viewport of viewports) {

	for (let url of urls) {

		const resultUrl = extend(true, {viewport: viewport}, url);

		if (process.env.TEST_URL.includes('local')) {
			const pathname = new URL(resultUrl.url).pathname;
			const screenshotName = pathname.substring(1).replace(/\//g, '_');

			let appFlags = 'no-flags';

			if (resultUrl.headers) {
				const flags = resultUrl.headers['FT-Flags'];
				appFlags = flags.substring(0, flags.indexOf(DEFAULT_FLAGS) - 1);
			}

			const folderName = `/pa11y_screenCapture/${viewport.width}x${viewport.height}/${appFlags}`;

			mkdirp.sync(path.join(process.cwd(), folderName));
			resultUrl.screenCapture = `.${folderName}/${screenshotName || 'root'}.png`;

		}

		config.urls.push(resultUrl);

	}

}

module.exports = config;
