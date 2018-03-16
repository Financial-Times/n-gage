const fetch = require('@financial-times/n-fetch');

module.exports = async (keys) => {
	const { TEST_USER_TYPES, TEST_SESSIONS_URL, TEST_SESSIONS_API_KEY } = keys;
	if (!TEST_USER_TYPES || !TEST_SESSIONS_API_KEY || !TEST_SESSIONS_URL) {
		return keys;
	}

	const userTypes = TEST_USER_TYPES.split(',');
	return Promise.all(userTypes.map((type) => appendToken(keys, type.trim().toLowerCase(), TEST_SESSIONS_URL, TEST_SESSIONS_API_KEY)))
		.then(() => keys)
		.catch((e) => {
			console.error(e);
			console.log('Couldn\'t fetch the test session tokens. Please check TEST_SESSIONS_URL and TEST_SESSIONS_API_KEY environment variables.');
		});
};

const appendToken = async (keys, userType, url, apiKey) => {
	try {
		const tokens = await fetch(`${url}/${userType}?api_key=${apiKey}`);
		if (tokens.FTSession) {
			keys[`${userType.toUpperCase()}_FTSession`] = tokens.FTSession;
		}
		if (tokens.FTSession_s) {
			keys[`${userType.toUpperCase()}_FTSession_s`] = tokens.FTSession_s;
		}
	} catch (e) {
		console.error(e);
		console.log(`Couldn\'t fetch the test session tokens for '${userType}' user. Please check TEST_SESSIONS_URL and TEST_SESSIONS_API_KEY environment variables.`);
	}
};
